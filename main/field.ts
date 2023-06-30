import { bound } from "rx-store-core";
import { BehaviorSubject } from "rxjs";
import {
  AttributeChangedCallback,
  ConnectedCallback,
  DatumType,
  FieldDataMapperInjector,
  FieldDataset,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormControllerInjector,
  ImmutableFormController,
  K,
  ListenedAttributes,
  ListenerAccessor,
  ListenersCache,
  V,
} from "./interfaces";
import { Any } from "rx-store-types";

export class FormFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends HTMLElement
  implements
    ConnectedCallback,
    FieldDataMapperInjector<F, N>,
    FormControllerInjector<F, M, S>,
    AttributeChangedCallback<HTMLElement, ListenedAttributes>,
    ListenerAccessor<F, M, S>
{
  protected field?: F[N]["field"];
  protected type?: DatumType;
  protected keyboardEventMapper?: (ev: any) => F[N]["value"];
  protected changeEventMapper?: (ev: any) => F[N]["value"];

  protected formControllerEmitter: BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  > = new BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  >(null);
  protected directChildEmitter: BehaviorSubject<HTMLElement | null> =
    new BehaviorSubject<HTMLElement | null>(null);
  protected stopBinding?: () => void;
  protected listeners: WeakMap<Node, ListenersCache> = new WeakMap();

  protected isValidDirectChild(target?: Node | null): target is HTMLElement {
    return target instanceof HTMLElement && target.parentNode === this;
  }

  private getDataset() {
    return this.dataset as FieldDataset<F, N>;
  }

  private reportMultiChildError() {
    if (this.children.length > 1) {
      throw new Error(
        `${this.getDataset().field} has multiple child, only accept one child`
      );
    }
  }

  protected removeEventListeners(removed: Node) {
    const cachedListeners = this.listeners.get(removed);
    if (cachedListeners) {
      removed.removeEventListener("mouseover", cachedListeners.mouseover);
      removed.removeEventListener("mouseleave", cachedListeners.mouseover);
      removed.removeEventListener("focus", cachedListeners.focus);
      removed.removeEventListener("blur", cachedListeners.mouseover);
      removed.removeEventListener("keydown", cachedListeners.mouseover);
      removed.removeEventListener("change", cachedListeners.focus);
    }
  }

  @bound
  protected setDirectChildFromMutations(mutationList: MutationRecord[]) {
    const mutations = mutationList.filter(
      (mutation) => mutation.type === "childList"
    );

    if (this.stopBinding) {
      const removed = mutations
        .map((mutation) => {
          return Array.from(mutation.removedNodes);
        })
        .reduce((nodes, next) => {
          next.forEach((node) => {
            nodes.push(node);
          });
          return nodes;
        }, <Node[]>[])
        .find((node) => node === this.directChildEmitter.value);
      if (removed) {
        this.stopBinding();
        this.directChildEmitter.next(null);
        this.removeEventListeners(removed);
      }
    }

    if (!this.getDataset().target_selector && !this.getDataset().target_id) {
      const first = mutations[0].addedNodes.item(0);
      if (!this.isValidDirectChild(first)) {
        return;
      }
      this.reportMultiChildError();
      this.directChildEmitter.next(first);
      return;
    }

    if (this.getDataset().target_id) {
      const allAdded = mutations.reduce((acc, next) => {
        Array.from(next.addedNodes).forEach((node) => {
          acc.push(node);
        });
        return acc;
      }, [] as Node[]);
      const added = allAdded.find((a) => {
        a instanceof HTMLElement && a.id === this.getDataset().target_id;
      });
      added && this.directChildEmitter.next(added as HTMLElement);
      return;
    }

    const { target_selector } = this.getDataset();
    if (target_selector) {
      const target = this.querySelector(target_selector);
      target && this.directChildEmitter.next(target as HTMLElement);
    }
  }

  protected directChildIsTarget() {
    const { value } = this.directChildEmitter;

    return value && value === this.children.item(0);
  }

  protected observer = new MutationObserver(this.setDirectChildFromMutations);

  private getChangeFunction<E extends HTMLElement>(
    formController:
      | FormController<F, M, S>
      | ImmutableFormController<F, M, S>
      | null,
    field: F[N]["field"],
    current?: E
  ) {
    const { changeEventMapper } = this;
    if (changeEventMapper) {
      return (event: Any) => {
        formController?.changeFormValue(field, changeEventMapper(event));
      };
    }

    if (current instanceof HTMLInputElement) {
      if (current.type === "checkbox" || current.type === "radio") {
        return ({ target }: Any) => {
          formController?.changeFormValue(field, target.checked);
        };
      }

      if (current.type === "file") {
        return ({ target }: Any) => {
          formController?.changeFormValue(field, target.files);
        };
      }
    }

    return ({ target }: Any) => {
      formController?.changeFormValue(field, target.value);
    };
  }

  protected attachChildEventListeners(
    current: Node | null,
    formController:
      | FormController<F, M, S>
      | ImmutableFormController<F, M, S>
      | null
  ) {
    const { field } = this;

    if (!formController || !field) {
      return;
    }

    const { manualBinding } = this.getDataset();

    if (manualBinding === "true") {
      return;
    }

    if (!current) {
      return;
    }

    if (current instanceof HTMLElement) {
      const { change, mouseleave, mouseover, blur, keydown, focus } =
        this.getBindingListeners(formController, field, current);

      current.addEventListener("mouseover", mouseover);

      current.addEventListener("mouseleave", mouseleave);

      current.addEventListener("focus", focus);

      current.addEventListener("blur", blur);

      current.addEventListener("keydown", keydown);

      current.addEventListener("change", change);

      this.listeners.set(current, {
        focus,
        blur,
        mouseleave,
        mouseover,
        keydown,
        change,
      });
    }
  }

  getBindingListeners<E extends HTMLElement>(
    formController: FormController<F, M, S> | ImmutableFormController<F, M, S>,
    field: F[N]["field"],
    current?: E
  ) {
    return {
      mouseover() {
        formController.hoverFormField(field, true);
      },
      mouseleave() {
        formController.hoverFormField(field, false);
      },
      focus() {
        formController.focusFormField(field, true);
      },
      blur() {
        formController
          .focusFormField(field, false)
          .touchFormField(field, true);
      },
      keydown: (event: any) => {
        if (this.keyboardEventMapper) {
          formController.changeFormValue(
            field,
            this.keyboardEventMapper(event)
          );
          return;
        }
        formController.changeFormValue(field, event.target.value);
      },
      change: this.getChangeFunction(formController, field, current),
    };
  }

  private setInputDefault(target: Node, key: string, next: string) {
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.setAttribute(key, next);
    }
  }

  private emitOnlyChildOnMount() {
    const { target_id, target_selector } = this.getDataset();
    if (!target_selector && !target_id) {
      const first = this.children.item(0);
      if (!this.isValidDirectChild(first)) {
        return this;
      }

      this.directChildEmitter.next(first);
      return this;
    }

    if (target_id) {
      const first = this.children.item(0)?.querySelector(`#${target_id}`);
      if (!(first instanceof HTMLElement)) {
        return this;
      }
      this.directChildEmitter.next(first);
      return this;
    }

    if (target_selector) {
      const target = this.children.item(0)?.querySelector(target_selector);
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

  setKeyboardEventMapperMapper(mapper: (ev: any) => F[N]["value"]): void {
    this.keyboardEventMapper = mapper;
  }

  setChangeEventMapperMapper(mapper: (ev: any) => F[N]["value"]) {
    this.changeEventMapper = mapper;
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
    this.emitOnlyChildOnMount();
    this.observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    this.setRequiredProperties();
  }

  attributeChangedCallback(
    key: K<HTMLElement & ListenedAttributes>,
    prev: V<HTMLElement & ListenedAttributes>,
    next: V<HTMLElement & ListenedAttributes>
  ) {
    if (key === "data-target_id" && next) {
      const target = this.querySelector(`#${next}`);
      if (target instanceof HTMLElement) {
        this.directChildEmitter.next(target);
        return;
      }
    }

    if (key === "data-target_selector" && next) {
      const target = this.querySelector(<string>next);
      if (target instanceof HTMLElement) {
        this.directChildEmitter.next(target);
        return;
      }
    }

    if (!next) {
      const first = this.firstElementChild;
      if (first instanceof HTMLElement) {
        this.directChildEmitter.next(first);
        return;
      }
    }

    this.directChildEmitter.next(null);
  }

  static get observedAttributes() {
    return ["data-target_id", "data-target_selector"];
  }
}
