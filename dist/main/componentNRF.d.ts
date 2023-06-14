import { FormFieldComponent } from "./field";
import { FormControlBasicDatum, FormControlBasicMetadata, FormControlData, FormControllerInjector, NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector } from "./interfaces";
export declare class NRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector, FormControllerInjector<F, M, S> {
    private attributeBinder?;
    private metaDataBinder?;
    private attributesBinding;
    private metaBinding;
    private binder;
    protected makeControl(): import("rxjs").Subscription;
    constructor();
    setMetaBinder(binder: <M extends FormControlBasicMetadata>(attributeSetter: (k: string, v: any) => void, meta: M) => void): void;
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
}
