import { BehaviorSubject } from "rxjs";
import { ConnectedCallback, DatumType, DisconnectedCallback, FieldDataMapperInjector, FormControlBasicMetadata, FormControlData, FormController, FormControllerInjector, ImmutableFormController } from "./interfaces";
export declare class FormFieldComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string, N extends number = number> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, FieldDataMapperInjector<F, N>, FormControllerInjector<F, M, S> {
    protected field?: F[N]["field"];
    protected type?: DatumType;
    protected mapper?: (ev: any) => F[N]["value"];
    protected formControllerEmitter: BehaviorSubject<FormController<F, M, S> | ImmutableFormController<F, M, S> | null>;
    protected directChildEmitter: BehaviorSubject<HTMLElement | null>;
    protected stopBinding?: () => void;
    protected isValidDirectChild(target?: Node | null): target is HTMLElement;
    private reportMultiChildError;
    protected setDirectChildFromMutations(mutationList: MutationRecord[]): void;
    protected directChildIsTarget(): boolean | null;
    protected observer: MutationObserver;
    protected attachChildEventListeners(target: [Node | null, Node | null], formController: FormController<F, M, S> | ImmutableFormController<F, M, S> | null): void;
    private setInputDefault;
    private setInputDefaultsOnMount;
    private emitOnlyChildOnMount;
    protected attrSetter(target: HTMLElement): (k: string, v: any) => void;
    protected setField(field: F[N]["field"]): void;
    protected setDatumType(type: DatumType): void;
    protected setRequiredProperties(): void;
    setDataMapper(mapper: (ev: any) => F[N]["value"]): void;
    setFormController(controller: FormController<F, M, S> | ImmutableFormController<F, M, S>): void;
    getField(): F[N]["field"] | undefined;
    getDatumType(): DatumType | undefined;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
