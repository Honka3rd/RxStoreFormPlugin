import { bound } from "rx-store-core";
import {
    BehaviorSubject,
    Subscription
} from "rxjs";
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
    FormControllerInjector,
    ImmutableFormController,
    K,
    V,
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

  private reportMultiChildError() {
    if (this.children.length > 1) {
      throw new Error(
        `${this.dataset.field} has multiple child, only accept one child`
      );
    }
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
      this.reportMultiChildError();
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
      this.reportMultiChildError();
      const added = allAdded.find((a) => {
        a instanceof HTMLElement && a.id === this.dataset.target_id;
      });
      added && this.directChildEmitter.next(added as HTMLElement);
      return;
    }

    if (this.dataset.target_selector) {
      const target = this.querySelector(this.dataset.target_selector);
      this.reportMultiChildError();
      target && this.directChildEmitter.next(target as HTMLElement);
    }
  }

  protected directChildIsTarget() {
    const { value } = this.directChildEmitter;

    return value && value === this.children.item(0);
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

  private setInputDefault(target: Node, key: string, next: string) {
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.setAttribute(key, next);
    }
  }

  private setInputDefaults(target: Node | null, key: string, next: string) {
    if (!target) {
      return;
    }

    if (key === "placeholder") {
      this.setInputDefault(target, key, next);
    }

    if (key === "defaultValue") {
      this.setInputDefault(target, key, next);
    }
  }

  private setInputDefaultsOnMount() {
    const first = this.directChildEmitter.value;
    if (!first) {
      return;
    }

    const placeholder = this.getAttribute("placeholder");
    placeholder && this.setInputDefault(first, "placeholder", placeholder);

    const defaultValue = this.getAttribute("defaultValue");
    defaultValue && this.setInputDefault(first, "defaultValue", defaultValue);
  }

  private emitOnlyChildOnMount() {
    if (!this.dataset.target_selector && !this.dataset.target_id) {
      const first = this.children.item(0);
      if (!this.isValidDirectChild(first)) {
        return this;
      }

      this.directChildEmitter.next(first);
      return this;
    }

    if (this.dataset.target_id) {
      const first = this.children
        .item(0)
        ?.querySelector(`#${this.dataset.target_id}`);
      if (!this.isValidDirectChild(first)) {
        return this;
      }
      this.directChildEmitter.next(first as HTMLElement);
      return this;
    }

    if (this.dataset.target_selector) {
      const target = this.children
        .item(0)
        ?.querySelector(this.dataset.target_selector);
      if (!this.isValidDirectChild(target)) {
        return this;
      }
      this.directChildEmitter.next(target as HTMLElement);
    }
    return this;
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
    const first = this.directChildEmitter.value;
    first && this.setInputDefault(first, "name", field);
    const type = this.getAttribute("data-type") ?? DatumType.SYNC;
    this.setDatumType(type as DatumType);
  }

  setDataMapper(mapper: (ev: any) => F[N]["value"]): void {
    this.mapper = mapper;
  }

  setFormController(
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
    this.reportMultiChildError();
    this.emitOnlyChildOnMount().setInputDefaultsOnMount();
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
    this.setInputDefaults(target, key, next);
  }

  static get observedAttributes() {
    return ["placeholder", "defaultValue"];
  }
}