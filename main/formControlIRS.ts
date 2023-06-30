import {
  Any,
  Initiator,
  PluginImpl,
  RxImStore,
  RxStore,
  Subscribable,
} from "rx-store-types";
import {
  $ImmutableValidator,
  AsyncState,
  AsyncValidationConfig,
  DatumType,
  FormControlBasicMetadata,
  FormControlData,
  FormStubs,
  ImmutableFormController,
  ImmutableMeta,
  ImmutableMetaDatum,
  K,
  PK,
  PV,
  V,
} from "./interfaces";
import { List, Map, fromJS, is, merge } from "immutable";
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  from,
  iif,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import { bound } from "rx-store-core";
import { Subscriptions } from "./subscriptions";

export class ImmutableFormControllerImpl<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string
  >
  extends PluginImpl<S, F>
  implements ImmutableFormController<F, M, S>
{
  private asyncConfig: AsyncValidationConfig = {
    lazy: false,
    debounceDuration: 0,
  };

  private metadata$?: BehaviorSubject<ImmutableMeta<F, M>>;
  private fields?: FormStubs<F>;
  private defaultMeta?: ImmutableMeta<F, M>;

  asyncValidator?: (
    formData: List<Map<keyof F[number], V<F[number]>>>,
    meta: ImmutableMeta<F, M>
  ) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>;

  constructor(
    id: S,
    public validator: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: ImmutableMeta<F, M>
    ) => ImmutableMeta<F, M>,
    private subscriptions: Subscriptions
  ) {
    super(id);
  }

  setFields(fields: FormStubs<F>) {
    if (!this.fields) {
      this.fields = fields;
      this.listenToExcludedAll(fields);
    }
  }

  getFields(): FormStubs<F> {
    if (!this.fields) {
      throw new Error("Fields information has not been set");
    }
    return this.fields;
  }

  setDefaultMeta(meta: Partial<M>): void {
    this.defaultMeta = fromJS(meta) as Map<
      PK<M>,
      Map<"errors" | "info" | "warn", any>
    >;
  }

  setAsyncConfig(cfg: AsyncValidationConfig): void {
    this.asyncConfig = cfg;
  }

  private partialCompare(
    datumKeys: Array<keyof F[number]>,
    previous?: Map<keyof F[number], V<F[number]>>,
    next?: Map<keyof F[number], V<F[number]>>
  ) {
    const partialPrevious = Map<keyof F[number], V<F[number]>>().withMutations(
      (mutation) => {
        datumKeys.forEach((k) => {
          const target = previous?.get(k);
          target && mutation.set(k, target);
        });
      }
    );

    const partialNext = Map<keyof F[number], V<F[number]>>().withMutations(
      (mutation) => {
        datumKeys.forEach((k) => {
          const target = next?.get(k);
          target && mutation.set(k, target);
        });
      }
    );

    return partialNext.equals(partialPrevious);
  }

  private getFieldSource(
    field: F[number]["field"],
    datumKeys?: Array<keyof F[number]>
  ) {
    return this.cast(this.connector!)
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        distinctUntilChanged((f1, f2) => is(f1, f2)),
        map((formData) => formData.find((f) => f.get("field") === field)),
        distinctUntilChanged(
          datumKeys
            ? (field1, field2) => this.partialCompare(datumKeys, field1, field2)
            : (field1, field2) => is(field1, field2)
        )
      );
  }

  private getSingleSource(
    $validator: FormStubs<F>[number]["$immutableValidator"],
    fieldData: Map<keyof F[number], V<F[number]>>
  ) {
    const metadata = this.getMeta();
    const source = $validator!(
      fieldData,
      metadata,
      this.getFormData() as List<Map<keyof F[number], V<F[number]>>>
    );
    return source instanceof Promise ? from(source) : source;
  }

  private connect(lazy?: boolean) {
    return lazy ? exhaustMap : switchMap;
  }

  private getChangedMetaAsync(
    fields: F[number]["field"][],
    indicator: AsyncState,
    meta?: ImmutableMeta<F, M>,
    condition?: (found: ImmutableMetaDatum) => boolean
  ) {
    const merged = meta ? merge(this.getMeta(), meta) : this.getMeta();
    const reduced = merged.withMutations((mutation) => {
      fields.forEach((field) => {
        const target = mutation.get(field);
        if (!target) {
          return;
        }
        if ((condition && condition(target)) || !condition) {
          mutation.set(field, Map(target.set("asyncIndicator", indicator)));
        }
      });
    });
    return reduced;
  }

  private commitMetaAsyncIndicator(
    fields: F[number]["field"][],
    indicator: AsyncState,
    meta?: ImmutableMeta<F, M>,
    condition?: (found: ImmutableMetaDatum) => boolean
  ) {
    const reduced = this.getChangedMetaAsync(
      fields,
      indicator,
      meta,
      condition
    );
    this.metadata$?.next(reduced);
  }

  private listenToExcludedAll(fields: FormStubs<F>) {
    this.subscriptions.pushAll(
      fields
        .filter(
          ({ type, $immutableValidator }) =>
            type === DatumType.EXCLUDED && $immutableValidator
        )
        .map(
          ({
            field,
            $immutableValidator,
            lazy,
            debounceDuration,
            datumKeys,
          }) => ({
            id: field,
            subscription: this.getFieldSource(field, datumKeys)
              .pipe(
                debounceTime(Number(debounceDuration)),
                tap(() => {
                  this.commitMetaAsyncIndicator([field], AsyncState.PENDING);
                }),
                this.connect(lazy)((fieldData) =>
                  iif(
                    () => Boolean(fieldData),
                    this.getSingleSource($immutableValidator, fieldData!),
                    of(this.getMeta())
                  )
                ),
                catchError(() =>
                  of(this.getChangedMetaAsync([field], AsyncState.ERROR))
                )
              )
              .subscribe((meta) => {
                this.commitMetaAsyncIndicator(
                  [field],
                  AsyncState.DONE,
                  meta,
                  (found) => {
                    const indicator = found.get("asyncIndicator");
                    return !indicator || indicator === AsyncState.PENDING;
                  }
                );
              }),
          })
        )
    );
  }

  private removeDataByFields(
    fields: Array<F[number]["field"]>,
    data: List<Map<K<F[number]>, V<F[number]>>>
  ) {
    let toBeRemoved = data;
    fields.forEach((f) => {
      const removeIndex = toBeRemoved.findIndex((m) => {
        return f === m.get("field");
      });
      if (removeIndex > -1) {
        toBeRemoved = toBeRemoved.remove(removeIndex);
        this.subscriptions.remove(f);
      }
    });
    return toBeRemoved;
  }

  private commitMutation(
    data: List<Map<K<F[number]>, V<F[number]>>>,
    connector: RxImStore<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>
  ) {
    connector.setState({ [this.id]: data } as {});
  }

  private findDatumByField(
    data: List<Map<K<F[number]>, V<F[number]>>>,
    field: F[number]["field"]
  ) {
    return data.find((datum) => datum.get("field") === field);
  }

  private getExcludedFields(
    connector: RxImStore<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>
  ) {
    return connector
      .getState(this.id)
      .filter((datum) => datum.get("type") === DatumType.EXCLUDED)
      .map((datum) => datum.get("field"));
  }

  private appendDataByFields(
    fields: FormStubs<F>,
    data: List<Map<K<F[number]>, V<F[number]>>>
  ) {
    return data.withMutations((mutation) => {
      fields.forEach(({ defaultValue, field, type, $immutableValidator }) => {
        const datum = Map({
          field,
          touched: false,
          changed: false,
          hovered: false,
          focused: false,
          value: defaultValue,
          type: type ? type : DatumType.SYNC,
        }) as Map<K<F[number]>, V<F[number]>>;
        mutation.push(datum);
        if (type === DatumType.EXCLUDED && $immutableValidator) {
          this.listenToExcludedAll([
            {
              field,
              type,
              $immutableValidator,
            },
          ]);
        }
      });
    });
  }

  private cast(connector: RxStore<Any> & Subscribable<Any>) {
    const casted = connector as unknown as RxImStore<
      Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>
    > &
      Subscribable<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>;
    return casted;
  }

  private getDatumIndex<N extends number>(
    field: F[N]["field"],
    casted: RxImStore<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>
  ) {
    const targetIndex = casted
      .getState(this.id)
      .findIndex((datum) => datum.get("field") === field);
    return targetIndex;
  }

  private validatorExecutor(
    connector: RxImStore<
      Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>
    > &
      Subscribable<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>
  ) {
    return connector.observe(this.id, (formData) => {
      const meta = this.validator(formData, this.getMeta());
      this.setMetadata(meta);
    });
  }

  private isPromise<T>($async: any): $async is Promise<T> {
    return $async instanceof Promise;
  }

  private getAsyncFields() {
    return this.getFormData()
      .filter((field) => field.get("type") === DatumType.ASYNC)
      .map((field) => field.get("field"))
      .toJS() as F[number]["field"][];
  }

  private asyncValidatorExecutor(
    connector: RxImStore<
      Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>
    > &
      Subscribable<Record<S, () => List<Map<K<F[number]>, V<F[number]>>>>>
  ) {
    if (!this.asyncValidator) {
      return;
    }

    const connect = this.asyncConfig.lazy ? exhaustMap : switchMap;
    const subscription = connector
      .getDataSource()
      .pipe(
        debounceTime(this.asyncConfig.debounceDuration),
        map((states) =>
          states[this.id].filter(
            (datum) => datum.get("type") === DatumType.ASYNC
          )
        ),
        distinctUntilChanged((var1, var2) => is(var1, var2)),
        connect((formData) => {
          const oldMeta = this.getMeta();
          if (!formData.size) {
            return of(oldMeta);
          }
          this.commitMetaAsyncIndicator(
            this.getAsyncFields(),
            AsyncState.PENDING
          );
          const async$ = this.asyncValidator!(
            this.getFormData() as ReturnType<
              Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]
            >,
            oldMeta
          );
          const reduced$ = this.isPromise(async$) ? from(async$) : async$;
          return reduced$.pipe(
            catchError(() => {
              return of(
                this.getChangedMetaAsync(
                  this.getAsyncFields(),
                  AsyncState.ERROR
                )
              );
            })
          );
        })
      )
      .subscribe((meta) => {
        this.commitMetaAsyncIndicator(
          this.getAsyncFields(),
          AsyncState.DONE,
          meta,
          (found) => {
            const indicator = found.get("asyncIndicator");
            return !indicator || indicator === AsyncState.PENDING;
          }
        );
      });
    return () => subscription.unsubscribe();
  }

  @bound
  getFormData<CompareAts extends readonly number[] = number[]>(
    fields?: F[CompareAts[number]]["field"][]
  ):
    | List<Map<PK<F[CompareAts[number]]>, PV<F[CompareAts[number]]>>>
    | ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]> {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const form = casted.getState(this.id)!;
      if (fields) {
        const reduced = List(
          fields.reduce((acc, next) => {
            const found = form.find((f) => f.get("field") === next);
            if (found) {
              acc.push(found);
            }
            return acc;
          }, [] as Map<keyof F[number], V<F[number]>>[])
        );
        return reduced;
      }
      return form;
    })!;
  }

  @bound
  resetFormDatum<N extends number>(field: F[N]["field"]): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const defaultDatum = this.findDatumByField(this.initiator()!, field);
      const indexToReset = this.getDatumIndex(field, casted);
      if (defaultDatum) {
        if (indexToReset > -1) {
          this.commitMutation(
            casted.getState(this.id).set(indexToReset, defaultDatum),
            casted
          );
        }
        return;
      }
      this.commitMutation(
        casted.getState(this.id).splice(indexToReset, 1),
        casted
      );
    });
    return this;
  }

  @bound
  resetFormAll(): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const data = this.initiator()!;
      const excluded = this.getExcludedFields(casted);
      excluded.forEach((e) => {
        const target = data.find((datum) => e === datum.get("field"));
        if (!target) {
          this.subscriptions.remove(e as string);
          return;
        }

        if (target && target.get("type") !== DatumType.EXCLUDED) {
          this.subscriptions.remove(e as string);
        }
      });
      casted.reset(this.id);
    });
    return this;
  }

  @bound
  appendFormData(fields: FormStubs<F>): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const data = this.appendDataByFields(fields, casted.getState(this.id));
      this.listenToExcludedAll(fields);
      this.commitMutation(data, casted);
    });
    return this;
  }

  @bound
  removeFormData(fields: F[number]["field"][]): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const removed = this.removeDataByFields(fields, casted.getState(this.id));
      this.commitMutation(removed, casted);
      fields.forEach((field) => this.subscriptions.remove(field));
    });
    return this;
  }

  @bound
  setMetadata(meta: ImmutableMeta<F, M>): this {
    this.safeExecute(() => {
      this.metadata$?.next(meta);
    });
    return this;
  }

  @bound
  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this {
    this.safeExecute(() => {
      const meta = this.getMeta();
      const single = Map({ ...metaOne }) as ImmutableMetaDatum;
      this.metadata$?.next(meta.set(field, single));
    });
    return this;
  }

  @bound
  observeMeta(
    callback: (meta: ImmutableMeta<F, M>) => void
  ): () => void | undefined {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged((var1, var2) => var1.equals(var2)))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: ImmutableMetaDatum) => void
  ): () => void | undefined {
    const subscription = this.metadata$
      ?.pipe(
        map((meta) => meta.get(field)),
        distinctUntilChanged((var1, var2) => is(var1, var2))
      )
      .subscribe((single) => {
        if (single) {
          callback(single);
        }
      });
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByFields<KS extends Array<keyof M>>(
    fields: KS,
    callback: (meta: ImmutableMeta<F, M>) => void
  ): () => void | undefined {
    const subscription = this.metadata$
      ?.pipe(
        map(
          (meta) => <ImmutableMeta<F, M>>Map().withMutations((mutation) => {
              fields.forEach((field) => {
                mutation.set(field, meta.get(field));
              });
            })
        ),
        distinctUntilChanged((var1, var2) => is(var1, var2))
      )
      .subscribe((single) => {
        if (single) {
          callback(single);
        }
      });
    return () => subscription?.unsubscribe();
  }

  @bound
  observeFormData<CompareAts extends readonly number[] = number[]>(
    observer: (
      result:
        | List<Map<keyof F[CompareAts[number]], PV<F[CompareAts[number]]>>>
        | ReturnType<
            Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]
          >
    ) => void,
    fields?: F[CompareAts[number]]["field"][]
  ): () => void {
    const casted = this.cast(this.connector!);
    const subscription = casted
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        map((form) => {
          if (!fields) {
            return form;
          }
          return List(
            fields.reduce((acc, next) => {
              const found = form.find((f) => f.get("field") === next);
              if (found) {
                acc.push(found);
              }
              return acc;
            }, [] as Map<keyof F[number], V<F[number]>>[])
          );
        }),
        distinctUntilChanged((var1, var2) => is(var1, var2))
      )
      .subscribe(observer);
    return () => subscription.unsubscribe();
  }

  @bound
  observeFormDatum<CompareAt extends number = number>(
    field: F[CompareAt]["field"],
    observer: (
      result: Map<
        keyof ReturnType<Record<S, () => F>[S]>[CompareAt],
        PV<ReturnType<Record<S, () => F>[S]>[CompareAt]>
      >
    ) => void
  ): () => void {
    const subscription = this.cast(this.connector!)
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        map((form) => this.findDatumByField(form, field)!),
        distinctUntilChanged((var1, var2) => is(var1, var2))
      )
      .subscribe(observer);
    return () => subscription.unsubscribe();
  }

  @bound
  observeFormValue<CompareAt extends number = number>(
    field: F[CompareAt]["field"],
    observer: (
      result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]
    ) => void
  ): () => void {
    const subscription = this.cast(this.connector!)
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        map((form) => this.findDatumByField(form, field)!.get("value")),
        distinctUntilChanged((var1, var2) => is(var1, var2))
      )
      .subscribe(observer);
    return () => subscription.unsubscribe();
  }

  @bound
  getDatum<At extends number = number>(
    field: F[At]["field"]
  ): Map<keyof F[At], PV<F[At]>> {
    const casted = this.cast(this.connector!);
    return this.findDatumByField(casted.getState(this.id), field)!;
  }

  @bound
  getDatumValue<At extends number = number>(field: F[At]["field"]) {
    const casted = this.cast(this.connector!);
    return this.findDatumByField(casted.getState(this.id), field)!.get(
      "value"
    )!;
  }

  @bound
  getFieldMeta<N extends number = number>(field: F[N]["field"]) {
    return this.safeExecute(() => {
      return this.metadata$?.value.get(field);
    })!;
  }

  @bound
  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType,
    $immutableValidator?: $ImmutableValidator<F>
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      if (targetIndex >= 0) {
        const original = casted.getState(this.id).get(targetIndex);
        const mutation = original?.set("type", type as V<F[number]>);

        if (
          type === DatumType.EXCLUDED &&
          original?.get("type") !== DatumType.EXCLUDED &&
          $immutableValidator
        ) {
          this.listenToExcludedAll([
            {
              field,
              type,
              $immutableValidator,
            },
          ]);
        }

        if (
          original?.get("type") === DatumType.EXCLUDED &&
          type !== DatumType.EXCLUDED
        ) {
          this.subscriptions.remove(field);
        }

        mutation &&
          this.commitMutation(
            casted.getState(this.id).set(targetIndex, mutation),
            casted
          );
      }
    });
    return this;
  }

  @bound
  getFieldsMeta(fields: F[number]["field"][]) {
    return Map().withMutations((mutation) => {
      fields.forEach((field) => {
        mutation.set(field, this.getFieldMeta(field));
      });
    }) as ImmutableMeta<F, M>;
  }

  @bound
  setBulkAsyncValidator(
    asyncValidator: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: ImmutableMeta<F, M>
    ) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>
  ): void {
    if (!this.asyncValidator) {
      this.asyncValidator = asyncValidator;
    }
  }

  @bound
  changeFormValue<N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)
        ?.set("value", value)
        ?.set("changed", true as V<F[number]>);
      mutation &&
        this.commitMutation(
          casted.getState(this.id).set(targetIndex, mutation),
          casted
        );
    });
    return this;
  }

  @bound
  touchFormField<N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)
        ?.set("touched", touchOrNot as V<F[number]>);
      mutation &&
        this.commitMutation(
          casted.getState(this.id).set(targetIndex, mutation),
          casted
        );
    });
    return this;
  }

  @bound
  emptyFormField<N extends number>(field: F[N]["field"]): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const defaultDatum = this.findDatumByField(this.initiator()!, field);
      if (defaultDatum) {
        this.commitMutation(
          casted.getState(this.id).set(targetIndex, defaultDatum),
          casted
        );
        return;
      }
      this.commitMutation(
        casted.getState(this.id).splice(targetIndex, 1),
        casted
      );
    });
    return this;
  }

  @bound
  focusFormField<N extends number>(
    field: F[N]["field"],
    focusOrNot: boolean
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)
        ?.set("focused", focusOrNot as V<F[number]>);
      mutation &&
        this.commitMutation(
          casted.getState(this.id).set(targetIndex, mutation),
          casted
        );
    });
    return this;
  }

  @bound
  hoverFormField<N extends number>(
    field: F[N]["field"],
    hoverOrNot: boolean
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)!
        .set("hovered", hoverOrNot as V<F[number]>);
      this.commitMutation(
        casted.getState(this.id).set(targetIndex, mutation),
        casted
      );
    });
    return this;
  }

  @bound
  startValidation() {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const stopValidation = this.validatorExecutor(casted);
      const stopAsyncValidation = this.asyncValidatorExecutor(casted);
      this.listenToExcludedAll(this.getFields());
      return () => {
        stopValidation?.();
        stopAsyncValidation?.();
        this.subscriptions.removeAll();
      };
    });
  }

  @bound
  getMeta(): ImmutableMeta<F, M> {
    return Map(this.metadata$?.value);
  }

  @bound
  toFormData() {
    return (form?: HTMLFormElement) => {
      return (
        this.getFormData() as List<Map<keyof F[number], V<F[number]>>>
      ).reduce((acc, datum) => {
        const field = datum.get("field") as string;
        const value = datum.get("value");
        if (field)
          acc.append(
            field,
            value instanceof Blob || typeof value === "string"
              ? value
              : String(value)
          );
        return acc;
      }, new FormData(form));
    };
  }

  initiator: Initiator<List<Map<K<F[number]>, V<F[number]>>>> = (connector) => {
    if (connector && !this.connector) {
      this.connector = connector;
      this.metadata$ = new BehaviorSubject(
        this.defaultMeta ? this.defaultMeta : this.getMeta()
      );
      return;
    }

    if (this.fields) {
      return List(
        this.fields.map(({ field, defaultValue, type }) =>
          Map({
            field,
            touched: false,
            changed: false,
            hovered: false,
            focused: false,
            value: defaultValue,
            type: type ? type : DatumType.SYNC,
          })
        )
      );
    }
    return List([]);
  };
}
