import { FormFieldComponent } from "./components";
import { FormControlBasicDatum, FormControlBasicMetadata, FormControlData, NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector } from "./interfaces";
export declare class NRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements NRFieldAttributeBinderInjector, NRFieldMetaBinderInjector {
    private attributeBinder?;
    private metaDataBinder?;
    private valuesBinding;
    private metaBinding;
    protected makeControl(): import("rxjs").Subscription;
    constructor();
    setMetaBinder(binder: <M extends FormControlBasicMetadata>(attributeSetter: (k: string, v: any) => void, meta: M) => void): void;
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
}