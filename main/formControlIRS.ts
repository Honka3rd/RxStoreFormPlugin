import {
  Any,
  Initiator,
  PluginImpl,
  RxImStore,
  RxStore,
  Subscribable,
} from "rx-store-types";
import {
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
import { List, Map, fromJS, is } from "immutable";
import { BehaviorSubject, Observable, distinctUntilChanged, map } from "rxjs";

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
      formData: F
    ) => Map<PK<M>, Map<"errors" | "info" | "warn", any>>
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
    >;
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
        return this;
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

  setMetadata(meta: Partial<M>): this {
    this.safeExecute(() => {
      const casted = fromJS(meta) as Map<
        PK<M>,
        Map<"errors" | "info" | "warn", any>
      >;
      this.metadata$?.next(casted);
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
      formData: F
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
    throw new Error("Method not implemented.");
  }

  focusFormField<N extends number>(
    field: F[N]["field"],
    focusOrNot: boolean
  ): this {
    throw new Error("Method not implemented.");
  }

  hoverFormField<N extends number>(
    field: F[N]["field"],
    hoverOrNot: boolean
  ): this {
    throw new Error("Method not implemented.");
  }

  asyncValidator?(
    formData: F
  ):
    | Observable<Map<keyof M, Partial<M>[keyof M]>>
    | Promise<Map<keyof M, Partial<M>[keyof M]>> {
    throw new Error("Method not implemented.");
  }

  startValidation(
    callback: (meta: Map<keyof M, V<M>>) => void
  ): (() => void) | undefined {
    throw new Error("Method not implemented.");
  }

  getMeta(): Map<PK<M>, Map<"errors" | "info" | "warn", any>> {
    throw new Error("Method not implemented.");
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
