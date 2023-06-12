import { BehaviorSubject, Subscription } from "rxjs";
import { AttributeChangedCallback, ConnectedCallback, CustomerAttrs, DatumType, DisconnectedCallback, FieldDataMapperInjector, FormControlBasicMetadata, FormControlData, FormController, ImmutableFormController, K, FormControllerInjector, V, FormEventHandler } from "./interfaces";
export declare class FormFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, AttributeChangedCallback<HTMLElement, CustomerAttrs>, FieldDataMapperInjector<F, N>, FormControllerInjector<F, M, S> {
    protected field?: F[N]["field"];
    protected type?: DatumType;
    protected mapper?: (ev: any) => F[N]["value"];
    protected formControllerEmitter: BehaviorSubject<FormController<F, M, S> | ImmutableFormController<F, M, S> | null>;
    protected directChildEmitter: BehaviorSubject<HTMLElement | null>;
    protected subscription: Subscription | null;
    protected unBind?: () => void;
    protected isValidDirectChild(target?: Node | null): target is HTMLElement;
    protected setDirectChildFromMutations(mutationList: MutationRecord[]): void;
    protected directChildIsTarget(): boolean;
    protected observer: MutationObserver;
    protected attachChildEventListeners(target: Node | null, formController: FormController<F, M, S> | ImmutableFormController<F, M, S> | null): void;
    protected attrSetter(target: HTMLElement): (k: string, v: any) => void;
    protected setField(field: F[N]["field"]): void;
    protected setDatumType(type: DatumType): void;
    protected setRequiredProperties(): void;
    setDataMapper(mapper: (ev: any) => F[N]["value"]): void;
    setNRFormController(controller: FormController<F, M, S> | ImmutableFormController<F, M, S>): void;
    getField(): F[N]["field"] | undefined;
    getDatumType(): DatumType | undefined;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(key: K<HTMLElement & CustomerAttrs>, prev: V<HTMLElement & CustomerAttrs>, next: V<HTMLElement & CustomerAttrs>): void;
    static get observedAttributes(): string[];
}
export declare class FormControlComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, FormControllerInjector<F, M, S>, AttributeChangedCallback<HTMLElement>, FormEventHandler {
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
    setNRFormController(controller: FormController<F, M, S>): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(key: keyof HTMLElement, prev: V<HTMLElement>, next: V<HTMLElement>): void;
    attachFormHandler<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLFormElement, ev: HTMLElementEventMap[K]) => any): void;
    deletedFormHandler<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLFormElement, ev: HTMLElementEventMap[K]) => any): void;
}
