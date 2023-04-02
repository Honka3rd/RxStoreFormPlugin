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
export type FormControlBasicDatum = {
    field: string;
    value: any;
    touched: boolean;
    empty: boolean;
    changed: boolean;
    focused: boolean;
    hovered: boolean;
};
export interface FormControlBasicDatumAsync extends FormControlBasicDatum {
    validating?: boolean;
    validated?: boolean;
    failed?: boolean;
}
export type FormControlData = FormControlBasicDatumAsync[];
export interface FormController<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>> {
    changeFormDatum: <N extends number>(field: F[N]["field"], value: F[N]["value"]) => this;
    resetFormDatum: <N extends number>(field: F[N]["field"]) => this;
    updateFormFields: (fields: Array<{
        field: F[number]["field"];
        defaultValue?: F[number]["value"];
    }>) => this;
    resetFormAll: () => this;
    touchFormField: <N extends number>(field: F[N]["field"], touchOrNot: boolean) => this;
    emptyFormField: <N extends number>(field: F[N]["field"]) => this;
    focusFormField: <N extends number>(field: F[N]["field"], focusOrNot: boolean) => this;
    hoverFormField: <N extends number>(field: F[N]["field"], hoverOrNot: boolean) => this;
    initiator: (connector: RxNStore<Any> & Subscribable<Any>) => F;
    validator: (formData: F) => Partial<M>;
    asyncValidator?: (formData: F) => Observable<Partial<M>> | Promise<Partial<M>>;
    getFormSelector: () => string;
    startObserve: (callback: (meta: Partial<M>) => void) => this;
    stopObserve: () => void;
}
