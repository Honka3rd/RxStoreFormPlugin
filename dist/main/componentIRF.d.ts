import { FormFieldComponent } from "./field";
import { FormControlBasicMetadata, FormControlData, IRFieldAttributeBinderInjector, IRFieldMetaBinderInjector, ImmutableFormController, K, V } from "./interfaces";
import { Map } from "immutable";
export declare class IRFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends FormFieldComponent<F, M, S, N> implements IRFieldAttributeBinderInjector<F>, IRFieldMetaBinderInjector {
    private attributeBinder?;
    private metaDataBinder?;
    private attributesBinding;
    private metaBinding;
    private binder;
    protected makeControl(): import("rxjs").Subscription;
    constructor();
    setFormController(controller: ImmutableFormController<F, M, S>): void;
    setMetaBinder(binder: (attributeSetter: (k: string, v: any) => void, meta: Map<"errors" | "info" | "warn", Map<string, any>>) => void): void;
    setAttrBinder(binder: (attributeSetter: (k: string, v: any) => void, attrs: Map<K<F[number]>, V<F[number]>>) => void): void;
}
