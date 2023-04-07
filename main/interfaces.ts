import { RxStore, Subscribable, Any, Initiator } from "rx-store-types";
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
  changeFormDatum: <N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) => this;

  resetFormDatum: <N extends number>(field: F[N]["field"]) => this;

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

  initiator: Initiator<F>

  validator: (formData: F) => Partial<M>;

  asyncValidator?: (
    formData: F
  ) => Observable<Partial<M>> | Promise<Partial<M>>;

  selector: () => string;

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
}
