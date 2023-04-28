import { Any, Comparator, Initiator } from "rx-store-types";
import { Observable } from "rxjs";
export type FormControlBasicMetadata = {
    errors: Any;
    info?: any;
    warn?: any;
};
export type FormControlMetadata<E extends Any, I = any, W = any> = {
    errors: E;
    info?: I;
    warn?: W;
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
export type FormControlDatum<F, T> = {
    field: F;
    value: T;
    touched: boolean;
    empty: boolean;
    changed: boolean;
    focused: boolean;
    hovered: boolean;
    type: DatumType;
    asyncState?: AsyncState;
};
export type FormControlStrDatum<F> = {
    field: F;
    value: string;
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
export interface FormController<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> {
    setAsyncValidator(asyncValidator: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>): void;
    setFields(fields: FormStubs<F>): void;
    setMetaComparator(metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean): void;
    setMetaComparatorMap(metaComparatorMap: {
        [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
    }): void;
    setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): void;
    setMetaCloneFunctionMap(cloneFunctionMap: {
        [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }): void;
    setDefaultMeta(meta: Partial<M>): void;
    changeFormValue: <N extends number>(field: F[N]["field"], value: F[N]["value"]) => this;
    touchFormField: <N extends number>(field: F[N]["field"], touchOrNot: boolean) => this;
    emptyFormField: <N extends number>(field: F[N]["field"]) => this;
    focusFormField: <N extends number>(field: F[N]["field"], focusOrNot: boolean) => this;
    hoverFormField: <N extends number>(field: F[N]["field"], hoverOrNot: boolean) => this;
    initiator: Initiator<F>;
    validator: (formData: F, metadata: Partial<M>) => Partial<M>;
    asyncValidator?: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>;
    selector: () => S;
    startValidation: () => (() => void) | undefined;
    getMeta(): Partial<M> | undefined;
    getFieldMeta(field: F[number]["field"]): Partial<M>[F[number]["field"]] | undefined;
    getFieldsMeta(fields: F[number]["field"][]): Partial<M>;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType): this;
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
    observeMetaByField<K extends keyof M>(field: K, callback: (metaOne: Partial<M>[K]) => void): () => void | undefined;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]>): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]>): () => void;
    observeFormData<CompareAts extends readonly number[] = number[]>(fields: F[CompareAts[number]]["field"][], observer: (result: F[CompareAts[number]][]) => void, comparator?: Comparator<F[CompareAts[number]][]>): () => void;
    getDatum<At extends number = number>(field: F[At]["field"]): FormControlBasicDatum | undefined;
    getDatumValue<At extends number = number>(field: F[At]["field"]): F[At]["value"] | undefined;
}
export type NormalFormPluginBuilderParams<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> = {
    formSelector: S;
    validator: (formData: F, metadata: Partial<M>) => Partial<M>;
};
