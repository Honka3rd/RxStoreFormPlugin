import { bound, shallowCompare } from "rx-store-core";
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
  FormDataset,
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

  private locator?: string | null = null;

  private formHandlers = new WeakMap<
    HTMLFormElement,
    {
      submit: EventListener;
      reset: EventListener;
    }
  >();

  private getFieldsFromContainer(inserted: HTMLElement) {
    if (inserted instanceof FormFieldComponent) {
      return [inserted] as FormFieldComponent<F, M, S, number>[];
    }
    const fields: FormFieldComponent<F, M, S, number>[] = [];
    this.fillFields(fields, inserted.children);
    return fields;
  }

  private emitIncomingFields(inserted: HTMLElement) {
    const fields = this.getFieldsFromContainer(inserted);
    if (fields.length) {
      this.fieldListIncomingEmitter.next(fields);
    }
  }

  @bound
  private setFieldListFromMutationRecords(mutationList: MutationRecord[]) {
    const filtered = mutationList.filter(
      (mutation) => mutation.type === "childList"
    );

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

    const containedFields = filtered.reduce((acc, mutation) => {
      const nodes = Array.from(mutation.addedNodes);
      nodes.forEach((node) => {
        acc.push(node);
      });
      return acc;
    }, <Node[]>[]);

    const addedFields = containedFields.reduce((acc, container) => {
      if (container instanceof HTMLElement) {
        const fields = this.getFieldsFromContainer(container);
        fields.forEach((f) => {
          acc.push(f);
        });
      }
      return acc;
    }, <FormFieldComponent<F, M, S>[]>[]);

    if (addedFields.length) {
      this.fieldListIncomingEmitter.next(addedFields);
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

  @bound
  private compareFields(
    fields1: FormFieldComponent<F, M, S, number>[],
    fields2: FormFieldComponent<F, M, S, number>[]
  ) {
    return shallowCompare([...fields1].sort(), [...fields2].sort());
  }

  private controlAll() {
    return combineLatest([
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.fieldListIncomingEmitter
        .asObservable()
        .pipe(distinctUntilChanged(this.compareFields)),
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

  private getDataset() {
    return { form_id: this.locator } as FormDataset;
  }

  private setFormLocator() {
    this.locator = this.getAttribute("data-form_id");
  }

  private getDirectForm() {
    const selector = this.getDataset().form_id;
    if (selector) {
      const form = this.querySelector(`form[data-locator=${selector}]`);
      if (!(form instanceof HTMLFormElement)) {
        throw new Error(
          "a invalid form selector, which cannot locate a form element"
        );
      }
      return form;
    }
    return this.querySelector("form");
  }

  private fillFields(
    fields: FormFieldComponent<F, M, S, number>[],
    all = this.getDirectForm()?.children,
    map = new WeakMap()
  ) {
    if (!all) {
      return;
    }
    for (const node of Array.from(all)) {
      if (node instanceof FormFieldComponent && !map.has(node)) {
        fields.push(node);
      } else {
        if (!(node instanceof FormControlComponent)) {
          this.fillFields(fields, node.children, map);
        }
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
    this.emitIncomingFields(form);
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
    this.setFormLocator();
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
