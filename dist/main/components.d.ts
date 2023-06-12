import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { AttributeChangedCallback, ConnectedCallback, CustomerAttrs, DatumType, DisconnectedCallback, FieldDataMapperInjector, FormControlBasicMetadata, FormControlData, FormController, ImmutableFormController, K, FormControllerInjector, V } from "./interfaces";
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
export declare class FormControlComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> extends HTMLFormElement implements ConnectedCallback, DisconnectedCallback, FormControllerInjector<F, M, S> {
    protected fieldListEmitter: Subject<FormFieldComponent<F, M, S>[]>;
    protected formControllerEmitter: Subject<FormController<F, M, S> | ImmutableFormController<F, M, S> | null>;
    protected subscription: Subscription;
    protected setFieldListFromMutationRecords(mutationList: MutationRecord[]): void;
    protected observer: MutationObserver;
    protected controlAll(): Subscription;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    setNRFormController(controller: FormController<F, M, S>): void;
}
