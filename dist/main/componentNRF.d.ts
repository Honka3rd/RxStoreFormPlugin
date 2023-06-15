import { Subscription } from "rxjs";
import { FormFieldComponent } from "./field";
import { FormControlBasicDatum, FormControlBasicMetadata, FormControlData, FormControllerInjector, NRFieldAttributeBinderInjector, DisconnectedCallback } from "./interfaces";
export declare class NRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements NRFieldAttributeBinderInjector, FormControllerInjector<F, M, S>, DisconnectedCallback {
    private subscription;
    private attributeBinder?;
    private attributesBinding;
    protected makeControl(): Subscription;
    constructor();
    setAttrBinder(binder: <D extends FormControlBasicDatum>(attributeSetter: (k: string, v: any) => void, attrs: D) => void): void;
    disconnectedCallback(): void;
}
