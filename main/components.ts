import { bound } from "rx-store-core";
import { BehaviorSubject, Subject, Subscription, switchMap, tap } from "rxjs";
import {
  AttributeChangedCallback,
  ConnectedCallback,
  CustomerAttrs,
  DatumType,
  DisconnectedCallback,
  FieldDataMapperInjector,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  ImmutableFormController,
  K,
  FormControllerInjector,
  V,
  FormEventHandler,
} from "./interfaces";

export class FormFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends HTMLElement
  implements
    ConnectedCallback,
    DisconnectedCallback,
    AttributeChangedCallback<HTMLElement, CustomerAttrs>,
    FieldDataMapperInjector<F, N>,
    FormControllerInjector<F, M, S>
{
  protected field?: F[N]["field"];
  protected type?: DatumType;
  protected mapper?: (ev: any) => F[N]["value"];

  protected formControllerEmitter: BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  > = new BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  >(null);
  protected directChildEmitter: BehaviorSubject<HTMLElement | null> =
    new BehaviorSubject<HTMLElement | null>(null);
  protected subscription: Subscription | null = null;
  protected unBind?: () => void;

  protected isValidDirectChild(target?: Node | null): target is HTMLElement {
    return target instanceof HTMLElement && target.parentNode === this;
  }

  protected setDirectChildFromMutations(mutationList: MutationRecord[]) {
    const mutations = mutationList.filter(
      (mutation) => mutation.type === "childList"
    );

    if (this.unBind) {
      const removedAll = mutations.reduce((acc, next) => {
        Array.from(next.removedNodes).forEach((node) => {
          acc.push(node);
        });
        return acc;
      }, [] as Node[]);
      const removed = removedAll.find(
        (rm) => rm && this.directChildEmitter.value === rm
      );
      if (removed) {
        this.unBind();
      }
    }

    if (!this.dataset.targetSelector && !this.dataset.targetId) {
      const first = mutations[0].addedNodes.item(0);
      if (!this.isValidDirectChild(first)) {
        return;
      }
      this.directChildEmitter.next(first);
      return;
    }

    if (this.dataset.targetId) {
      const allAdded = mutations.reduce((acc, next) => {
        Array.from(next.addedNodes).forEach((node) => {
          acc.push(node);
        });
        return acc;
      }, [] as Node[]);
      const added = allAdded.find((a) => {
        a instanceof HTMLElement && a.id === this.dataset.targetId;
      });
      added && this.directChildEmitter.next(added as HTMLElement);
      return;
    }

    if (this.dataset.targetSelector) {
      const target = this.querySelector(this.dataset.targetSelector);
      target && this.directChildEmitter.next(target as HTMLElement);
    }
  }

  protected directChildIsTarget() {
    if (!this.directChildEmitter?.value && !this.children.item(0)) {
      return false;
    }

    return this.directChildEmitter.value === this.children.item(0);
  }

  protected observer = new MutationObserver(this.setDirectChildFromMutations);

  protected attachChildEventListeners(
    target: Node | null,
    formController:
      | FormController<F, M, S>
      | ImmutableFormController<F, M, S>
      | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    if (target instanceof HTMLElement) {
      target.addEventListener("mouseover", () => {
        formController.hoverFormField(field, true);
      });

      target.addEventListener("mouseleave", () => {
        formController.hoverFormField(field, false);
      });

      target.addEventListener("focus", () => {
        formController.focusFormField(field, true);
      });

      target.addEventListener("blur", () => {
        formController.focusFormField(field, false).touchFormField(field, true);
      });

      target.addEventListener("change", (event: any) => {
        if (this.mapper) {
          formController.changeFormValue(field, this.mapper(event));
          return;
        }
        formController.changeFormValue(field, event.target.value);
      });
    }
  }

  @bound
  protected attrSetter(target: HTMLElement) {
    return (k: string, v: any) => target.setAttribute(k, v);
  }

  protected setField(field: F[N]["field"]): void {
    if (this.field) {
      return;
    }
    this.field = field;
  }

  protected setDatumType(type: DatumType): void {
    if (this.type) {
      return;
    }
    this.type = type;
  }

  protected setRequiredProperties() {
    const field = this.getAttribute("data-field") as F[N]["field"];
    if (!field || !field.length) {
      throw new Error("Form field is not set");
    }
    this.setField(field);
    const type = this.getAttribute("data-type") ?? DatumType.SYNC;
    this.setDatumType(type as DatumType);
  }

  setDataMapper(mapper: (ev: any) => F[N]["value"]): void {
    this.mapper = mapper;
  }

  setNRFormController(
    controller: FormController<F, M, S> | ImmutableFormController<F, M, S>
  ): void {
    this.formControllerEmitter.next(controller);
  }

  getField() {
    return this.field;
  }

  getDatumType() {
    return this.type;
  }

  connectedCallback(): void {
    this.observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    this.setRequiredProperties();
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription?.unsubscribe();
    this.unBind?.();
  }

  attributeChangedCallback(
    key: K<HTMLElement & CustomerAttrs>,
    prev: V<HTMLElement & CustomerAttrs>,
    next: V<HTMLElement & CustomerAttrs>
  ) {
    const target = this.directChildEmitter.value;
    if (!target) {
      return;
    }

    if (key === "placeholder") {
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (this.directChildIsTarget()) {
          return;
        }
        target.setAttribute(key, next);
      }
    }

    if (key === "defaultValue") {
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (this.directChildIsTarget()) {
          return;
        }
        target.setAttribute(key, next);
      }
    }
  }

  static get observedAttributes() {
    return ["placeholder", "defaultValue"];
  }
}

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
    AttributeChangedCallback<HTMLElement>,
    FormEventHandler
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
    this.formElement.appendChild(this.removeChild(node));
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
    return this.formControllerEmitter
      .asObservable()
      .pipe(
        switchMap((controller) =>
          this.fieldListEmitter.asObservable().pipe(
            tap((nodeList) => {
              if (controller) {
                nodeList.forEach((node) =>
                  node.setNRFormController(controller)
                );
              }
            })
          )
        )
      )
      .subscribe();
  }

  private handleFirstRenderInForm() {
    Array.from(this.children).forEach(this.drillDownChild);
    this.appendChild(this.formElement);
  }

  private applyParentAttrs() {
    const attributes = this.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      if (!this.hasAttribute(attribute.name)) {
        this.removeAttribute(attribute.name);
      }
      this.formElement.setAttribute(attribute.name, attribute.value);
    }
  }

  setNRFormController(controller: FormController<F, M, S>): void {
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
    console.log({key, prev, next})
    if (typeof next === "string") {
      return this.formElement.setAttribute(key, next);
    }
  }

  attachFormHandler<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLFormElement, ev: HTMLElementEventMap[K]) => any
  ): void {
    this.formElement.addEventListener(type, listener);
  }

  deletedFormHandler<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLFormElement, ev: HTMLElementEventMap[K]) => any
  ): void {
    this.formElement.removeEventListener(type, listener);
  }
}
