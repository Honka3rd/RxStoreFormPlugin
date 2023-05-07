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
  catchError,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";

export class ImmutableFormControllerImpl<
    F extends FormControlData,
    M extends Record<F[number]["field"], FormControlBasicMetadata>,
    S extends string
  >
  extends PluginImpl<S>
  implements ImmutableFormController<F, M, S>
{
  private metadata$?: BehaviorSubject<
    Map<PK<M>, Map<"errors" | "info" | "warn", any>>
  >;
  private fields?: FormStubs<F>;

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
      fields.forEach(({ defaultValue, field, type }) => {
        const datum = Map({
          field,
          touched: false,
          empty: true,
          changed: false,
          hovered: false,
          focused: false,
          value: defaultValue,
          type: type ? type : DatumType.SYNC,
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
      .map((datum) => datum.get("field")!);
    return this.getFieldsMeta(excluded.toJS() as F[number]["field"][]);
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
        map((formData: List<Map<K<F[number]>, V<F[number]>>>) =>
          formData.filter((datum) => datum.get("type") === DatumType.ASYNC)
        ),

        switchMap((asyncFormData) => {
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

  resetFormAll(): this {
    this.safeExecute((connector) => {
      connector.reset(this.id);
    });
    return this;
  }

  appendFormData(fields: FormStubs<F>): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const data = this.appendDataByFields(fields, casted.getState(this.id));
      this.commitMutation(data, casted);
    });
    return this;
  }

  removeFormData(fields: F[number]["field"][]): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const removed = this.removeDataByFields(fields, casted.getState(this.id));
      this.commitMutation(removed, casted);
    });
    return this;
  }

  setMetadata(meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>): this {
    this.safeExecute(() => {
      this.metadata$?.next(meta);
    });
    return this;
  }

  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this {
    this.safeExecute(() => {
      const meta = this.getMeta();
      const single = fromJS({ ...metaOne }) as Map<
        "errors" | "info" | "warn",
        any
      >;
      this.metadata$?.next(meta.set(field, single));
    });
    return this;
  }

  setFields(fields: FormStubs<F>) {
    if (!this.fields) {
      this.fields = fields;
    }
  }

  observeMeta(
    callback: (meta: Map<PK<M>, Map<"errors" | "info" | "warn", any>>) => void
  ): () => void | undefined {
    const subscription = this.metadata$
      ?.pipe(distinctUntilChanged((var1, var2) => var1.equals(var2)))
      .subscribe(callback);
    return () => subscription?.unsubscribe();
  }

  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Map<"errors" | "info" | "warn", any>) => void
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

  getFieldMeta<N extends number = number>(field: F[N]["field"]) {
    return this.safeExecute(() => {
      return this.metadata$?.value.get(field) as Map<
        PK<M>,
        Map<"errors" | "info" | "warn", any>
      >;
    })!;
  }

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
          .get(targetIndex)!
          .set("type", type as V<F[number]>);
        this.commitMutation(
          casted.getState(this.id).set(targetIndex, mutation),
          casted
        );
      }
    });
    return this;
  }

  getFieldsMeta(fields: F[number]["field"][]): Map<PK<M>, PV<M>> {
    return Map().withMutations((mutation) => {
      fields.forEach((field) => {
        mutation.set(field, this.getFieldMeta(field));
      });
    }) as Map<PK<M>, PV<M>>;
  }

  setAsyncValidator(
    asyncValidator: (
      formData: List<Map<keyof F[number], V<F[number]>>>
    ) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>
  ): void {
    if (!this.asyncValidator) {
      this.asyncValidator = asyncValidator;
    }
  }

  changeFormValue<N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)!
        .set("value", value);
      this.commitMutation(
        casted.getState(this.id).set(targetIndex, mutation),
        casted
      );
    });
    return this;
  }

  touchFormField<N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)!
        .set("touched", touchOrNot as V<F[number]>);
      this.commitMutation(
        casted.getState(this.id).set(targetIndex, mutation),
        casted
      );
    });
    return this;
  }

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

  focusFormField<N extends number>(
    field: F[N]["field"],
    focusOrNot: boolean
  ): this {
    this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const targetIndex = this.getDatumIndex(field, casted);
      const mutation = casted
        .getState(this.id)
        .get(targetIndex)!
        .set("focused", focusOrNot as V<F[number]>);
      this.commitMutation(
        casted.getState(this.id).set(targetIndex, mutation),
        casted
      );
    });
    return this;
  }

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

  startValidation() {
    return this.safeExecute((connector) => {
      const casted = this.cast(connector);
      const stopValidation = this.validatorExecutor(casted);
      const stopAsyncValidation = this.asyncValidatorExecutor(casted);
      return () => {
        stopValidation?.();
        stopAsyncValidation?.();
      };
    });
  }

  getMeta(): Map<PK<M>, Map<"errors" | "info" | "warn", any>> {
    return Map(this.metadata$?.value);
  }

  initiator: Initiator<List<Map<K<F[number]>, V<F[number]>>>> = (connector) => {
    if (connector && !this.connector) {
      this.connector = connector;
      this.metadata$ = new BehaviorSubject(connector.getState(this.selector()));
      return;
    }

    if (this.fields) {
      return List(
        this.fields.map(({ field, defaultValue, type }) =>
          Map({
            field,
            touched: false,
            empty: true,
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
