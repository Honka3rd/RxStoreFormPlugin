import { AttributeChangedCallback, ConnectedCallback, DisconnectedCallback, FormControlBasicMetadata, FormControlData, FormController, FormControllerInjector, V } from "./interfaces";
export declare class FormControlComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, FormControllerInjector<F, M, S>, AttributeChangedCallback<HTMLElement> {
    private fieldListEmitter;
    private formControllerEmitter;
    private subscription?;
    private formElement;
    private drillDownChild;
    private setFieldListFromMutationRecords;
    private observer;
    private controlAll;
    private handleFirstRenderInForm;
    private applyParentAttrs;
    private overwriteEventListener;
    private fillFields;
    private emitFieldChildrenOnMount;
    constructor();
    setFormController(controller: FormController<F, M, S>): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(key: keyof HTMLElement, prev: V<HTMLElement>, next: V<HTMLElement>): void;
}
