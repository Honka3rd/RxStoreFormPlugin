import { Any, Initiator } from "rx-store-types";
import { List, Map } from "immutable";
import { Observable } from "rxjs";

export type FormControlBasicMetadata = {
  errors: Any;
  info?: any;
  warn?: any;
};

export enum AsyncState {
  PENDING,
  DONE,
  ERROR,
}

export enum DatumType {
  EXCLUDED,
  ASYNC,
  SYNC,
}

export type FormControlBasicDatum = {
  field: string;
  value: any;
  touched: boolean;
  empty: boolean;
  changed: boolean;
  focused: boolean;
  hovered: boolean;
  type: DatumType;
  asyncState?: AsyncState;
};

export type FormControlData = FormControlBasicDatum[];

export type FormStubs<F extends FormControlBasicDatum[]> = Array<{
  field: F[number]["field"];
  defaultValue?: F[number]["value"];
  type?: DatumType;
}>;

export interface FormController<
  F extends FormControlData,
  M extends Record<F[number]["field"], FormControlBasicMetadata>,
  S extends string
> {
  setAsyncValidator(
    asyncValidator: (
      formData: F
    ) => Observable<Partial<M>> | Promise<Partial<M>>
  ): void;

  setFields(fields: FormStubs<F>): void;

  setMetaComparator(
    metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean
  ): void;

  setMetaComparatorMap(metaComparatorMap: {
    [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
  }): void;

  setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): void;

  setMetaCloneFunctionMap(cloneFunctionMap: {
    [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
  }): void;

  changeFormDatum: <N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) => this;

  touchFormField: <N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ) => this;

  emptyFormField: <N extends number>(field: F[N]["field"]) => this;

  focusFormField: <N extends number>(
    field: F[N]["field"],
    focusOrNot: boolean
  ) => this;

  hoverFormField: <N extends number>(
    field: F[N]["field"],
    hoverOrNot: boolean
  ) => this;

  initiator: Initiator<F>;

  validator: (formData: F) => Partial<M>;

  asyncValidator?: (
    formData: F
  ) => Observable<Partial<M>> | Promise<Partial<M>>;

  selector: () => S;

  startValidation: (callback: (meta: Partial<M>) => void) =>
    | {
        stopSyncValidation: () => void;
        stopAsyncValidation?: () => void;
      }
    | undefined;

  getMeta(): Partial<M> | undefined;

  getFieldMeta(
    field: F[number]["field"]
  ): Partial<M>[F[number]["field"]] | undefined;

  getFieldsMeta(fields: F[number]["field"][]): Partial<M>;

  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType
  ): this;

  resetFormDatum<N extends number>(field: F[N]["field"]): this;

  resetFormDatum<N extends number>(field: F[N]["field"]): this;

  resetFormAll(): this;

  appendFormData(fields: FormStubs<F>): this;

  removeFormData(fields: Array<F[number]["field"]>): this;

  setMetadata(meta: Partial<M>): this;

  setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;

  getClonedMetaByField<CF extends keyof M>(field: CF): Partial<M>[CF];

  getFieldMeta(field: F[number]["field"]): Partial<M>[F[number]["field"]];

  getFieldsMeta(fields: F[number]["field"][]): Partial<M>;

  observeMeta(callback: (meta: Partial<M>) => void): () => void | undefined;

  observeMetaByField<K extends keyof M>(
    field: K,
    callback: (metaOne: Partial<M>[K]) => void
  ): () => void | undefined;
}

export type NormalFormPluginBuilderParams<
  F extends FormControlData,
  M extends Record<F[number]["field"], FormControlBasicMetadata>,
  S extends string
> = {
  formSelector: S;
  validator: (formData: F) => Partial<M>;
};

export type FormStub = {
  field: string;
  defaultValue?: string | number | boolean | FileList;
  type?: DatumType;
};

type K<T> = keyof T;

type V<T> = T[keyof T];

type PK<T> = keyof Partial<T>;

type PV<T> = Partial<T>[keyof Partial<T>];

export type ImmutableFormStubs = List<Map<K<FormStub>, V<FormStub>>>;

export interface ImmutableFormController<
  F extends FormControlData,
  M extends Record<F[number]["field"], FormControlBasicMetadata>,
  S extends string
> {
  setAsyncValidator(
    asyncValidator: (
      formData: F
    ) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>
  ): void;

  setFields(fields: FormStubs<F>): void;

  changeFormDatum: <N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ) => this;

  touchFormField: <N extends number>(
    field: F[N]["field"],
    touchOrNot: boolean
  ) => this;

  emptyFormField: <N extends number>(field: F[N]["field"]) => this;

  focusFormField: <N extends number>(
    field: F[N]["field"],
    focusOrNot: boolean
  ) => this;

  hoverFormField: <N extends number>(
    field: F[N]["field"],
    hoverOrNot: boolean
  ) => this;

  initiator: Initiator<F>;

  validator: (formData: F) => Map<K<M>, V<M>>;

  asyncValidator?: (
    formData: F
  ) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>;

  startValidation: (
    callback: (meta: Map<K<M>, V<M>>) => void
  ) => (() => void) | undefined;

  getMeta(): Map<PK<M>, PV<M>> | undefined;

  getFieldMeta<N extends number = number>(
    field: F[N]["field"]
  ): Map<K<M[F[N]["field"]]>, V<M[F[N]["field"]]>> | undefined;

  getFieldsMeta(
    fields: F[number]["field"][]
  ): Map<
    F[number]["field"],
    Map<K<M[F[number]["field"]]>, V<M[F[number]["field"]]>>
  >;

  changeFieldType<N extends number>(
    field: F[N]["field"],
    type: DatumType
  ): this;
}
