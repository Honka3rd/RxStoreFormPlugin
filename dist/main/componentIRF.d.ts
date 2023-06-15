import { FormFieldComponent } from "./field";
import { FormControlBasicMetadata, FormControlData, IRFieldAttributeBinderInjector, K, V, DisconnectedCallback } from "./interfaces";
import { Map } from "immutable";
export declare class IRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements IRFieldAttributeBinderInjector<F>, DisconnectedCallback {
    private attributeBinder?;
    private metaDataBinder?;
    private attributesBinding;
    protected makeControl(): void;
    constructor();
    setMetaBinder(binder: (attributeSetter: (k: string, v: any) => void, meta: Map<"errors" | "info" | "warn", Map<string, any>>) => void): void;
    setAttrBinder(binder: (attributeSetter: (k: string, v: any) => void, attrs: Map<K<F[number]>, V<F[number]>>) => void): void;
    disconnectedCallback(): void;
}
