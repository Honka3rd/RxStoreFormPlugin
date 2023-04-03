import { RxNStore, Subscribable } from "rx-store-types";
import {
  FormController,
  FormControlData,
  Any,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  AsyncState,
  FormStubs,
} from "./interfaces";
import {
  Observable,
  BehaviorSubject,
  distinctUntilChanged,
  switchMap,
  from,
  map,
  of,
  catchError,
  tap,
} from "rxjs";

class FormControllerImpl<
  F extends FormControlData,
  M extends Record<F[number]["field"], FormControlBasicMetadata>,
  S extends string
> implements FormController<F, M>
{
  private connector?: RxNStore<Any> & Subscribable<Any>;
  private metadata$?: BehaviorSubject<Partial<M>>;
  private unobserve?: () => void;
  private unobserveAsync?: () => void;
  private unobserveMeta?: () => void;

  constructor(
    private formSelector: S,
    public validator: (formData: F) => Partial<M>,
    public asyncValidator?: (
      formData: F
    ) => Observable<Partial<M>> | Promise<Partial<M>>,
    private fields?: FormStubs<F>,
    private metaComparator?: (meta1: Partial<M>, meta2: Partial<M>) => boolean
  ) {}

  private reportNoneConnectedError() {
    throw Error("initiator method is not called");
  }

  private safeExecute<R>(
    callback: (connector: RxNStore<Record<S, () => F>>) => R
  ) {
    const connector = this.connector as RxNStore<Record<S, () => F>> &
      Subscribable<Record<S, () => F>>;
    if (connector) {
      return callback(connector);
    }
    this.reportNoneConnectedError();
  }

  private shallowCloneFormData() {
    return this.safeExecute((connector) => {
      return connector.getClonedState(this.formSelector) as F;
    });
  }

  private safeClone(callback: (data: F) => F | void) {
    const cloned = this.shallowCloneFormData();
    if (cloned) {
      return callback(cloned);
    }
  }

  private findDatumByField(data: F, field: F[number]["field"]) {
    return data.find((datum) => datum.field === field);
  }

  private findFromClonedAndExecute(
    field: F[number]["field"],
    cloned: F,
    callback: <D extends FormControlBasicDatum>(found: D) => void
  ) {
    const found = this.findDatumByField(cloned, field);
    if (found) {
      callback(found);
    }
  }

  private commitMutation(data: F, connector: RxNStore<Record<S, () => F>>) {
    connector.setState({ [this.formSelector]: data } as {});
  }

  private safeCommitMutation<N extends number>(
    field: F[N]["field"],
    callback: (found: F[N], data: F) => void
  ) {
    this.safeExecute((connector) => {
      this.safeClone((data) => {
        this.findFromClonedAndExecute(field, data, (found: F[N]) => {
          callback({ ...found }, data);
          this.commitMutation(data, connector);
        });
      });
    });
  }

  private safeCommitMeta(meta: Partial<M>) {
    this.safeExecute(() => this.metadata$?.next(meta));
  }

  private removeDataByFields(fields: Array<F[number]["field"]>, data: F) {
    fields.forEach((field) => {
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
    });
  }

  private appendDataByFields(fields: FormStubs<F>, data: F) {
    fields.forEach(({ defaultValue, field }) => {
      data.push({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
      });
    });
  }

  private validatorExecutor(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    return connector.observe(this.formSelector, (formData) => {
      const meta = this.validator(formData);
      this.safeCommitMeta(meta);
    });
  }

  private setAsyncState(fields: F[number]["field"][], state: AsyncState) {
    this.safeExecute((connector) => {
      const cloned = connector.getClonedState(this.formSelector);
      fields.forEach((field) => {
        const found = cloned.find((c) => c.field === field);
        if (found) {
          found.asyncState = state;
        }
      });
      this.commitMutation(cloned, connector);
    });
  }

  getMeta() {
    return this.metadata$?.value;
  }

  getFieldMeta(field: F[number]["field"]) {
    return this.getMeta()?.[field];
  }

  getFieldsMeta(fields: F[number]["field"][]) {
    return fields.reduce((acc, next) => {
      acc[next] = this.getMeta()?.[next];
      return acc;
    }, {} as Partial<M>);
  }

  private asyncValidatorExecutor(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    if (!this.asyncValidator) {
      return;
    }
    const comparatorMap = connector.getComparatorMap();
    const specCompare = comparatorMap?.[this.formSelector];
    const compare = specCompare ? specCompare : connector.comparator;
    const subscription = connector
      .getDataSource()
      .pipe(
        map((states) => states[this.formSelector]),
        map(
          (formData) =>
            formData.filter(({ isAsync }) => isAsync) as {
              [K in keyof Record<S, () => F>]: ReturnType<
                Record<S, () => F>[K]
              >;
            }[S]
        ),
        distinctUntilChanged(compare),
        switchMap((asyncFormData) => {
          const asyncFields = asyncFormData.map(({ field }) => field);
          const syncMeta = this.getFieldsMeta(asyncFields);

          if (!asyncFormData.length) {
            return of(syncMeta);
          }

          this.setAsyncState(asyncFields, AsyncState.PENDING);
          const async$ = this.asyncValidator!(asyncFormData);
          const reduced$ = async$ instanceof Promise ? from(async$) : async$;
          return reduced$.pipe(
            catchError(() => {
              return of({
                success: false,
                meta: syncMeta,
              });
            }),
            map((meta) => {
              if ("success" in meta) {
                return meta;
              }
              return { success: true, meta };
            }),
            tap(({ success }) => {
              if (success) {
                this.setAsyncState(asyncFields, AsyncState.DONE);
                return;
              }
              this.setAsyncState(asyncFields, AsyncState.ERROR);
            }),
            map(({ meta, success }) => {
              if (!success) {
                return syncMeta;
              }
              return {
                ...syncMeta,
                ...meta,
              };
            })
          );
        })
      )
      .subscribe((meta) => meta && this.safeCommitMeta(meta));
    return () => subscription.unsubscribe();
  }

  getFormSelector() {
    return this.formSelector;
  }

  private observeMeta(callback: (meta: Partial<M>) => void) {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged(this.metaComparator))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  startObserve(callback: (meta: Partial<M>) => void) {
    this.safeExecute((connector) => {
      this.unobserve = this.validatorExecutor(
        connector as RxNStore<Record<S, () => F>> &
          Subscribable<Record<S, () => F>>
      );
      this.unobserveAsync = this.asyncValidatorExecutor(
        connector as RxNStore<Record<S, () => F>> &
          Subscribable<Record<S, () => F>>
      );
      this.unobserveMeta = this.observeMeta(callback);
    });
    return this;
  }

  stopObserve() {
    this.unobserve?.();
    this.unobserveAsync?.();
    this.unobserveMeta?.();
  }

  initiator(connector?: RxNStore<Any> & Subscribable<Any>) {
    if (connector && !this.connector) {
      this.connector = connector;
      this.metadata$ = new BehaviorSubject<Partial<M>>(
        this.validator(connector.getState(this.formSelector))
      );
    }

    if (this.fields) {
      return this.fields.map(({ field, defaultValue }) => ({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
      })) as F;
    }
    return [] as unknown as F;
  }

  changeFormDatum<N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) {
    this.safeCommitMutation(field, (found) => {
      found.value = value;
    });
    return this;
  }

  hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.hovered = hoverOrNot;
    });
    return this;
  }

  resetFormDatum<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator(), field);
      if (defaultDatum) {
        found.changed = defaultDatum.changed;
        found.empty = defaultDatum.empty;
        found.focused = defaultDatum.focused;
        found.hovered = defaultDatum.hovered;
        found.touched = defaultDatum.touched;
        found.value = defaultDatum.value;
        return this;
      }
      this.removeDataByFields([field], data);
    });
    return this;
  }

  resetFormAll() {
    this.safeExecute((connector) => {
      connector.reset(this.formSelector);
    });
    return this;
  }

  touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.touched = touchOrNot;
    });
    return this;
  }

  emptyFormField<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator(), field);
      if (defaultDatum) {
        found.empty = true;
        found.value = defaultDatum.value;
        return;
      }
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
    });
    return this;
  }

  focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.focused = focusOrNot;
    });
    return this;
  }

  private createFormDatum(
    fields: Array<{
      field: F[number]["field"];
      defaultValue?: F[number]["value"];
    }>
  ) {
    return this.safeExecute((connector) => {
      return this.safeClone((data) => {
        this.appendDataByFields(fields, data);
        return data;
      });
    });
  }

  private fieldsDiff(
    fields: Array<{
      field: F[number]["field"];
      defaultValue?: F[number]["value"];
    }>
  ) {
    const created: Array<{
      field: F[number]["field"];
      defaultValue?: F[number]["value"];
    }> = [];
    const removed: F[number]["field"][] = [];
    fields.forEach((datum) => {
      if (!Boolean(this.fields?.find((f) => f.field === datum.field))) {
        created.push(datum);
      }
    });

    this.fields?.forEach((datum) => {
      if (!Boolean(fields?.find((f) => f.field === datum.field))) {
        removed.push(datum.field);
      }
    });
    return {
      created,
      removed,
    };
  }

  updateFormFields(
    fields: Array<{
      field: F[number]["field"];
      defaultValue?: F[number]["value"];
    }>
  ) {
    const { created, removed } = this.fieldsDiff(fields);
    const createdData = this.createFormDatum(created);

    this.safeExecute((connector) => {
      const formData = connector.getClonedState(this.formSelector);
      removed.forEach((field) => {
        const delIndex = formData.findIndex((f) => f.field === field);
        if (delIndex > -1) {
          formData.splice(
            formData.findIndex((f) => f.field === field),
            1
          );
        }
      });
      createdData?.forEach((datum) => {
        formData.push(datum);
      });
      this.commitMutation(formData, connector);
    });

    return this;
  }
}

export default FormControllerImpl;
