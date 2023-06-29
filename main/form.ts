import { bound } from "rx-store-core";
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  distinctUntilChanged,
} from "rxjs";
import { FormFieldComponent } from "./field";
import {
  ConnectedCallback,
  DisconnectedCallback,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormControllerInjector,
  ImmutableFormController,
  OnResetInjector,
  OnSubmitInjector,
  ToFormData,
} from "./interfaces";
import { Any } from "rx-store-types";

export class FormControlComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string
  >
  extends HTMLElement
  implements
    ConnectedCallback,
    DisconnectedCallback,
    FormControllerInjector<F, M, S>,
    OnSubmitInjector,
    OnResetInjector
{
  private fieldListIncomingEmitter: BehaviorSubject<
    FormFieldComponent<F, M, S>[]
  > = new BehaviorSubject<FormFieldComponent<F, M, S>[]>([]);
  private formControllerEmitter: BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  > = new BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  >(null);
  private formIncomingEmitter: BehaviorSubject<HTMLFormElement | null> =
    new BehaviorSubject<HTMLFormElement | null>(null);

  private subscription?: Subscription;

  private submitCustomHandler?: <T extends Any = Event>(
    e: T,
    toFormData: ToFormData
  ) => void;

  private resetCustomHandler?: <T extends Any = Event>(e: T) => void;

  private formHandlers = new WeakMap<
    HTMLFormElement,
    {
      submit: EventListener;
      reset: EventListener;
    }
  >();

  @bound
  private setFieldListFromMutationRecords(mutationList: MutationRecord[]) {
    const filtered = mutationList.filter(
      (mutation) => mutation.type === "childList"
    );

    const addedFields = filtered.reduce((acc, mutation) => {
      Array.from(mutation.addedNodes)
        .filter((node) => node instanceof FormFieldComponent)
        .forEach((node) => {
          acc.push(node as FormFieldComponent<F, M, S>);
        });
      return acc;
    }, <FormFieldComponent<F, M, S>[]>[]);

    if (addedFields.length) {
      this.fieldListIncomingEmitter.next(addedFields);
    }

    const insertedForm = filtered
      .reduce((acc, mutation) => {
        const nodes = Array.from(mutation.addedNodes);
        nodes.forEach((node) => {
          acc.push(node);
        });
        return acc;
      }, <Node[]>[])
      .find((node) => node instanceof HTMLFormElement) as HTMLFormElement;

    if (insertedForm) {
      this.formIncomingEmitter.next(insertedForm);
    }

    const removedForm = filtered
      .reduce((acc, mutation) => {
        const nodes = Array.from(mutation.removedNodes);
        nodes.forEach((node) => {
          acc.push(node);
        });
        return acc;
      }, <Node[]>[])
      .find((node) => node instanceof HTMLFormElement) as HTMLFormElement;

    if (removedForm) {
      const handlers = this.formHandlers.get(removedForm);
      if (handlers?.submit) {
        removedForm.removeEventListener("submit", handlers.submit);
      }

      if (handlers?.reset) {
        removedForm.removeEventListener("reset", handlers.reset);
      }

      this.formIncomingEmitter.next(null);
    }
  }

  private fieldsObserver = new MutationObserver(
    this.setFieldListFromMutationRecords
  );

  private controlAll() {
    return combineLatest([
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.fieldListIncomingEmitter.asObservable().pipe(distinctUntilChanged()),
      this.formIncomingEmitter.asObservable().pipe(distinctUntilChanged()),
    ] as const).subscribe(([controller, fields, form]) => {
      if (!controller || !fields) {
        return;
      }

      if (form) {
        form.setAttribute("data-selector", controller.selector());
        const onSubmit = (e: Any) => {
          e.preventDefault();
          this.submitCustomHandler?.(e, controller.toFormData());
        };

        const onReset = (e: Any) => {
          e.preventDefault();
          this.resetCustomHandler?.(e);
          controller.resetFormAll();
        };

        form.addEventListener("submit", onSubmit);
        form.addEventListener("reset", onReset);

        this.formHandlers.set(form, {
          submit: onSubmit,
          reset: onReset,
        });
      }

      fields.forEach((node) => node.setFormController(controller));
    });
  }

  private getDirectForm() {
    return this.querySelector("form");
  }

  private fillFields(
    fields: FormFieldComponent<F, M, S, number>[],
    all = this.getDirectForm()?.children ?? [],
    map = new WeakMap()
  ) {
    for (const node of Array.from(all)) {
      if (node instanceof FormFieldComponent && !map.has(node)) {
        fields.push(node);
      } else {
        this.fillFields(fields, node.children, map);
      }
      map.set(node, node);
    }
  }

  private emitFieldChildrenOnMount() {
    if (!this.children.length) {
      return;
    }
    const form = this.getDirectForm();
    if (!form) {
      return;
    }
    this.formIncomingEmitter.next(form);
    const fields: FormFieldComponent<F, M, S, number>[] = [];
    this.fillFields(fields, form.children);
    if (fields.length) {
      this.fieldListIncomingEmitter.next(fields);
    }
  }

  setFormController(
    controller: FormController<F, M, S> | ImmutableFormController<F, M, S>
  ): void {
    this.getDirectForm()?.setAttribute("data-selector", controller.selector());
    this.formControllerEmitter.next(controller);
  }

  setOnReset(reset: <T extends Any = Event>(e: T) => void): void {
    this.resetCustomHandler = reset;
  }

  setOnSubmit(
    submit: <T extends Any = Event>(e: T, toFormData: ToFormData) => void
  ): void {
    this.submitCustomHandler = submit;
  }

  connectedCallback(): void {
    this.fieldsObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    this.emitFieldChildrenOnMount();
    this.subscription = this.controlAll();
  }

  disconnectedCallback(): void {
    this.fieldsObserver.disconnect();
    this.subscription?.unsubscribe();
  }
}
