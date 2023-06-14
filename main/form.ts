import { bound } from "rx-store-core";
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  distinctUntilChanged,
} from "rxjs";
import { FormFieldComponent } from "./field";
import {
  AttributeChangedCallback,
  ConnectedCallback,
  DisconnectedCallback,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormControllerInjector,
  ImmutableFormController,
  V,
} from "./interfaces";

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
    AttributeChangedCallback<HTMLElement>
{
  private fieldListEmitter: Subject<FormFieldComponent<F, M, S>[]> =
    new BehaviorSubject<FormFieldComponent<F, M, S>[]>([]);
  private formControllerEmitter: Subject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  > = new BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  >(null);

  private subscription?: Subscription;

  private formElement = document.createElement("form");

  @bound
  private drillDownChild(node: Node) {
    if (this.contains(node)) {
      this.removeChild(node);
    }
    if (!this.formElement.contains(node)) {
      this.formElement.appendChild(node);
    }
  }

  @bound
  private setFieldListFromMutationRecords(mutationList: MutationRecord[]) {
    const nodes: FormFieldComponent<F, M, S>[] = [];
    mutationList
      .filter((mutation) => mutation.type === "childList")
      .forEach((mutation) =>
        Array.from(mutation.addedNodes).forEach((node) => {
          this.drillDownChild(node);
          if (!(node instanceof FormFieldComponent)) {
            return;
          }
          nodes.push(node);
        })
      );
    this.fieldListEmitter.next(nodes);
  }

  private observer = new MutationObserver(this.setFieldListFromMutationRecords);

  private controlAll() {
    return combineLatest([
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.fieldListEmitter.asObservable().pipe(distinctUntilChanged()),
    ] as const).subscribe(([controller, fields]) => {
      if (!controller || !fields) {
        return;
      }
      fields.forEach((node) => node.setFormController(controller));
    });
  }

  private handleFirstRenderInForm() {
    Array.from(this.children).forEach(this.drillDownChild);
    this.appendChild(this.formElement);
  }

  private applyParentAttrs() {
    const attributes = this.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      this.removeAttribute(attribute.name);
      this.formElement.setAttribute(attribute.name, attribute.value);
    }
  }

  private overwriteEventListener() {
    this.addEventListener = <K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      this.formElement.addEventListener(type, listener, options);
    };

    this.removeEventListener = <K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      this.formElement.removeEventListener(type, listener, options);
    };

    return this;
  }

  private fillFields(
    fields: FormFieldComponent<F, M, S, number>[],
    all = this.formElement.children
  ) {
    for (const node of Array.from(all)) {
      if (node instanceof FormFieldComponent) {
        fields.push(node);
      } else {
        this.fillFields(fields, node.children);
      }
    }
  }

  private emitFieldChildrenOnMount() {
    const fields: FormFieldComponent<F, M, S, number>[] = [];
    this.fillFields(fields);
    this.fieldListEmitter.next(fields);
  }

  constructor() {
    super();
    this.overwriteEventListener();
  }

  setFormController(controller: FormController<F, M, S>): void {
    this.formElement.setAttribute("data-selector", controller.selector());
    this.formControllerEmitter.next(controller);
  }

  connectedCallback(): void {
    this.handleFirstRenderInForm();
    this.applyParentAttrs();
    this.observer.observe(this.formElement, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    this.emitFieldChildrenOnMount();
    this.subscription = this.controlAll();
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription?.unsubscribe();
  }

  attributeChangedCallback(
    key: keyof HTMLElement,
    prev: V<HTMLElement>,
    next: V<HTMLElement>
  ): void {
    if (typeof next === "string") {
      return this.formElement.setAttribute(key, next);
    }
  }
}
