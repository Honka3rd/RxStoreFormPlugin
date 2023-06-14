import { bound } from "rx-store-core";
import { BehaviorSubject } from "rxjs";
import {
  AttributeChangedCallback,
  ConnectedCallback,
  CustomerAttrs,
  DatumType,
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
  protected stopBinding?: () => void;

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
    target: [Node | null, Node | null],
    formController:
      | FormController<F, M, S>
      | ImmutableFormController<F, M, S>
      | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    const [previous, current] = target;
    if (!previous && !current) {
      return;
    }

    const mouseover = () => {
      formController.hoverFormField(field, true);
    };

    const mouseleave = () => {
      formController.hoverFormField(field, false);
    };

    const focus = () => {
      formController.focusFormField(field, true);
    };

    const blur = () => {
      formController.focusFormField(field, false).touchFormField(field, true);
    };

    const change = (event: any) => {
      if (this.mapper) {
        formController.changeFormValue(field, this.mapper(event));
        return;
      }
      console.log(event);
      formController.changeFormValue(field, event.target.value);
    };

    if (current instanceof HTMLElement) {
      current.addEventListener("mouseover", mouseover);

      current.addEventListener("mouseleave", mouseleave);

      current.addEventListener("focus", focus);

      current.addEventListener("blur", blur);

      current.addEventListener("change", change);
    }

    if (previous instanceof HTMLElement) {
      previous.removeEventListener("mouseover", mouseover);

      previous.removeEventListener("mouseleave", mouseleave);

      previous.removeEventListener("focus", focus);

      previous.removeEventListener("blur", blur);

      previous.removeEventListener("change", change);
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
      if (!(first instanceof HTMLElement)) {
        return this;
      }
      this.directChildEmitter.next(first);
      return this;
    }

    if (this.dataset.target_selector) {
      const target = this.children
        .item(0)
        ?.querySelector(this.dataset.target_selector);
      if (!(target instanceof HTMLElement)) {
        return this;
      }
      this.directChildEmitter.next(target);
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
