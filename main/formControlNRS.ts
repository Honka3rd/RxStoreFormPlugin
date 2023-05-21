import {
  RxNStore,
  Subscribable,
  Any,
  Initiator,
  PluginImpl,
  Comparator,
} from "rx-store-types";
import { bound, shallowClone } from "rx-store-core";
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
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string
  >
  extends PluginImpl<S, F>
  implements FormController<F, M, S>
{
  private metadata$?: BehaviorSubject<Partial<M>>;
  public asyncValidator?: (
    formData: F,
    metadata: Partial<M>
  ) => Observable<Partial<M>> | Promise<Partial<M>>;
  private fields: FormStubs<F> = [];
  private metaComparator?: (meta1: Partial<M>, meta2: Partial<M>) => boolean;
  private metaComparatorMap?: {
    [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
  };
  private cloneFunction?: (meta: Partial<M>) => Partial<M>;
  private cloneFunctionMap?: {
    [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
  };

  private defaultMeta?: Partial<M>;

  constructor(
    id: S,
    public validator: (formData: F, metadata: Partial<M>) => Partial<M>
  ) {
    super(id);
  }

  setAsyncValidator(
    asyncValidator: (
      formData: F,
      metadata: Partial<M>
    ) => Observable<Partial<M>> | Promise<Partial<M>>
  ) {
    if (!this.asyncValidator) {
      this.asyncValidator = asyncValidator;
    }
  }

  setFields(fields: FormStubs<F>) {
    this.fields = fields;
  }

  getFields(): FormStubs<F> {
    return this.fields;
  }

  setMetaComparator(
    metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean
  ) {
    if (!this.metaComparator) {
      this.metaComparator = metaComparator;
    }
  }

  setMetaComparatorMap(metaComparatorMap: {
    [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
  }) {
    if (!this.metaComparatorMap) {
      this.metaComparatorMap = metaComparatorMap;
    }
  }

  setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>) {
    if (!this.cloneFunction) {
      this.cloneFunction = cloneFunction;
    }
  }

  setMetaCloneFunctionMap(cloneFunctionMap: {
    [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
  }) {
    if (!this.cloneFunctionMap) {
      this.cloneFunctionMap = cloneFunctionMap;
    }
  }

  setDefaultMeta(meta: Partial<M>) {
    if (!this.defaultMeta) {
      this.defaultMeta = meta;
    }
  }

  private shallowCloneFormData() {
    return this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      return casted.getClonedState(this.id) as F;
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
    connector.setState({ [this.id]: data } as {});
  }

  private safeCommitMutation<N extends number>(
    field: F[N]["field"],
    callback: (found: F[N], data: F) => void
  ) {
    this.safeExecute((connector) => {
      this.safeClone((data) => {
        this.findFromClonedAndExecute(field, data, (found: F[N]) => {
          const cloned = { ...found };
          data.splice(data.indexOf(found), 1, cloned);
          callback(cloned, data);
          const casted = connector as unknown as RxNStore<Record<S, () => F>>;
          this.commitMutation(data, casted);
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
    return connector.observe(this.id, (formData) => {
      const meta = this.validator(formData, this.getMeta());
      this.safeCommitMeta(shallowClone(meta));
    });
  }

  private getExcludedMeta(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    const excluded = connector
      .getState(this.id)
      .filter(({ type }) => type === DatumType.EXCLUDED)
      .map(({ field }) => field);
    return this.getFieldsMeta(excluded);
  }

  private getAsyncFields = (connector: RxNStore<Record<S, () => F>>) => {
    return connector
      .getState(this.id)
      .filter(({ type }) => type === DatumType.ASYNC)
      .map(({ field }) => field);
  };

  private setAsyncState(state: AsyncState) {
    this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      const cloned = casted.getClonedState(this.id);
      this.getAsyncFields(casted).forEach((field) => {
        const found = cloned.find((c) => c.field === field);
        if (found) {
          found.asyncState = state;
        }
      });
      this.commitMutation(cloned, casted);
    });
  }

  private asyncValidatorExecutor(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    if (!this.asyncValidator) {
      return;
    }
    const comparatorMap = connector.getComparatorMap();
    const specCompare = comparatorMap?.[this.id];
    const compare = specCompare ? specCompare : connector.comparator;
    const subscription = connector
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
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
          const oldMeta = this.getMeta();
          if (!asyncFormData.length) {
            return of(oldMeta);
          }

          this.setAsyncState(AsyncState.PENDING);
          const async$ = this.asyncValidator!(asyncFormData, oldMeta);
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

  initiator: Initiator<F> = (connector) => {
    if (connector && !this.connector) {
      this.connector = connector as RxNStore<Any> & Subscribable<Any>;
      this.metadata$ = new BehaviorSubject<Partial<M>>(
        this.validator(
          connector.getState(this.id),
          this.defaultMeta ? this.defaultMeta : this.getMeta()
        )
      );
      return;
    }

    if (this.fields) {
      return this.fields.map(({ field, defaultValue, type }) => ({
        field,
        touched: false,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        type: type ? type : DatumType.SYNC,
      })) as F;
    }
    return [] as unknown as F;
  };

  @bound
  getMeta() {
    return { ...this.metadata$?.value } as Partial<M>;
  }

  @bound
  getDatum<At extends number = number>(field: F[At]["field"]) {
    return this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      return this.findDatumByField(casted.getState(this.id), field);
    });
  }

  @bound
  getDatumValue<At extends number = number>(field: F[At]["field"]) {
    return this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      const value = this.findDatumByField(
        casted.getState(this.id),
        field
      )?.value;
      return value as F[At]["value"];
    });
  }

  @bound
  getClonedMetaByField<CF extends keyof Partial<M>>(field: CF) {
    const meta = this.getMeta();
    const clone = this.cloneFunctionMap?.[field]
      ? this.cloneFunctionMap[field]
      : this.cloneFunction;
    const target = meta[field];
    if (clone && target) {
      return clone(target) as Partial<M>[CF];
    }
    const casted = this.connector as unknown as RxNStore<Record<S, () => F>>;
    const defaultClone = casted?.cloneFunction;
    if (defaultClone) {
      return defaultClone(
        target as ReturnType<Record<S, () => F>[S]>
      ) as Partial<M>[CF];
    }

    return target;
  }

  @bound
  getFieldMeta<At extends number = number>(field: F[At]["field"]) {
    return this.getMeta()?.[field];
  }

  @bound
  getFieldsMeta<At extends number = number>(fields: F[At]["field"][]) {
    return fields.reduce((acc, next) => {
      const meta = this.getMeta()?.[next];
      if (meta !== undefined) {
        acc[next] = meta;
      }
      return acc;
    }, {} as Partial<M>);
  }

  @bound
  observeMeta(callback: (meta: Partial<M>) => void) {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged(this.metaComparator))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Partial<M>[K]) => void
  ) {
    const subscription = this.metadata$
      ?.pipe(
        map((meta) => {
          const plucked = meta[field];
          if (plucked) {
            const cloned = {} as unknown as NonNullable<Partial<M>[K]>;
            cloned.errors = shallowClone(plucked.errors);
            if (plucked.info) {
              cloned.info = shallowClone(plucked.info);
            }
            if (plucked.warn) {
              cloned.warn = shallowClone(plucked.warn);
            }
            return cloned;
          }
          return plucked;
        }),
        distinctUntilChanged(this.metaComparatorMap?.[field])
      )
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeFormDatum<CompareAt extends number = number>(
    field: F[CompareAt]["field"],
    observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]) => void,
    comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]>
  ) {
    const casted = this.connector as unknown as RxNStore<Record<S, () => F>>;
    if (casted) {
      const subscription = casted
        .getDataSource()
        .pipe(
          map((states) => states[this.id]),
          map((form) => this.findDatumByField(form, field)!),
          distinctUntilChanged(comparator)
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    }
    return () => {};
  }

  @bound
  observeFormValue<CompareAt extends number = number>(
    field: F[CompareAt]["field"],
    observer: (
      result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]
    ) => void,
    comparator?: Comparator<
      ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]
    >
  ) {
    const casted = this.connector as unknown as RxNStore<Record<S, () => F>>;
    if (casted) {
      const subscription = casted
        .getDataSource()
        .pipe(
          map((states) => states[this.id]),
          map((form) => this.findDatumByField(form, field)!.value),
          distinctUntilChanged(comparator)
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    }
    return () => {};
  }

  @bound
  observeFormData<CompareAts extends Readonly<number[]> = number[]>(
    fields: F[CompareAts[number]]["field"][],
    observer: (result: F[CompareAts[number]][]) => void,
    comparator?: Comparator<F[CompareAts[number]][]>
  ) {
    const casted = this.connector as unknown as RxNStore<Record<S, () => F>>;
    if (casted) {
      const subscription = casted
        .getDataSource()
        .pipe(
          map((states) => states[this.id]),
          map((form) =>
            form.reduce((acc, next, i) => {
              const found = fields.find((field) => next.field === field);
              if (found) {
                acc.push(next);
              }
              return acc;
            }, [] as F[CompareAts[number]][])
          ),
          distinctUntilChanged(comparator)
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    }
    return () => {};
  }

  @bound
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
      return () => {
        stopSyncValidation();
        stopAsyncValidation?.();
      };
    });
  }

  @bound
  changeFormValue<N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) {
    this.safeCommitMutation(field, (found) => {
      found.value = value;
    });
    return this;
  }

  @bound
  hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.hovered = hoverOrNot;
    });
    return this;
  }

  @bound
  changeFieldType<N extends number>(field: F[N]["field"], type: DatumType) {
    this.safeCommitMutation(field, (found) => {
      found.type = type;
    });
    return this;
  }

  @bound
  resetFormDatum<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator()!, field);
      if (defaultDatum) {
        found.changed = false;
        found.focused = false;
        found.hovered = false;
        found.touched = false;
        found.value = defaultDatum.value;
        return this;
      }
      this.removeDataByFields([field], data);
    });
    return this;
  }

  @bound
  resetFormAll() {
    this.safeExecute((connector) => {
      connector.reset(this.id);
    });
    return this;
  }

  @bound
  touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.touched = touchOrNot;
    });
    return this;
  }

  @bound
  emptyFormField<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator()!, field);
      if (defaultDatum) {
        found.value = defaultDatum.value;
        return this;
      }
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
    });
    return this;
  }

  @bound
  focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.focused = focusOrNot;
    });
    return this;
  }

  @bound
  appendFormData(fields: FormStubs<F>) {
    this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      const data = casted.getClonedState(this.id);
      this.appendDataByFields(fields, data);
      this.commitMutation(data, casted);
    });
    return this;
  }

  @bound
  removeFormData(fields: Array<F[number]["field"]>) {
    this.safeExecute((connector) => {
      const casted = connector as unknown as RxNStore<Record<S, () => F>>;
      const data = casted.getClonedState(this.id);
      this.removeDataByFields(fields, data);
      this.commitMutation(data, casted);
    });
    return this;
  }

  @bound
  setMetadata(meta: Partial<M>) {
    this.safeExecute(() => {
      this.metadata$?.next({ ...this.metadata$.value, ...meta });
    });
    return this;
  }

  @bound
  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]) {
    this.safeExecute(() => {
      const meta = this.getMeta();
      meta[field] = metaOne;
      this.metadata$?.next({ ...meta });
    });
    return this;
  }
}

export default FormControllerImpl;
