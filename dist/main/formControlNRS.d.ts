import { Comparator, Initiator, PluginImpl } from "rx-store-types";
import { Observable } from "rxjs";
import { AsyncValidationNConfig, DatumType, FormControlBasicMetadata, FormControlData, FormController, FormStubs } from "./interfaces";
declare class FormControllerImpl<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string> extends PluginImpl<S, F> implements FormController<F, M, S> {
    validator: (formData: F, metadata: Partial<M>) => Partial<M>;
    private metadata$?;
    asyncValidator?: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>;
    private fields;
    private metaComparator?;
    private metaComparatorMap?;
    private cloneFunction?;
    private cloneFunctionMap?;
    private defaultMeta?;
    private asyncConfig;
    constructor(id: S, validator: (formData: F, metadata: Partial<M>) => Partial<M>);
    setAsyncValidator(asyncValidator: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>): void;
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
    private shallowCloneFormData;
    private safeClone;
    private findDatumByField;
    private findFromClonedAndExecute;
    private commitMutation;
    private safeCommitMutation;
    private safeCommitMeta;
    private removeDataByFields;
    private appendDataByFields;
    private validatorExecutor;
    private getExcludedMeta;
    private getAsyncFields;
    private setAsyncState;
    private getComparator;
    private asyncValidatorExecutor;
    private cloneMetaByField;
    private cloneMeta;
    private cast;
    getFormData(): ReturnType<Record<S, () => F>[S]>;
    initiator: Initiator<F>;
    getMeta(): Partial<M>;
    getDatum<At extends number = number>(field: F[At]["field"]): F[At] | undefined;
    getDatumValue<At extends number = number>(field: F[At]["field"]): F[At]["value"] | undefined;
    getClonedMetaByField<CF extends keyof Partial<M>>(field: CF): Partial<M>[CF];
    getClonedMeta(): Partial<M>;
    getFieldMeta<At extends number = number>(field: F[At]["field"]): Partial<M>[F[At]["field"]];
    getFieldsMeta<At extends number = number>(fields: F[At]["field"][]): Partial<M>;
    observeMeta(callback: (meta: Partial<M>) => void): () => void | undefined;
    observeMetaByField<K extends keyof M>(field: K, callback: (metaOne: Partial<M>[K]) => void): () => void | undefined;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]>): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void, comparator?: Comparator<ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]>): () => void;
    observeFormData<CompareAts extends Readonly<number[]> = number[]>(fields: F[CompareAts[number]]["field"][], observer: (result: F[CompareAts[number]][]) => void, comparator?: Comparator<F[CompareAts[number]][]>): () => void;
    startValidation(): (() => void) | undefined;
    changeFormValue<N extends number>(field: F[N]["field"], value: F[N]["value"]): this;
    hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean): this;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType): this;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean): this;
    emptyFormField<N extends number>(field: F[N]["field"]): this;
    focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean): this;
    appendFormData(fields: FormStubs<F>): this;
    removeFormData(fields: Array<F[number]["field"]>): this;
    setMetadata(meta: Partial<M>): this;
    setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;
}
export default FormControllerImpl;
