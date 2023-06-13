import { FormFieldComponent } from "./field";
import { FormControlBasicDatum, FormControlBasicMetadata, FormControlData, FormController, FormControllerInjector, NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector } from "./interfaces";
export declare class NRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector, FormControllerInjector<F, M, S> {
    private attributeBinder?;
    private metaDataBinder?;
    private valuesBinding;
    private metaBinding;
    protected makeControl(): import("rxjs").Subscription;
    constructor();
    setFormController(controller: FormController<F, M, S>): void;
    setMetaBinder(binder: <M extends FormControlBasicMetadata>(attributeSetter: (k: string, v: any) => void, meta: M) => void): void;
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
}
