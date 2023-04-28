import { Initiator, PluginImpl, RxImStore, Subscribable } from "rx-store-types";
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
import { List, Map } from "immutable";
import { BehaviorSubject, Observable } from "rxjs";

export class ImmutableFormControllerImpl<
    F extends FormControlData,
    M extends Record<F[number]["field"], FormControlBasicMetadata>,
    S extends string
  >
  extends PluginImpl<S>
  implements ImmutableFormController<F, M, S>
{
  private metadata$?: BehaviorSubject<Partial<M>>;
  constructor(id: S, public validator: (formData: F) => Map<keyof M, V<M>>) {
    super(id);
  }
  resetFormDatum<N extends number>(field: F[N]["field"]): this {
    throw new Error("Method not implemented.");
  }
  resetFormAll(): this {
    throw new Error("Method not implemented.");
  }
  appendFormData(fields: FormStubs<F>): this {
    throw new Error("Method not implemented.");
  }
  removeFormData(fields: F[number]["field"][]): this {
    throw new Error("Method not implemented.");
  }
  setMetadata(meta: Partial<M>): this {
    throw new Error("Method not implemented.");
  }
  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this {
    throw new Error("Method not implemented.");
  }
  getClonedMetaByField<CF extends keyof M>(field: CF): Partial<M>[CF] {
    throw new Error("Method not implemented.");
  }
  observeMeta(callback: (meta: Partial<M>) => void): () => void | undefined {
    throw new Error("Method not implemented.");
  }
  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Partial<M>[K]) => void
  ): () => void | undefined {
    throw new Error("Method not implemented.");
  }

  getFieldMeta<N extends number = number>(
    field: F[N]["field"]
  ): M[F[N]["field"]] {
    throw new Error("Method not implemented.");
  }

  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType
  ): this {
    throw new Error("Method not implemented.");
  }

  getFieldsMeta(fields: F[number]["field"][]): Map<PK<M>, PV<M>> {
    throw new Error("Method not implemented.");
  }

  setAsyncValidator(
    asyncValidator: (
      formData: F
    ) =>
      | Observable<Map<keyof M, Partial<M>[keyof M]>>
      | Promise<Map<keyof M, Partial<M>[keyof M]>>
  ): void {
    throw new Error("Method not implemented.");
  }

  setFields(fields: FormStubs<F>): void {
    throw new Error("Method not implemented.");
  }
  changeFormDatum<N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ): this {
    throw new Error("Method not implemented.");
  }

  touchFormField<N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ): this {
    throw new Error("Method not implemented.");
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

  getMeta(): Map<keyof M, Partial<M>[keyof M]> {
    throw new Error("Method not implemented.");
  }

  initiator: Initiator = (connector) => {
    
  };
}
