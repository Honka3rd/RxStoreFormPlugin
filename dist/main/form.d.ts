import { ConnectedCallback, DisconnectedCallback, FormControlBasicMetadata, FormControlData, FormController, FormControllerInjector, ImmutableFormController } from "./interfaces";
export declare class FormControlComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, FormControllerInjector<F, M, S> {
    private fieldListEmitter;
    private formControllerEmitter;
    private subscription?;
    private setFieldListFromMutationRecords;
    private observer;
    private controlAll;
    private getDirectForm;
    private fillFields;
    private emitFieldChildrenOnMount;
    setFormController(controller: FormController<F, M, S> | ImmutableFormController<F, M, S>): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
