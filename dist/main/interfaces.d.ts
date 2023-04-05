import { RxNStore, Subscribable } from "rx-store-types";
import { Observable } from "rxjs";
export type Any = {
    [K: string]: any;
};
export type FormControlBasicMetadata = {
    errors: Any;
    info?: any;
    warn?: any;
};
export declare enum AsyncState {
    PENDING = 0,
    DONE = 1,
    ERROR = 2
}
export declare enum DatumType {
    EXCLUDED = 0,
    ASYNC = 1,
    SYNC = 2
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
export interface FormController<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>> {
    changeFormDatum: <N extends number>(field: F[N]["field"], value: F[N]["value"]) => this;
    resetFormDatum: <N extends number>(field: F[N]["field"]) => this;
    resetFormAll: () => this;
    touchFormField: <N extends number>(field: F[N]["field"], touchOrNot: boolean) => this;
    emptyFormField: <N extends number>(field: F[N]["field"]) => this;
    focusFormField: <N extends number>(field: F[N]["field"], focusOrNot: boolean) => this;
    hoverFormField: <N extends number>(field: F[N]["field"], hoverOrNot: boolean) => this;
    initiator: (connector: RxNStore<Any> & Subscribable<Any>) => F;
    validator: (formData: F) => Partial<M>;
    asyncValidator?: (formData: F) => Observable<Partial<M>> | Promise<Partial<M>>;
    selector: () => string;
    startValidation: (callback: (meta: Partial<M>) => void) => {
        stopSyncValidation: () => void;
        stopAsyncValidation?: (() => void);
    } | undefined;
    getMeta(): Partial<M> | undefined;
    getFieldMeta(field: F[number]["field"]): Partial<M>[F[number]["field"]] | undefined;
    getFieldsMeta(fields: F[number]["field"][]): Partial<M>;
}
