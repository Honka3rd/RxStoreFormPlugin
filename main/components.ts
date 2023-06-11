import {
  BehaviorSubject,
  Subject,
  Subscription,
  distinctUntilChanged,
  switchMap,
  tap,
} from "rxjs";
import {
  AttributeChangedCallback,
  ConnectedCallback,
  CustomerAttrs,
  DatumType,
  DisconnectedCallback,
  FormControlBasicDatum,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  InstallDefinition,
  K,
  NRFieldAttributeBinderInjector,
  NRFieldDataMapperInjector,
  NRFieldMetaBinderInjector,
  NRFormControllerInjector,
  V,
} from "./interfaces";
import { bound } from "rx-store-core";

export class NRFormFieldComponent<
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
    NRFieldDataMapperInjector<F, N>,
    NRFormControllerInjector<F, M, S>,
    NRFieldAttributeBinderInjector,
    NRFieldMetaBinderInjector
{
  private field?: F[N]["field"];
  private type?: DatumType;
  private mapper?: (ev: any) => F[N]["value"];
  private attributeBinder?: <D extends FormControlBasicDatum>(
    attributeSetter: (k: string, v: any) => void,
    attrs: D
  ) => void;
  private metaDataBinder?: <M extends FormControlBasicMetadata>(
    attributeSetter: (k: string, v: any) => void,
    meta: M
  ) => void;

  private formControllerEmitter: BehaviorSubject<FormController<
    F,
    M,
    S
  > | null> = new BehaviorSubject<FormController<F, M, S> | null>(null);
  private directChildEmitter: BehaviorSubject<HTMLElement | null> =
    new BehaviorSubject<HTMLElement | null>(null);
  private subscription: Subscription;
  private unBind?: () => void;

  private isValidDirectChild(target?: Node | null): target is HTMLElement {
    return target instanceof HTMLElement && target.parentNode === this;
  }

  private setDirectChildFromMutations(mutationList: MutationRecord[]) {
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

  private directChildIsTarget() {
    if (!this.directChildEmitter?.value && !this.children.item(0)) {
      return false;
    }

    return this.directChildEmitter.value === this.children.item(0);
  }

  private observer = new MutationObserver(this.setDirectChildFromMutations);

  private setValue(
    value: F[N]["value"],
    formController: FormController<F, M, S>,
    field: F[N]["field"]
  ) {
    formController.changeFormValue(field, value);
  }

  private setTouched(
    value: boolean,
    formController: FormController<F, M, S>,
    field: F[N]["field"]
  ) {
    formController.touchFormField(field, value);
  }

  private setFocused(
    value: boolean,
    formController: FormController<F, M, S>,
    field: F[N]["field"]
  ) {
    formController.focusFormField(field, value);
  }

  private setHovered(
    value: boolean,
    formController: FormController<F, M, S>,
    field: F[N]["field"]
  ) {
    formController.hoverFormField(field, value);
  }

  private attachChildEventListeners(
    target: Node | null,
    formController: FormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    if (target instanceof HTMLElement) {
      target.addEventListener("mouseover", () =>
        this.setHovered(true, formController, field)
      );

      target.addEventListener("mouseleave", () =>
        this.setHovered(false, formController, field)
      );

      target.addEventListener("focus", () =>
        this.setFocused(true, formController, field)
      );

      target.addEventListener("blur", () => {
        this.setFocused(false, formController, field);
        this.setTouched(true, formController, field);
      });

      target.addEventListener("change", (event: any) => {
        if (this.mapper) {
          this.setValue(this.mapper(event), formController, field);
          return;
        }
        this.setValue(event.target.value, formController, field);
      });
    }
  }

  @bound
  private attrSetter(target: HTMLElement) {
    return (k: string, v: any) => target.setAttribute(k, v);
  }

  private valuesBinding(
    target: Node | null,
    formController: FormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    if (target instanceof HTMLElement) {
      return formController.observeFormDatum(field, (datum) => {
        this.setAttribute("data-focused", String(datum.focused));
        this.setAttribute("data-changed", String(datum.changed));
        this.setAttribute("data-touched", String(datum.touched));
        this.setAttribute("data-hovered", String(datum.hovered));
        datum.asyncState &&
          this.setAttribute("data-asyncState", String(datum.asyncState));
        this.setAttribute("data-value", datum.value);
        if (this.attributeBinder) {
          this.attributeBinder(this.attrSetter(target), datum);
          return;
        }
        if ("value" in target) {
          target.setAttribute("value", datum.value);
          return;
        }
        target.setAttribute("data-value", String(datum.value));
      });
    }
  }

  private metaBinding(
    target: Node | null,
    formController: FormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field || !this.metaDataBinder) {
      return;
    }

    if (target instanceof HTMLElement) {
      return formController.observeMetaByField(field, (meta) => {
        if (!meta) {
          return;
        }
        this.metaDataBinder?.(this.attrSetter(target), meta);
      });
    }
  }

  private setField(field: F[N]["field"]): void {
    if (this.field) {
      return;
    }
    this.field = field;
  }

  private setDatumType(type: DatumType): void {
    if (this.type) {
      return;
    }
    this.type = type;
  }

  private makeControl() {
    return this.formControllerEmitter
      .asObservable()
      .pipe(
        switchMap((controller) =>
          this.directChildEmitter.asObservable().pipe(
            distinctUntilChanged(),
            tap((firstChild) => {
              this.attachChildEventListeners(firstChild, controller);
              const unbindV = this.valuesBinding(firstChild, controller);
              const unbindM = this.metaBinding(firstChild, controller);
              this.unBind = () => {
                unbindV?.();
                unbindM?.();
              };
            })
          )
        )
      )
      .subscribe();
  }

  private setRequiredProperties() {
    const field = this.getAttribute("data-field") as F[N]["field"];
    if (!field || !field.length) {
      throw new Error("Form field is not set");
    }
    this.setField(field);
    const type = this.getAttribute("data-type") ?? DatumType.SYNC;
    this.setDatumType(type as DatumType);
  }

  constructor() {
    super();
    this.setRequiredProperties();
    this.subscription = this.makeControl();
  }

  setMetaBinder(
    binder: <M extends FormControlBasicMetadata>(
      attributeSetter: (k: string, v: any) => void,
      meta: M
    ) => void
  ): void {
    this.metaDataBinder = binder;
  }

  setAttrBinder(
    binder: <D extends FormControlBasicDatum>(
      attributeSetter: (k: string, v: any) => void,
      attrs: D
    ) => void
  ): void {
    this.attributeBinder = binder;
  }

  setDataMapper(mapper: (ev: any) => F[N]["value"]): void {
    this.mapper = mapper;
  }

  setNRFormController(controller: FormController<F, M, S>): void {
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
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription.unsubscribe();
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

export class NRFormComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string
  >
  extends HTMLFormElement
  implements
    ConnectedCallback,
    DisconnectedCallback,
    NRFormControllerInjector<F, M, S>
{
  private fieldListEmitter: Subject<NRFormFieldComponent<F, M, S>[]> =
    new BehaviorSubject<NRFormFieldComponent<F, M, S>[]>([]);
  private formControllerEmitter: Subject<FormController<F, M, S> | null> =
    new BehaviorSubject<FormController<F, M, S> | null>(null);

  private subscription: Subscription;

  @bound
  private setFieldListFromMutationRecords(mutationList: MutationRecord[]) {
    const nodes: NRFormFieldComponent<F, M, S>[] = [];
    mutationList
      .filter((mutation) => mutation.type === "childList")
      .forEach((mutation) =>
        Array.from(mutation.addedNodes).forEach((node) => {
          if (!(node instanceof NRFormFieldComponent)) {
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

  constructor() {
    super();
    this.subscription = this.controlAll();
  }

  connectedCallback(): void {
    this.observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: false,
    });
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription.unsubscribe();
  }

  setNRFormController(controller: FormController<F, M, S>): void {
    this.setAttribute("data-selector", controller.selector());
    this.formControllerEmitter.next(controller);
  }
}

export const installNRFComponents = ({
  formSelector,
  fieldSelector,
}: InstallDefinition = {}) => {
  const fieldId = fieldSelector ? fieldSelector : "rx-field-component";
  const formId = formSelector ? formSelector : "rx-form-component";
  if (!window.customElements.get(fieldId)) {
    window.customElements.define(fieldId, NRFormFieldComponent);
  }
  if (!window.customElements.get(formId)) {
    window.customElements.define(formId, NRFormComponent);
  }
};
