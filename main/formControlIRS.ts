import {
  Any,
  Initiator,
  PluginImpl,
  RxImStore,
  RxStore,
  Subscribable,
} from "rx-store-types";
import {
  AsyncState,
  DatumType,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  FormControlData,
  FormStubs,
  ImmutableFormController,
  K,
  PK,
  PV,
  V,
} from "./interfaces";
import { List, Map, fromJS, is, merge } from "immutable";
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  distinctUntilChanged,
  filter,
  from,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import { bound } from "rx-store-core";

export class ImmutableFormControllerImpl<
    F extends FormControlData,
    M extends Record<F[number]["field"], FormControlBasicMetadata>,
    S extends string
  >
  extends PluginImpl<S>
  implements ImmutableFormController<F, M, S>
{
  private metadata$?: BehaviorSubject<
    Map<PK<M>, Map<"errors" | "info" | "warn", Map<string, any>>>
  >;
  private fields?: FormStubs<F>;
  private defaultMeta?: Map<PK<M>, Map<"errors" | "info" | "warn", any>>;

  constructor(
    id: S,
    public validator: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>
    ) => Map<PK<M>, Map<"errors" | "info" | "warn", any>>,
    public asyncValidator?: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>
    ) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>
  ) {
    super(id);
  }

  setFields(fields: FormStubs<F>) {
    if (!this.fields) {
      this.fields = fields;
    }
  }

  setDefaultMeta(meta: Partial<M>): void {
    this.defaultMeta = fromJS(meta) as Map<
      PK<M>,
      Map<"errors" | "info" | "warn", any>
    >;
  }

  private removeDataByFields(
    fields: Array<F[number]["field"]>,
    data: List<Map<K<F[number]>, V<F[number]>>>
  ) {
    return data.withMutations((mutation) => {
      fields.forEach((f) => {
        mutation.remove(
          mutation.findIndex((m) => {
            return f === m.get("field");
          })
        );
      });
    });
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

  private appendDataByFields(
    fields: FormStubs<F>,
    data: List<Map<K<F[number]>, V<F[number]>>>
  ) {
    return data.withMutations((mutation) => {
      fields.forEach(({ defaultValue, field, type, metaEmitter }) => {
        const datum = Map({
          field,
          touched: false,
          empty: true,
          changed: false,
          hovered: false,
          focused: false,
          value: defaultValue,
          type: type ? type : DatumType.SYNC,
          metaEmitter: type === DatumType.EXCLUDED ? metaEmitter : undefined,
        }) as Map<K<F[number]>, V<F[number]>>;
        mutation.push(datum);
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

  private getAsyncFields = (
    connector: RxImStore<
      Record<S, () => List<Map<keyof F[number], V<F[number]>>>>
    > &
      Subscribable<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>>
  ) => {
    return connector
      .getState(this.id)
      .filter((datum) => datum.get("type") === DatumType.ASYNC)
      .map((datum) => datum.get("field")!);
  };

  private setAsyncState(state: AsyncState) {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const prevFormData = casted.getState(this.id);
      const updated = prevFormData.withMutations((mutation) => {
        this.getAsyncFields(casted).forEach((field) => {
          const castedField = field as unknown as F[number]["field"];
          const foundIndex = mutation.findIndex(
            (d) => d.get("field") === castedField
          );
          const updatedDatum = mutation
            .get(foundIndex)
            ?.set("asyncState", state as V<F[number]>);
          updatedDatum && mutation.set(foundIndex, updatedDatum);
        });
      });
      this.commitMutation(updated, casted);
    });
  }

  private getExcludedMeta(
    connector: RxImStore<
      Record<S, () => List<Map<keyof F[number], V<F[number]>>>>
    > &
      Subscribable<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>>
  ) {
    const excluded = connector
      .getState(this.id)
      .filter((datum) => datum.get("type") === DatumType.EXCLUDED)
      .map((datum) => datum.get("field")!) as List<F[number]["field"]>;
    return this.getFieldsMeta(excluded);
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
    const subscription = connector
      .getDataSource()
      .pipe(
        map((states) => states[this.id]),
        distinctUntilChanged((var1, var2) => is(var1, var2)),
        switchMap((formData) => {
          const asyncFormData = formData.filter(
            (datum) => datum.get("type") === DatumType.ASYNC
          );
          const oldMeta = this.getMeta();
          if (!asyncFormData.size) {
            return of(oldMeta);
          }

          this.setAsyncState(AsyncState.PENDING);
          const async$ = this.asyncValidator!(asyncFormData, oldMeta);
          const reduced$ = this.isPromise(async$) ? from(async$) : async$;
          return reduced$.pipe(
            catchError(() => {
              return of({
                success: false,
                meta: this.getMeta(),
              });
            }),
            map((meta) => {
              if ("success" in meta && !meta.success) {
                return meta;
              }
              const m = meta as unknown as Map<
                keyof M,
                Map<"errors" | "info" | "warn", any>
              >;
              return { success: true, meta: m };
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
              return merge(
                this.getMeta(),
                meta,
                this.getExcludedMeta(connector)
              );
            })
          );
        })
      )
      .subscribe((meta) => {
        this.setMetadata(meta);
      });
    return () => subscription.unsubscribe();
  }

  private getFormData() {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      return casted.getState(this.id)!;
    })!;
  }

  private setExcludedState(state: AsyncState, field: string) {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const formData = casted.getState(this.id);
      const index = formData.findIndex(
        (datum) =>
          datum.get("field") === field &&
          datum.get("type") === DatumType.EXCLUDED
      ); 
      if (index >= 0) {
        const cloned = formData.set(
          index,
          formData.get(index)!.set("asyncState", state as V<F[number]>)
        );
        this.commitMutation(cloned, casted);
      }
    });
  }

  private observeExcluded() {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const subscriptions = this.fields
        ?.filter(
          ({ type, metaEmitter }) => type === DatumType.EXCLUDED && metaEmitter
        )
        .reduce((acc, next) => {
          const excludedOutput = casted
            .getDataSource()
            .pipe(
              filter((source) =>
                Boolean(
                  source[this.id].find((d) => d.get("field") === next.field)
                )
              ),
              tap(() => this.setExcludedState(AsyncState.PENDING, next.field)),
              switchMap((data) => {
                const $meta = next.metaEmitter!(
                  this.getFormData(),
                  this.getMeta(),
                  data
                );
                const converged =
                  $meta instanceof Promise ? from($meta) : $meta;
                return converged.pipe(
                  catchError(() => {
                    this.setExcludedState(AsyncState.ERROR, next.field);
                    return of(this.getFieldMeta(next.field));
                  }),
                  tap(() => this.setExcludedState(AsyncState.DONE, next.field))
                );
              })
            )
            .subscribe();
          acc.push(excludedOutput);
          return acc;
        }, [] as Array<Subscription>);
      return () => {
        subscriptions?.forEach((subscription) => subscription.unsubscribe());
      };
    });
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
      connector.reset(this.id);
    });
    return this;
  }

  @bound
  appendFormData(fields: FormStubs<F>): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const data = this.appendDataByFields(fields, casted.getState(this.id));
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
    });
    return this;
  }

  @bound
  setMetadata(
    meta: Map<keyof M, Map<"errors" | "info" | "warn", Map<string, any>>>
  ): this {
    this.safeExecute(() => {
      this.metadata$?.next(meta);
    });
    return this;
  }

  @bound
  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this {
    this.safeExecute(() => {
      const meta = this.getMeta();
      const single = fromJS({ ...metaOne }) as Map<
        "errors" | "info" | "warn",
        Map<string, any>
      >;
      this.metadata$?.next(meta.set(field, single));
    });
    return this;
  }

  @bound
  observeMeta(
    callback: (
      meta: Map<PK<M>, Map<"errors" | "info" | "warn", Map<string, any>>>
    ) => void
  ): () => void | undefined {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged((var1, var2) => var1.equals(var2)))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  @bound
  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (
      metaOne: Map<"errors" | "info" | "warn", Map<string, any>>
    ) => void
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
  getFieldMeta<N extends number = number>(field: F[N]["field"]) {
    return this.safeExecute(() => {
      return this.metadata$?.value.get(field) as Map<
        "errors" | "info" | "warn",
        Map<string, any>
      >;
    })!;
  }

  @bound
  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      if (targetIndex >= 0) {
        const mutation = casted
          .getState(this.id)
          .get(targetIndex)
          ?.set("type", type as V<F[number]>);
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
  getFieldsMeta(
    fields: F[number]["field"][] | List<F[number]["field"]>
  ): Map<PK<M>, PV<M>> {
    return Map().withMutations((mutation) => {
      fields.forEach((field) => {
        mutation.set(field, this.getFieldMeta(field));
      });
    }) as Map<PK<M>, PV<M>>;
  }

  @bound
  setAsyncValidator(
    asyncValidator: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>
    ) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>
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
        ?.set("value", value);
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
      const stopObserveExcluded = this.observeExcluded();
      return () => {
        stopValidation?.();
        stopAsyncValidation?.();
        stopObserveExcluded?.();
      };
    });
  }

  @bound
  getMeta(): Map<PK<M>, Map<"errors" | "info" | "warn", any>> {
    return Map(this.metadata$?.value);
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
        this.fields.map(({ field, defaultValue, type, metaEmitter }) =>
          Map({
            field,
            touched: false,
            empty: true,
            changed: false,
            hovered: false,
            focused: false,
            value: defaultValue,
            type: type ? type : DatumType.SYNC,
            metaEmitter: type === DatumType.EXCLUDED ? metaEmitter : undefined,
          })
        )
      );
    }
    return List([]);
  };
}
