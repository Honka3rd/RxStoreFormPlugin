import { Observable } from "rxjs";
import { AsyncValidationConfig, FormControlBasicMetadata, FormControlData, FormController, FormStubs, ImmutableFormController, ImmutableFormPluginBuilderParams, ImmutableMeta, NormalFormPluginBuilderParams, V } from "./interfaces";
import { List, Map } from "immutable";
declare class NRFormBuilder<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> {
    private NRF;
    constructor({ formSelector, validator, }: NormalFormPluginBuilderParams<F, M, S>);
    setBulkAsyncValidator(asyncValidator: (formData: F, metadata: () => Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>): this;
    setFields(fields: FormStubs<F, M>): this;
    setMetaComparator(metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean): this;
    setMetaComparatorMap(metaComparatorMap: {
        [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
    }): this;
    setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): this;
    setMetaCloneFunctionMap(cloneFunctionMap: {
        [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }): this;
    setDefaultMeta(meta: Partial<M>): this;
    setAsyncConfig(cfg: AsyncValidationConfig): this;
    getInstance(): FormController<F, M, S>;
}
declare class IRFormBuilder<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> {
    private IRF;
    constructor({ formSelector, validator, }: ImmutableFormPluginBuilderParams<F, M, S>);
    setBulkAsyncValidator(asyncValidator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: () => ImmutableMeta<F, M>) => Observable<ImmutableMeta<F, M>> | Promise<ImmutableMeta<F, M>>): this;
    setFields(fields: FormStubs<F, M>): this;
    setDefaultMeta(meta: Partial<M>): this;
    setAsyncConfig(cfg: AsyncValidationConfig): this;
    getInstance(): ImmutableFormController<F, M, S>;
}
export { NRFormBuilder, IRFormBuilder };
