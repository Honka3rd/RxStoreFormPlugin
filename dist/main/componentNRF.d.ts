import { FormFieldComponent } from "./field";
import { FormControlBasicDatum, FormControlBasicMetadata, FormControlData, FormControllerInjector, NRFieldAttributeBinderInjector } from "./interfaces";
export declare class NRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements NRFieldAttributeBinderInjector, FormControllerInjector<F, M, S> {
    private attributeBinder?;
    private attributesBinding;
    protected makeControl(): void;
    constructor();
    setMetaBinder(binder: <M extends FormControlBasicMetadata>(attributeSetter: (k: string, v: any) => void, meta: M) => void): void;
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
}
