import { Plugin } from "rx-store-types";
import { FormControlBasicMetadata, FormControlData, FormController, FormStubs, NormalFormPluginBuilderParams } from "./main/interfaces";
import { Observable } from "rxjs";
declare class NRFormBuilder<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>, S extends string> {
    private NRF;
    constructor({ formSelector, validator, }: NormalFormPluginBuilderParams<F, M, S>);
    setAsyncValidator(asyncValidator: (formData: F) => Observable<Partial<M>> | Promise<Partial<M>>): this;
    setFields(fields: FormStubs<F>): this;
    setMetaComparator(metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean): this;
    setMetaComparatorMap(metaComparatorMap: {
        [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
    }): this;
    setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>): this;
    setMetaCloneFunctionMap(cloneFunctionMap: {
        [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
    }): this;
    build(): FormController<F, M, S> & Plugin<S>;
}
export { NRFormBuilder };
