import { bound } from "rx-store-core";
import {
  BehaviorSubject,
  Subject,
  Subscription,
  distinctUntilChanged,
  map,
  merge,
  pairwise,
  switchMap,
  tap,
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
  ImmutableFormController,
  K,
  FormControllerInjector,
  V,
} from "./interfaces";
import FormControllerImpl from "./formControlNRS";
import { ImmutableFormControllerImpl } from "./formControlIRS";

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
        a instanceof HTMLElement && a.id === this.dataset.targetId;
      });
      added && this.directChildEmitter.next(added as HTMLElement);
      return;
    }

    if (this.dataset.targetSelector) {
      const target = this.querySelector(this.dataset.targetSelector);
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
    if (!this.dataset.targetSelector && !this.dataset.targetId) {
      const first = this.children.item(0);
      if (!this.isValidDirectChild(first)) {
        return this;
      }

      this.directChildEmitter.next(first);
      return this;
    }

    if (this.dataset.targetId) {
      const first = this.children
        .item(0)
        ?.querySelector(`#${this.dataset.targetId}`);
      if (!this.isValidDirectChild(first)) {
        return this;
      }
      this.directChildEmitter.next(first as HTMLElement);
      return this;
    }

    if (this.dataset.targetSelector) {
      const target = this.children
        .item(0)
        ?.querySelector(this.dataset.targetSelector);
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
    return merge(
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.fieldListEmitter.asObservable(),
      2
    )
      .pipe(
        pairwise(),
        map((paired) => {
          console.log({ paired });
          const controller = paired.find(
            (target) =>
              target instanceof FormControllerImpl ||
              target instanceof ImmutableFormControllerImpl
          ) as FormController<F, M, S> | ImmutableFormController<F, M, S>;

          const fields = paired.find((target) =>
            Array.isArray(target)
          ) as FormFieldComponent<F, M, S>[];
          return [controller, fields] as const;
        })
      )
      .subscribe(([controller, fields]) => {
        console.log([controller, fields]);
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
      debugger
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
    console.log("filled", fields)
    this.fieldListEmitter.next(fields);
  }

  constructor() {
    super();
    this.overwriteEventListener().emitFieldChildrenOnMount();
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
    Array.from(this.formElement.children).forEach(console.log)
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
