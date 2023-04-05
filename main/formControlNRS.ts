import {
  RxNStore,
  RxStore,
  Subscribable,
  Plugin,
  Any,
  Initiator,
} from "rx-store-types";
import {
  FormController,
  FormControlData,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  AsyncState,
  FormStubs,
  DatumType,
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
> implements FormController<F, M, S>, Plugin<S>
{
  private connector?: RxNStore<Any> & Subscribable<Any>;
  private metadata$?: BehaviorSubject<Partial<M>>;

  constructor(
    private formSelector: S,
    public validator: (formData: F) => Partial<M>,
    public asyncValidator?: (
      formData: F
    ) => Observable<Partial<M>> | Promise<Partial<M>>,
    private fields?: FormStubs<F>,
    private metaComparator?: (meta1: Partial<M>, meta2: Partial<M>) => boolean,
    private metaComparatorMap?: {
      [K in keyof Partial<M>]: (
        m1: Partial<M>[K],
        m2: Partial<M>[K]
      ) => boolean;
    },
    private cloneFunction?: (meta: Partial<M>) => Partial<M>,
    private cloneFunctionMap?: {
      [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }
  ) {
    this.initiator
  }

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
    fields.forEach(({ defaultValue, field, type }) => {
      data.push({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        type: type ? type : DatumType.SYNC,
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

  private getExcludedMeta(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    const excluded = connector
      .getState(this.formSelector)
      .filter(({ type }) => type === DatumType.EXCLUDED)
      .map(({ field }) => field);
    return this.getFieldsMeta(excluded);
  }

  private getAsyncFields = (connector: RxNStore<Record<S, () => F>>) => {
    return connector
      .getState(this.formSelector)
      .filter(({ type }) => type === DatumType.ASYNC)
      .map(({ field }) => field);
  };

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
        distinctUntilChanged(compare),
        map(
          (formData) =>
            formData.filter(({ type }) => type === DatumType.ASYNC) as {
              [K in keyof Record<S, () => F>]: ReturnType<
                Record<S, () => F>[K]
              >;
            }[S]
        ),

        switchMap((asyncFormData) => {
          if (!asyncFormData.length) {
            return of(this.getMeta());
          }

          this.setAsyncState(AsyncState.PENDING);
          const async$ = this.asyncValidator!(asyncFormData);
          const reduced$ = async$ instanceof Promise ? from(async$) : async$;
          return reduced$.pipe(
            catchError(() => {
              return of({
                success: false,
                meta: this.getMeta(),
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
                this.setAsyncState(AsyncState.DONE);
                return;
              }
              this.setAsyncState(AsyncState.ERROR);
            }),
            map(({ meta, success }) => {
              if (!success) {
                return meta;
              }
              return {
                ...this.getMeta(),
                ...meta,
                ...this.getExcludedMeta(connector),
              };
            })
          );
        })
      )
      .subscribe((meta) => meta && this.safeCommitMeta(meta));
    return () => subscription.unsubscribe();
  }

  selector() {
    return this.formSelector;
  }

  initiator: FormController<F, M, S>["initiator"] = (connector) => {
    if (connector && !this.connector) {
      this.initiator.selector = this.formSelector;
      this.connector = connector as RxNStore<Any> & Subscribable<Any>;
      this.metadata$ = new BehaviorSubject<Partial<M>>(
        this.validator(connector.getState(this.formSelector))
      );
    }

    if (this.fields) {
      return this.fields.map(({ field, defaultValue, type }) => ({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        type: type ? type : DatumType.SYNC,
      })) as F;
    }
    return [] as unknown as F;
  }

  chain<I extends Initiator<string>[]>(...initiators: I) {
    this.safeExecute((connector) => {
      initiators.forEach((initiator) => {
        initiator(connector as unknown as RxStore<Any> & Subscribable<Any>);
        initiator.selector = this.selector();
      });
    });

    return this;
  }

  private setAsyncState(state: AsyncState) {
    this.safeExecute((connector) => {
      const cloned = connector.getClonedState(this.formSelector);
      this.getAsyncFields(connector).forEach((field) => {
        const found = cloned.find((c) => c.field === field);
        if (found) {
          found.asyncState = state;
        }
      });
      this.commitMutation(cloned, connector);
    });
  }

  getMeta() {
    return { ...this.metadata$?.value } as Partial<M>;
  }

  getClonedMetaByField(field: keyof Partial<M>) {
    const meta = this.getMeta();
    const clone = this.cloneFunctionMap?.[field]
      ? this.cloneFunctionMap[field]
      : this.cloneFunction;
    const target = meta[field];
    if (clone && target) {
      return clone(target);
    }

    const defaultClone = this.connector?.cloneFunction;
    if (defaultClone) {
      return defaultClone(target);
    }

    return target;
  }

  getFieldMeta(field: F[number]["field"]) {
    return this.getMeta()?.[field];
  }

  getFieldsMeta(fields: F[number]["field"][]) {
    return fields.reduce((acc, next) => {
      const meta = this.getMeta()?.[next];
      if (meta !== undefined) {
        acc[next] = meta;
      }
      return acc;
    }, {} as Partial<M>);
  }

  observeMeta(callback: (meta: Partial<M>) => void) {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged(this.metaComparator))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Partial<M>[K]) => void
  ) {
    const subscription = this.metadata$
      ?.pipe(
        map((meta) => meta[field]),
        distinctUntilChanged(this.metaComparatorMap?.[field])
      )
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  startValidation() {
    return this.safeExecute((connector) => {
      const stopSyncValidation = this.validatorExecutor(
        connector as RxNStore<Record<S, () => F>> &
          Subscribable<Record<S, () => F>>
      );
      const stopAsyncValidation = this.asyncValidatorExecutor(
        connector as RxNStore<Record<S, () => F>> &
          Subscribable<Record<S, () => F>>
      );
      return {
        stopSyncValidation,
        stopAsyncValidation,
      };
    });
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

  changeFieldType<N extends number>(field: F[N]["field"], type: DatumType) {
    this.safeCommitMutation(field, (found) => {
      found.type = type;
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

  appendFormData(fields: FormStubs<F>) {
    this.safeExecute((connector) => {
      const data = connector.getClonedState(this.formSelector);
      this.appendDataByFields(fields, data);
      this.commitMutation(data, connector);
    });
  }

  removeFormData(fields: Array<F[number]["field"]>) {
    this.safeExecute((connector) => {
      const data = connector.getClonedState(this.formSelector);
      this.removeDataByFields(fields, data);
      this.commitMutation(data, connector);
    });
  }

  setMetadata(meta: Partial<M>) {
    this.safeExecute(() => {
      this.metadata$?.next({ ...this.metadata$.value, ...meta });
    });
  }

  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]) {
    this.safeExecute(() => {
      const meta = this.getMeta();
      meta[field] = metaOne;
      this.metadata$?.next(meta);
    });
  }
}

export default FormControllerImpl;
