import { Subscription } from "rxjs";
import { FormFieldComponent } from "./field";
import { DisconnectedCallback, FormControlBasicMetadata, FormControlData, FormControllerInjector, IRFieldAttributeBinderInjector, K, V } from "./interfaces";
import { Map } from "immutable";
export declare class IRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements IRFieldAttributeBinderInjector<F>, DisconnectedCallback, FormControllerInjector<F, M, S> {
    private subscription;
    private attributeBinder?;
    private attributesBinding;
    protected makeControl(): Subscription;
    constructor();
    setAttrBinder(binder: (attributeSetter: (k: string, v: any) => void, attrs: Map<K<F[number]>, V<F[number]>>) => void): void;
    disconnectedCallback(): void;
}
