import { ConnectedCallback, DisconnectedCallback, FormControlBasicMetadata, FormControlData, FormController, FormControllerInjector, ImmutableFormController, OnResetInjector, OnSubmitInjector, ToFormData } from "./interfaces";
import { Any } from "rx-store-types";
export declare class FormControlComponent<F extends FormControlData, M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>, S extends string = string> extends HTMLElement implements ConnectedCallback, DisconnectedCallback, FormControllerInjector<F, M, S>, OnSubmitInjector, OnResetInjector {
    private fieldListIncomingEmitter;
    private formControllerEmitter;
    private formIncomingEmitter;
    private subscription?;
    private submitCustomHandler?;
    private resetCustomHandler?;
    private formHandlers;
    private setFieldListFromMutationRecords;
    private fieldsObserver;
    private controlAll;
    private getDirectForm;
    private fillFields;
    private emitFieldChildrenOnMount;
    setFormController(controller: FormController<F, M, S> | ImmutableFormController<F, M, S>): void;
    setOnReset(reset: <T extends Any = Event>(e: T) => void): void;
    setOnSubmit(submit: <T extends Any = Event>(e: T, toFormData: ToFormData) => void): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
