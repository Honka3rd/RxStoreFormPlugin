import { bound, shallowClone, shallowCompare } from "rx-store-core";
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
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  exhaustMap,
  from,
  iif,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import {
  $Validator,
  AsyncState,
  AsyncValidationNConfig,
  DatumType,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormStubs,
} from "./interfaces";
import { Subscriptions } from "./subscriptions";

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
  private fields?: FormStubs<F, M>;
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
    public validator: (formData: F, metadata: Partial<M>) => Partial<M>,
    private subscriptions: Subscriptions
  ) {
    super(id);
  }

  setBulkAsyncValidator(
    asyncValidator: (
      formData: F,
      metadata: Partial<M>
    ) => Observable<Partial<M>> | Promise<Partial<M>>
  ) {
    if (!this.asyncValidator) {
      this.asyncValidator = asyncValidator;
    }
  }

  private getFieldSource(
    field: F[number]["field"],
    datumKeys: Array<keyof F[number]> = [],
    comparator?: (v1: any, v2: any) => boolean
  ): Observable<ReturnType<Record<S, () => F>[S]>[number] | undefined> {
    return this.cast(this.connector!)
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        distinctUntilChanged(this.getComparator(this.cast(this.connector!))),
        map((formData: ReturnType<Record<S, () => F>[S]>) =>
          formData.find((f) => f.field === field)
        ),
        // @ts-ignore
        ...datumKeys.map((key) => distinctUntilKeyChanged(key)),
        distinctUntilChanged(comparator)
      );
  }

  private getSingleSource(
    $validator: FormStubs<F, M>[number]["$validator"],
    fieldData: ReturnType<Record<S, () => F>[S]>[number]
  ) {
    const source = $validator!(
      fieldData,
      this.getMeta,
      this.getFormData
    );
    return source instanceof Promise ? from(source) : source;
  }

  private connect(lazy?: boolean) {
    return lazy ? exhaustMap : switchMap;
  }

  private listenToExcludedAll(fields: FormStubs<F, M>) {
    this.subscriptions.pushAll(
      fields
        .filter(
          ({ type, $validator }) => type === DatumType.EXCLUDED && $validator
        )
        .map(
          ({
            field,
            $validator,
            lazy,
            debounceDuration,
            datumKeys,
            comparator,
          }) => ({
            id: field,
            subscription: this.getFieldSource(field, datumKeys, comparator)
              .pipe(
                debounceTime(Number(debounceDuration)),
                tap(() => {
                  this.commitMetaAsyncIndicator([field], AsyncState.PENDING);
                }),
                this.connect(lazy)((fieldData) =>
                  iif(
                    () => Boolean(fieldData),
                    this.getSingleSource($validator, fieldData!),
                    of(this.getMeta())
                  )
                ),
                catchError(() => {
                  return of(
                    this.getChangedMetaAsync([field], AsyncState.ERROR)
                  );
                })
              )
              .subscribe((meta) => {
                this.commitMetaAsyncIndicator(
                  [field],
                  AsyncState.DONE,
                  meta,
                  (found) => {
                    return (
                      !found?.asyncIndicator ||
                      found.asyncIndicator === AsyncState.PENDING
                    );
                  }
                );
              }),
          })
        )
    );
  }

  setFields(fields: FormStubs<F, M>) {
    if (!this.fields) {
      this.fields = fields;
    }
  }

  getFields(): FormStubs<F, M> {
    if (!this.fields) {
      throw new Error("Fields information has not been set");
    }
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

  @bound
  private safeCommitMeta(meta: Partial<M>) {
    this.safeExecute(() => this.metadata$?.next(meta));
  }

  private removeDataByFields(fields: Array<F[number]["field"]>, data: F) {
    fields.forEach((field) => {
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
      this.subscriptions.remove(field);
    });
    fields.forEach((field) => this.subscriptions.remove(field));
  }

  private appendDataByFields(fields: FormStubs<F, M>, data: F) {
    fields.forEach(({ defaultValue, field, type, lazy, $validator }) => {
      data.push({
        field,
        touched: false,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        type: type ? type : DatumType.SYNC,
        lazy,
      });
      if (type === DatumType.EXCLUDED && $validator) {
        this.listenToExcludedAll([
          {
            field,
            type,
            $validator,
          },
        ]);
      }
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

  private getExcludedFields(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    return connector
      .getState(this.id)
      .filter(({ type }) => type === DatumType.EXCLUDED)
      .map(({ field }) => field);
  }

  private getExcludedMeta(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>
  ) {
    const excluded = this.getExcludedFields(connector);
    return this.getFieldsMeta(excluded);
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

  private getChangedMetaAsync(
    fields: F[number]["field"][],
    indicator: AsyncState,
    meta?: Partial<M>,
    condition?: (found: Partial<M>[F[number]["field"]]) => boolean
  ) {
    const reduced = fields.reduce(
      (meta, next) => {
        const found = meta[next];
        if (found) {
          if (condition) {
            if (condition(found)) {
              found.asyncIndicator = indicator;
            }
          } else {
            found.asyncIndicator = indicator;
          }
        }
        return meta;
      },
      meta ? { ...this.getMeta(), ...meta } : this.getMeta()
    );
    return reduced;
  }

  private commitMetaAsyncIndicator(
    fields: F[number]["field"][],
    indicator: AsyncState,
    meta?: Partial<M>,
    condition?: (found: Partial<M>[F[number]["field"]]) => boolean
  ) {
    const reduced = this.getChangedMetaAsync(
      fields,
      indicator,
      meta,
      condition
    );
    this.safeCommitMeta(reduced);
  }

  private getAsyncFields() {
    return this.getFormData()
      .filter(({ type }) => type === DatumType.ASYNC)
      .map(({ field }) => field);
  }

  private asyncValidatorExecutor(
    connector: RxNStore<Record<S, () => F>> & Subscribable<Record<S, () => F>>,
    lazy?: boolean
  ) {
    if (!this.asyncValidator) {
      return;
    }
    const subscription = connector
      .getDataSource()
      .pipe(
        map(
          (states) =>
            states[this.id].filter(({ type }) => type === DatumType.ASYNC) as {
              [K in keyof Record<S, () => F>]: ReturnType<
                Record<S, () => F>[K]
              >;
            }[S]
        ),
        distinctUntilChanged(this.getComparator(connector)),
        tap((formData) => {
          this.commitMetaAsyncIndicator(
            formData.map(({ field }) => field),
            AsyncState.PENDING
          );
        }),
        this.connect(lazy)((formData) => {
          const oldMeta = this.getMeta();
          if (!formData.length) {
            return of(oldMeta);
          }
          const async$ = this.asyncValidator!(
            this.getFormData() as ReturnType<Record<S, () => F>[S]>,
            oldMeta
          );
          const reduced$ = async$ instanceof Promise ? from(async$) : async$;
          return reduced$.pipe(
            map((meta) => {
              return {
                ...this.getMeta(),
                ...meta,
                ...this.getExcludedMeta(connector),
              };
            })
          );
        }),
        catchError(() =>
          of({
            ...this.getMeta(),
            ...this.getChangedMetaAsync(
              this.getAsyncFields(),
              AsyncState.ERROR
            ),
            ...this.getExcludedMeta(connector),
          })
        )
      )
      .subscribe((meta) => {
        this.commitMetaAsyncIndicator(
          this.getAsyncFields(),
          AsyncState.DONE,
          meta,
          (found) => {
            return (
              !found?.asyncIndicator ||
              found.asyncIndicator === AsyncState.PENDING
            );
          }
        );
      });
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
      return this.fields.map(({ field, defaultValue, type, lazy }) => ({
        field,
        touched: false,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        type: type ? type : DatumType.SYNC,
        lazy,
      })) as F;
    }
    return [] as unknown as F;
  };

  @bound
  getFormData<Ats extends Readonly<number[]> = number[]>(
    fields?: F[Ats[number]]["field"][]
  ): F {
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
        return reduced as F;
      }
      return form as F
    })!;
  }

  @bound
  getMeta() {
    return { ...this.metadata$?.value } as M;
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
  getFieldsMeta<KS extends Array<keyof M>>(fields: KS) {
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
      ?.pipe(
        map(this.cloneMeta),
        distinctUntilChanged(
          this.metaComparator ? this.metaComparator : (v1, v2) => v1 === v2
        )
      )
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Partial<M>[K]) => void
  ) {
    const comparator = this.metaComparatorMap?.[field];
    const subscription = this.metadata$
      ?.pipe(
        map((meta) => this.cloneMetaByField(field, meta)),
        distinctUntilChanged(comparator ? comparator : shallowCompare)
      )
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByFields<KS extends Array<keyof M>>(
    fields: KS,
    callback: (meta: Partial<M>) => void,
    comparator?: (meta1: Partial<M>, meta2: Partial<M>) => boolean
  ) {
    const subscription = this.metadata$
      ?.pipe(
        map((meta) =>
          fields.reduce((acc, next) => {
            acc[next] = this.cloneMetaByField(next, meta);
            return acc;
          }, {} as Partial<M>)
        ),
        distinctUntilChanged(comparator ? comparator : (v1, v2) => v1 === v2)
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
    const casted = this.cast(this.connector!);
    if (casted) {
      const subscription = casted
        .getDataSource()
        .pipe(
          map((states) => states[this.id]),
          map((form) => this.findDatumByField(form, field)!),
          distinctUntilChanged(comparator ? comparator : shallowCompare)
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
          distinctUntilChanged(comparator ? comparator : shallowCompare)
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
          distinctUntilChanged(comparator ? comparator : shallowCompare)
        )
        .subscribe(observer);
      return () => subscription.unsubscribe();
    }
    return () => {};
  }

  @bound
  startValidation(lazy?: boolean) {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const stopSyncValidation = this.validatorExecutor(casted);
      const stopAsyncValidation = this.asyncValidatorExecutor(casted, lazy);
      this.listenToExcludedAll(this.getFields());
      return () => {
        stopSyncValidation();
        stopAsyncValidation?.();
        this.subscriptions.removeAll();
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
  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType,
    $validator?: $Validator<F[N], M, F>
  ) {
    this.safeCommitMutation(field, (found) => {
      if (type === DatumType.EXCLUDED && found.type !== DatumType.EXCLUDED) {
        this.listenToExcludedAll([
          {
            field,
            type,
            $validator,
          },
        ]);
      }

      if (found.type === DatumType.EXCLUDED && type !== DatumType.EXCLUDED) {
        this.subscriptions.remove(field);
      }
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
        found.lazy = defaultDatum.lazy;
        return this;
      }
      this.removeDataByFields([field], data);
    });
    return this;
  }

  @bound
  resetFormAll() {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const data: F = this.initiator()!;
      const excluded = this.getExcludedFields(casted);
      excluded.forEach((e) => {
        const target = data.find(({ field }) => e === field);
        if (!target) {
          this.subscriptions.remove(e);
          return;
        }

        if (target && target.type !== DatumType.EXCLUDED) {
          this.subscriptions.remove(e);
        }
      });
      casted.reset(this.id);
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
  appendFormData(fields: FormStubs<F, M>) {
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
      if(!metaOne) {
        return this;
      }
      meta[field] = metaOne;
      this.metadata$?.next({ ...meta });
    });
    return this;
  }

  @bound
  toFormData() {
    return (form?: HTMLFormElement) => {
      return (this.getFormData() as ReturnType<Record<S, () => F>[S]>).reduce(
        (acc, { field, value }) => {
          if (field) {
            acc.append(
              field,
              value instanceof Blob || typeof value === "string"
                ? value
                : String(value)
            );
          }
          return acc;
        },
        new FormData(form)
      );
    };
  }
}

export default FormControllerImpl;
