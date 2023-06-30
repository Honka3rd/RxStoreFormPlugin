import { Any, Initiator, PluginImpl } from "rx-store-types";
import { $ImmutableValidator, AsyncValidationConfig, DatumType, FormControlBasicMetadata, FormControlData, FormStubs, ImmutableFormController, ImmutableMeta, ImmutableMetaDatum, K, PK, PV, V } from "./interfaces";
import { List, Map } from "immutable";
import { Observable } from "rxjs";
import { Subscriptions } from "./subscriptions";
export declare class ImmutableFormControllerImpl<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> extends PluginImpl<S, F> implements ImmutableFormController<F, M, S> {
    validator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => ImmutableMeta<F, M>;
    private subscriptions;
    private asyncConfig;
    private metadata$?;
    private fields?;
    private defaultMeta?;
    asyncValidator?: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>;
    constructor(id: S, validator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => ImmutableMeta<F, M>, subscriptions: Subscriptions);
    setFields(fields: FormStubs<F>): void;
    getFields(): FormStubs<F>;
    setDefaultMeta(meta: Partial<M>): void;
    setAsyncConfig(cfg: AsyncValidationConfig): void;
    private partialCompare;
    private getFieldSource;
    private getSingleSource;
    private connect;
    private getChangedMetaAsync;
    private commitMetaAsyncIndicator;
    private listenToExcludedAll;
    private removeDataByFields;
    private commitMutation;
    private findDatumByField;
    private getExcludedFields;
    private appendDataByFields;
    private cast;
    private getDatumIndex;
    private validatorExecutor;
    private isPromise;
    private getAsyncFields;
    private asyncValidatorExecutor;
    getFormData<CompareAts extends readonly number[] = number[]>(fields?: F[CompareAts[number]]["field"][]): List<Map<PK<F[CompareAts[number]]>, PV<F[CompareAts[number]]>>> | ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]>;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    appendFormData(fields: FormStubs<F>): this;
    removeFormData(fields: F[number]["field"][]): this;
    setMetadata(meta: ImmutableMeta<F, M>): this;
    setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;
    observeMeta(callback: (meta: ImmutableMeta<F, M>) => void): () => void | undefined;
    observeMetaByField<K extends keyof M, E extends Any = Any, I = any, W = any>(field: K, callback: (metaOne: ImmutableMetaDatum<E, I, W>) => void): () => void | undefined;
    observeMetaByFields<KS extends Array<keyof M>>(fields: KS, callback: (meta: ImmutableMeta<F, M>) => void): () => void | undefined;
    observeFormData<CompareAts extends readonly number[] = number[]>(observer: (result: List<Map<keyof F[CompareAts[number]], PV<F[CompareAts[number]]>>> | ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]>) => void, fields?: F[CompareAts[number]]["field"][]): () => void;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: Map<keyof ReturnType<Record<S, () => F>[S]>[CompareAt], PV<ReturnType<Record<S, () => F>[S]>[CompareAt]>>) => void): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void): () => void;
    getDatum<At extends number = number>(field: F[At]["field"]): Map<keyof F[At], PV<F[At]>>;
    getDatumValue<At extends number = number>(field: F[At]["field"]): NonNullable<V<F[number]>>;
    getFieldMeta<N extends number = number, E extends Any = Any>(field: F[N]["field"]): ImmutableMetaDatum<E>;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType, $immutableValidator?: $ImmutableValidator<F>): this;
    getFieldsMeta(fields: F[number]["field"][]): ImmutableMeta<F, M>;
    setBulkAsyncValidator(asyncValidator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: ImmutableMeta<F, M>) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>): void;
    changeFormValue<N extends number>(field: F[N]["field"], value: F[N]["value"]): this;
    touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean): this;
    emptyFormField<N extends number>(field: F[N]["field"]): this;
    focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean): this;
    hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean): this;
    startValidation(): (() => void) | undefined;
    getMeta(): ImmutableMeta<F, M>;
    toFormData(): (form?: HTMLFormElement) => FormData;
    initiator: Initiator<List<Map<K<F[number]>, V<F[number]>>>>;
}
