import { RxNStore, Subscribable } from "rx-store-types";
import { FormController, FormControlData, Any, FormControlBasicMetadata, FormStubs } from "./interfaces";
import { Observable } from "rxjs";
declare class FormControllerImpl<F extends FormControlData, M extends Record<F[number]["field"], FormControlBasicMetadata>, S extends string> implements FormController<F, M> {
    private formSelector;
    validator: (formData: F) => Partial<M>;
    asyncValidator?: ((formData: F) => Observable<Partial<M>> | Promise<Partial<M>>) | undefined;
    private fields?;
    private metaComparator?;
    private connector?;
    private metadata$?;
    private unobserve?;
    private unobserveAsync?;
    private unobserveMeta?;
    constructor(formSelector: S, validator: (formData: F) => Partial<M>, asyncValidator?: ((formData: F) => Observable<Partial<M>> | Promise<Partial<M>>) | undefined, fields?: FormStubs<F> | undefined, metaComparator?: ((meta1: Partial<M>, meta2: Partial<M>) => boolean) | undefined);
    private reportNoneConnectedError;
    private safeExecute;
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
    private setAsyncState;
    getMeta(): Partial<M> | undefined;
    getFieldMeta(field: F[number]["field"]): Partial<M>[F[number]["field"]] | undefined;
    getFieldsMeta(fields: F[number]["field"][]): Partial<M>;
    private asyncValidatorExecutor;
    getFormSelector(): S;
    private observeMeta;
    startObserve(callback: (meta: Partial<M>) => void): this;
    stopObserve(): void;
    initiator(connector?: RxNStore<Any> & Subscribable<Any>): F;
    changeFormDatum<N extends number>(field: F[N]["field"], value: F[N]["value"]): this;
    hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean): this;
    resetFormDatum<N extends number>(field: F[N]["field"]): this;
    resetFormAll(): this;
    touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean): this;
    emptyFormField<N extends number>(field: F[N]["field"]): this;
    focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean): this;
    private createFormDatum;
    private fieldsDiff;
    updateFormFields(fields: Array<{
        field: F[number]["field"];
        defaultValue?: F[number]["value"];
    }>): this;
}
export default FormControllerImpl;
