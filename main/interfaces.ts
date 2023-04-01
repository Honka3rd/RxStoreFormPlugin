import { RxNStore } from "rx-store-types";

export type Any = {
  [K: string]: any;
};

export type FormControlBasicMetadata = {
  errors: Any;
  info?: any;
  warn?: any;
};

export type FormControlBasicDatum = {
  field: string;
  value: any;
  touched: boolean;
  empty: boolean;
  changed: boolean;
  focused: boolean;
  hovered: boolean;
  metadata: FormControlBasicMetadata;
};

export interface FormControlBasicDatumAsync extends FormControlBasicDatum {
  validating: boolean;
  validated: boolean;
  failed: boolean;
}

export type FormControlData = FormControlBasicDatum[];
export type FormControlDataMixed = Array<
  FormControlBasicDatum | FormControlBasicDatumAsync
>;

export interface FormController<F extends FormControlData> {
  changeFormDatum: <N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) => this;

  resetFormDatum: <N extends number>(field: F[N]["field"]) => this;

  createFormDatum: (
    fields: Array<{
      field: F[number]["field"];
      defaultValue: F[number]["value"];
      defaultMeta?: F[number]["metadata"];
    }>
  ) => this;

  deleteFormDatum: (fields: Array<F[number]["field"]>) => this;

  resetFormAll: () => this;

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

  setFormMetadata: <N extends number>(
    field: F[N]["field"],
    meta: F[N]["metadata"]
  ) => this;

  setFormMetadataErrors: <N extends number>(
    field: F[N]["field"],
    errors: F[N]["metadata"]["errors"]
  ) => this;

  setFormMetadataInfo: <N extends number>(
    field: F[N]["field"],
    info: F[N]["metadata"]["info"]
  ) => this;

  setFormMetadataWarn: <N extends number>(
    field: F[N]["field"],
    warn: F[N]["metadata"]["warn"]
  ) => this;

  initiator: (connector: RxNStore<Any>) => F;

  validator: <N extends number>(formData: F[N]) => F[N]["metadata"];

  getFormSelector: () => string;
}
