import { bound, shallowClone } from "rx-store-core";
import {
  Any,
  Comparator,
  Initiator,
  PluginImpl,
  RxNStore,
  RxStore,
  Subscribable,
} from "rx-store-types";
import {
  BehaviorSubject,
  Observable,
  catchError,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import {
  AsyncState,
  AsyncValidationNConfig,
  DatumType,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormStubs,
} from "./interfaces";

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

  private asyncConfig: AsyncValidationNConfig = {
    lazy: false,
    debounceDuration: 0,
  };

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
    this.defaultMeta = meta;
  }

  setAsyncConfig(cfg: AsyncValidationNConfig): void {
    this.asyncConfig = cfg;
  }

  private shallowCloneFormData() {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
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
          this.commitMutation(data, this.cast(connector));
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
      this.safeCommitMeta(meta);
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
      const casted = this.cast(connector);
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

  private getComparator(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    if (this.asyncConfig.compare) {
      return this.asyncConfig.compare;
    }
    const comparatorMap = connector.getComparatorMap();
    const specCompare = comparatorMap?.[this.id];
    return specCompare ? specCompare : connector.comparator;
  }

  private asyncValidatorExecutor(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    if (!this.asyncValidator) {
      return;
    }
    const subscription = connector
      .getDataSource()
      .pipe(
        map(
          (states) =>
            states[this.id]
              .filter(({ type }) => type === DatumType.ASYNC)
              .map(
                ({
                  type,
                  field,
                  value,
                  changed,
                  touched,
                  focused,
                  hovered,
                }) => ({
                  type,
                  field,
                  value,
                  changed,
                  touched,
                  focused,
                  hovered,
                })
              ) as {
              [K in keyof Record<S, () => F>]: ReturnType<
                Record<S, () => F>[K]
              >;
            }[S]
        ),
        distinctUntilChanged(this.getComparator(connector)),
        switchMap((formData) => {
          const oldMeta = this.getMeta();
          if (!formData.length) {
            return of(oldMeta);
          }

          this.setAsyncState(AsyncState.PENDING);
          const async$ = this.asyncValidator!(
            this.getFormData() as ReturnType<Record<S, () => F>[S]>,
            oldMeta
          );
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

  private cloneMetaByField<K extends keyof M>(field: K, meta: Partial<M>) {
    const plucked = meta[field];
    const clone = this.cloneFunctionMap?.[field];

    if (plucked) {
      if (clone) {
        return clone(plucked);
      }
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
  }

  @bound
  private cloneMeta(meta: Partial<M>) {
    const clone = this.cloneFunction;
    if (clone) {
      return clone(meta);
    }
    return (Object.getOwnPropertyNames(meta) as Array<keyof M>).reduce(
      (acc, next) => {
        acc[next] = this.cloneMetaByField(next, meta);
        return acc;
      },
      {} as Partial<M>
    );
  }

  private cast(connector: RxStore<Any> & Subscribable<Any>) {
    const casted = connector as unknown as RxNStore<Record<S, () => F>> &
      Subscribable<Record<S, () => F>>;
    return casted;
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
  getFormData<Ats extends Readonly<number[]> = number[]>(
    fields?: F[Ats[number]]["field"][]
  ) {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const form = casted.getState(this.id)!;
      if (fields) {
        const reduced = form.reduce((acc, next, i) => {
          const found = fields.find((field) => next.field === field);
          if (found) {
            acc.push(next);
          }
          return acc;
        }, [] as F[Ats[number]][]);
        return reduced;
      }
      return form;
    })!;
  }

  @bound
  getMeta() {
    return { ...this.metadata$?.value } as Partial<M>;
  }

  @bound
  getDatum<At extends number = number>(field: F[At]["field"]) {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      return this.findDatumByField(casted.getState(this.id), field) as F[At];
    });
  }

  @bound
  getDatumValue<At extends number = number>(field: F[At]["field"]) {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const value = this.findDatumByField(
        casted.getState(this.id),
        field
      )?.value;
      return value as F[At]["value"];
    });
  }

  @bound
  getClonedMetaByField<CF extends keyof Partial<M>>(field: CF) {
    const target = this.getMeta()[field];
    return target ? this.cloneMetaByField(field, target) : target;
  }

  @bound
  getClonedMeta() {
    return this.cloneMeta(this.getMeta());
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
      ?.pipe(map(this.cloneMeta), distinctUntilChanged(this.metaComparator))
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
        map((meta) => this.cloneMetaByField(field, meta)),
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
    const casted = this.cast(this.connector!);
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
    observer: (result: F[CompareAts[number]][]) => void,
    fields?: F[CompareAts[number]]["field"][],
    comparator?: Comparator<F[CompareAts[number]][]>
  ) {
    const casted = this.cast(this.connector!);
    if (casted) {
      const subscription = casted
        .getDataSource()
        .pipe(
          map((states) => states[this.id]),
          map((form) => {
            if (!fields) {
              return form;
            }
            return form.reduce((acc, next, i) => {
              const found = fields.find((field) => next.field === field);
              if (found) {
                acc.push(next);
              }
              return acc;
            }, [] as F[CompareAts[number]][]);
          }),
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
      const casted = this.cast(connector);
      const stopSyncValidation = this.validatorExecutor(casted);
      const stopAsyncValidation = this.asyncValidatorExecutor(casted);
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
      found.changed = true;
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
      const casted = this.cast(connector);
      const data = casted.getClonedState(this.id);
      this.appendDataByFields(fields, data);
      this.commitMutation(data, casted);
    });
    return this;
  }

  @bound
  removeFormData(fields: Array<F[number]["field"]>) {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
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
