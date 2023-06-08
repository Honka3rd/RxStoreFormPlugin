import { Observable } from "rxjs";
import { FormControlBasicMetadata, FormControlData, FormController, FormStubs, ImmutableFormPluginBuilderParams, NormalFormPluginBuilderParams, PK, PV, V } from "./interfaces";
import { Plugin } from "rx-store-types";
import { ImmutableFormControllerImpl } from "./formControlIRS";
import { List, Map } from "immutable";
declare class NRFormBuilder<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> {
    private NRF;
    constructor({ formSelector, validator, }: NormalFormPluginBuilderParams<F, M, S>);
    setAsyncValidator(asyncValidator: (formData: F, metadata: Partial<M>) => Observable<Partial<M>> | Promise<Partial<M>>): this;
    setFields(fields: FormStubs<F>): this;
    setMetaComparator(metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean): this;
    setMetaComparatorMap(metaComparatorMap: {
        [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
    }): this;
    setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): this;
    setMetaCloneFunctionMap(cloneFunctionMap: {
        [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }): this;
    setDefaultMeta(meta: Partial<M>): this;
    getInstance(): FormController<F, M, S> & Plugin<S, any>;
}
declare class IRFormBuilder<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>, S extends string = string> {
    private IRF;
    constructor({ formSelector, validator, }: ImmutableFormPluginBuilderParams<F, M, S>);
    setAsyncValidator(asyncValidator: (formData: List<Map<keyof F[number], V<F[number]>>>, meta: Map<keyof M, Map<"errors" | "info" | "warn", any>>) => Observable<Map<PK<M>, PV<M>>> | Promise<Map<PK<M>, PV<M>>>): this;
    setFields(fields: FormStubs<F>): this;
    setDefaultMeta(meta: Partial<M>): this;
    getInstance(): ImmutableFormControllerImpl<F, M, S> & Plugin<S, any>;
}
export { NRFormBuilder, IRFormBuilder };
