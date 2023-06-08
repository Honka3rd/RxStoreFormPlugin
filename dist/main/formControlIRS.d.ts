import { Initiator, PluginImpl } from "rx-store-types";
import { AsyncValidationConfig, DatumType, FormControlBasicMetadata, FormControlData, FormStubs, ImmutableFormController, K, PK, PV, V } from "./interfaces";
import { List, Map } from "immutable";
import { Observable } from "rxjs";
export declare class ImmutableFormControllerImpl<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>, S extends string> extends PluginImpl<S> implements ImmutableFormController<F, M, S> {
    validator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>) => Map<PK<M>, Map<"errors" | "info" | "warn", any>>;
    asyncValidator?: ((formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<PK<M>, Map<"errors" | "info" | "warn", any>>) => Observable<Map<PK<M>, Map<"errors" | "info" | "warn", any>>> | Promise<Map<PK<M>, Map<"errors" | "info" | "warn", any>>>) | undefined;
    private asyncConfig;
    private metadata$?;
    private fields?;
    private defaultMeta?;
    constructor(id: S, validator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>) => Map<PK<M>, Map<"errors" | "info" | "warn", any>>, asyncValidator?: ((formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<PK<M>, Map<"errors" | "info" | "warn", any>>) => Observable<Map<PK<M>, Map<"errors" | "info" | "warn", any>>> | Promise<Map<PK<M>, Map<"errors" | "info" | "warn", any>>>) | undefined);
    setFields(fields: FormStubs<F>): void;
    setDefaultMeta(meta: Partial<M>): void;
    setAsyncConfig(cfg: AsyncValidationConfig): void;
    private removeDataByFields;
    private commitMutation;
    private findDatumByField;
    private appendDataByFields;
    private cast;
    private getDatumIndex;
    private validatorExecutor;
    private isPromise;
    private getAsyncFields;
    private setAsyncState;
    private getExcludedMeta;
    private asyncValidatorExecutor;
    getFormData(): ReturnType<Record<S, () => List<Map<keyof F[number], V<F[number]>>>>[S]>;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    appendFormData(fields: FormStubs<F>): this;
    removeFormData(fields: F[number]["field"][]): this;
    setMetadata(meta: Map<keyof M, Map<"errors" | "info" | "warn", Map<string, any>>>): this;
    setMetaByField<K extends keyof M>(field: K, metaOne: Partial<M>[K]): this;
    observeMeta(callback: (meta: Map<PK<M>, Map<"errors" | "info" | "warn", Map<string, any>>>) => void): () => void | undefined;
    observeMetaByField<K extends keyof M>(field: K, callback: (metaOne: Map<"errors" | "info" | "warn", Map<string, any>>) => void): () => void | undefined;
    observeFormData<CompareAts extends readonly number[] = number[]>(fields: F[CompareAts[number]]["field"][], observer: (result: List<Map<keyof F[CompareAts[number]], PV<F[CompareAts[number]]>>>) => void): () => void;
    observeFormDatum<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: Map<keyof ReturnType<Record<S, () => F>[S]>[CompareAt], PV<ReturnType<Record<S, () => F>[S]>[CompareAt]>>) => void): () => void;
    observeFormValue<CompareAt extends number = number>(field: F[CompareAt]["field"], observer: (result: ReturnType<Record<S, () => F>[S]>[CompareAt]["value"]) => void): () => void;
    getDatum<At extends number = number>(field: F[At]["field"]): Map<keyof F[At], PV<F[At]>>;
    getFieldMeta<N extends number = number>(field: F[N]["field"]): Map<"errors" | "info" | "warn", Map<string, any>>;
    changeFieldType<N extends number>(field: F[N]["field"], type: DatumType): this;
    getFieldsMeta(fields: F[number]["field"][] | List<F[number]["field"]>): Map<PK<M>, PV<M>>;
    setAsyncValidator(asyncValidator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>) => Observable<Map<PK<M>, Map<"errors" | "info" | "warn", any>>> | Promise<Map<PK<M>, Map<"errors" | "info" | "warn", any>>>): void;
    changeFormValue<N extends number>(field: F[N]["field"], value: F[N]["value"]): this;
    touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean): this;
    emptyFormField<N extends number>(field: F[N]["field"]): this;
    focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean): this;
    hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean): this;
    startValidation(): (() => void) | undefined;
    getMeta(): Map<PK<M>, Map<"errors" | "info" | "warn", any>>;
    initiator: Initiator<List<Map<K<F[number]>, V<F[number]>>>>;
}
