import { List, Map, FromJS } from "immutable";
import { Any, Comparator, Initiator } from "rx-store-types";
import { Observable } from "rxjs";
export type FormControlBasicMetadata = {
    errors: Any;
    info?: any;
    warn?: any;
    asyncIndicator?: AsyncState;
};
export type FormControlMetadata<E extends Any = Any, I = any, W = any> = {
    errors: E;
    info?: I;
    warn?: W;
    asyncIndicator?: AsyncState;
};
export declare enum AsyncState {
    PENDING = "PENDING",
    DONE = "DONE",
    ERROR = "ERROR"
}
export declare enum DatumType {
    EXCLUDED = "Excluded",
    ASYNC = "Async",
    SYNC = "Sync"
}
type DatumAttr = {
    touched: boolean;
    changed: boolean;
    focused: boolean;
    hovered: boolean;
    type: DatumType;
    lazy?: boolean;
};
export type ImmutableMetaDatum<E extends Any = Any, I = any, W = any> = FromJS<FormControlMetadata<E, I, W>>;
export type ImmutableMeta<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>> = Map<PK<M>, ImmutableMetaDatum>;
export type FormControlBasicDatum = {
    field: string;
    value: any;
} & DatumAttr;
export type FormControlDatum<F extends string, T> = {
    field: F;
    value: T;
} & DatumAttr;
export type FormControlStrDatum<F> = {
    field: F;
    value: string;
} & DatumAttr;
export type FormControlData = FormControlBasicDatum[];
export type AsyncValidationConfig = {
    debounceDuration: number;
    lazy: boolean;
};
export interface AsyncValidationNConfig extends AsyncValidationConfig {
    compare?: (var1: any, var2: any) => boolean;
}
export type $Validator = <A extends FormControlBasicDatum, B extends Partial<Record<C[number]["field"], FormControlBasicMetadata>>, C extends FormControlData>(fieldData: A, metadata: B, formData: C) => Observable<B> | Promise<B>;
export type $ImmutableValidator<F extends FormControlBasicDatum[]> = <A extends Map<keyof F[number], V<F[number]>>, B extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, C extends List<Map<keyof F[number], V<F[number]>>>>(fieldData: A, metadata: ImmutableMeta<F, B>, formData: C) => Observable<ImmutableMeta<F, B>> | Promise<ImmutableMeta<F, B>>;
export type FormStubs<F extends FormControlBasicDatum[]> = Array<{
    field: F[number]["field"];
    defaultValue?: F[number]["value"];
    type?: DatumType;
    $validator?: $Validator;
    $immutableValidator?: $ImmutableValidator<F>;
    lazy?: boolean;
    debounceDuration?: number;
    datumKeys?: Array<keyof F[number]>;
    comparator?: (v1: any, v2: any) => boolean;
}>;
export interface FormController<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> {
    setBulkAsyncValidator(asyncValidator: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>): void;
    setFields(fields: FormStubs<F>): void;
    getFields(): FormStubs<F>;
    setMetaComparator(metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean): void;
    setMetaComparatorMap(metaComparatorMap: {
        [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
    }): void;
    setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): void;
    setMetaCloneFunctionMap(cloneFunctionMap: {
        [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }): void;
    setDefaultMeta(meta: Partial<M>): void;
    setAsyncConfig(cfg: AsyncValidationNConfig): void;
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
    getClonedMeta(): Partial<M> | undefined;
    getFieldsMeta<KS extends Array<keyof M>>(fields: KS): Partial<M>;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType, $validator?: $Validator): this;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    appendFormData(fields: FormStubs<F>): this;
    removeFormData(fields: Array<F[number]["field"]>): this;
    setMetadata(meta: Partial<M>): this;
    setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;
    getClonedMetaByField<CF extends keyof M>(field: CF): Partial<M>[CF];
    getFieldMeta(field: F[number]["field"]): Partial<M>[F[number]["field"]];
    observeMeta(callback: (meta: Partial<M>) => void): () => void | undefined;
    observeMetaByFields<KS extends (keyof M)[]>(fields: KS, callback: (meta: Partial<M>) => void, comparator?: (meta1: Partial<M>, meta2: Partial<M>) => boolean): () => void;
    observeMetaByField<K extends keyof M>(field: K, callback: (metaOne: Partial<M>[K]) => void): () => void | undefined;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]>): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]>): () => void;
    observeFormData<CompareAts extends readonly number[] = number[]>(observer: (result: F[CompareAts[number]][]) => void, fields?: F[CompareAts[number]]["field"][], comparator?: Comparator<F[CompareAts[number]][]>): () => void;
    getDatum<At extends number = number>(field: F[At]["field"]): F[At] | undefined;
    getDatumValue<At extends number = number>(field: F[At]["field"]): F[At]["value"] | undefined;
    getFormData<Ats extends Readonly<number[]> = number[]>(fields?: F[Ats[number]]["field"][]): ReturnType<Record<S, () => F>[S]> | F[Ats[number]][];
    toFormData(): ToFormData;
}
export type NormalFormPluginBuilderParams<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> = {
    formSelector: S;
    validator: (formData: F, metadata: Partial<M>) => Partial<M>;
};
export type FormStub = {
    field: string;
    defaultValue?: string | number | boolean | FileList;
    type?: DatumType;
};
export type K<T> = keyof T;
export type V<T> = T[keyof T];
export type PK<T> = keyof Partial<T>;
export type PV<T> = Partial<T>[keyof Partial<T>];
export type ImmutableFormStubs = List<Map<K<FormStub>, V<FormStub>>>;
export type ToFormData = (form?: HTMLFormElement) => FormData;
export interface ImmutableFormController<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> {
    setBulkAsyncValidator(asyncValidator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>): void;
    setFields(fields: FormStubs<F>): void;
    setDefaultMeta(meta: Partial<M>): void;
    setAsyncConfig(cfg: AsyncValidationConfig): void;
    changeFormValue<N extends number>(field: F[N]["field"], value: F[N]["value"]): this;
    touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean): this;
    emptyFormField<N extends number>(field: F[N]["field"]): this;
    focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean): this;
    hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean): this;
    initiator: Initiator<F>;
    validator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => ImmutableMeta<F, M>;
    selector: () => S;
    asyncValidator?(formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>): Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>;
    startValidation(): (() => void) | undefined;
    getMeta(): ImmutableMeta<F, M>;
    getFieldMeta<N extends number = number, E extends Any = Any>(field: F[N]["field"]): ImmutableMetaDatum<E>;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType, $immutableValidator?: $ImmutableValidator<F>): this;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    appendFormData(fields: FormStubs<F>): this;
    removeFormData(fields: Array<F[number]["field"]>): this;
    setMetadata(meta: ImmutableMeta<F, M>): this;
    setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;
    getFieldsMeta(fields: F[number]["field"][]): ImmutableMeta<F, M>;
    observeMeta(callback: (meta: ImmutableMeta<F, M>) => void): () => void | undefined;
    observeMetaByField<K extends keyof M>(field: K, callback: (metaOne: ImmutableMetaDatum) => void): () => void | undefined;
    observeMetaByFields<KS extends (keyof M)[]>(fields: KS, callback: (meta: ImmutableMeta<F, M>) => void): () => void;
    observeFormData<Ats extends number[] = number[]>(observer: (result: List<Map<PK<F[Ats[number]]>, PV<F[Ats[number]]>>> | ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]>) => void, fields?: F[Ats[number]]["field"][]): () => void;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: Map<PK<ReturnType<Record<S, () => F>[S]>[CompareAt]>, PV<ReturnType<Record<S, () => F>[S]>[CompareAt]>>) => void): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void): () => void;
    getFormData<Ats extends number[] = number[]>(fields?: F[Ats[number]]["field"][]): List<Map<PK<F[Ats[number]]>, PV<F[Ats[number]]>>> | ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]>;
    getDatum<At extends number = number>(field: F[At]["field"]): Map<PK<F[At]>, PV<F[At]>>;
    getDatumValue<At extends number = number>(field: F[At]["field"]): NonNullable<V<F[number]>>;
    toFormData(): ToFormData;
}
export type ImmutableFormPluginBuilderParams<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> = {
    formSelector: S;
    validator: ImmutableFormController<F, M, S>["validator"];
};
export interface ConnectedCallback {
    connectedCallback(): void;
}
export interface DisconnectedCallback {
    disconnectedCallback(): void;
}
export interface AttributeChangedCallback<E extends HTMLElement = HTMLElement, P extends Any = {}> {
    attributeChangedCallback(key: K<E & P>, prev: V<E & P>, next: V<E & P>): void;
}
export interface FormControllerInjector<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> {
    setFormController(controller: FormController<F, M, S>): void;
}
export interface FieldDataMapperInjector<F extends FormControlData, N extends number = number> {
    setKeyboardEventMapperMapper(mapper: (ev: Event) => F[N]["value"]): void;
    setChangeEventMapperMapper(mapper: (ev: Event) => F[N]["value"]): void;
}
export interface NRFieldAttributeBinderInjector {
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
}
export interface IRFieldAttributeBinderInjector<F extends FormControlData> {
    setAttrBinder(binder: (attributeSetter: (k: string, v: any) => void, attrs: Map<K<F[number]>, V<F[number]>>) => void): void;
}
export interface OnSubmitInjector {
    setOnSubmit(submit: <T>(e: T, toFormData: ToFormData) => void): void;
}
export interface OnResetInjector {
    setOnReset(reset: <T>(e: T) => void): void;
}
export interface ListenerAccessor<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string, N extends number = number> {
    getBindingListeners<E extends HTMLElement>(formController: FormController<F, M, S> | ImmutableFormController<F, M, S>, field: F[N]["field"], current?: E): ListenersCache;
}
export type InstallDefinition = Partial<{
    formSelector: string;
    fieldNrSelector: string;
    fieldIrSelector: string;
}>;
export type CustomerAttrs = {
    placeholder?: boolean;
    defaultValue?: any;
    asyncState?: AsyncState;
    value?: any;
};
export type ListenersCache = {
    mouseover: () => void;
    mouseleave: () => void;
    focus: () => void;
    blur: () => void;
    keydown: (event: any) => void;
    change: (event: Event) => void;
};
export type ListenedAttributes = {
    ["data-target_id"]?: string;
    ["data-target_selector"]?: string;
};
export type FormDataset = {
    form_id?: string;
};
export type FieldDataset<F extends FormControlData, N extends number = number> = {
    field: F[N]["field"];
    target_id?: string;
    target_selector?: string;
    manual_binding?: "true" | "false";
    focused?: string;
    changed?: string;
    touched?: string;
    hovered?: string;
};
export {};
