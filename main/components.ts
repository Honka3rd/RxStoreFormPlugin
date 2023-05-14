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

class NRFormFieldComponent<
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

  private getTargetIfAny(found: HTMLElement | null) {
    const targetSelector = this.getAttribute("targetSelector");
    return targetSelector ? found?.querySelector(targetSelector) : found;
  }

  private directChild: HTMLElement | null = null;

  @bound
  private setDirectChildFromMutations(mutationList: MutationRecord[]) {
    const mutations = mutationList.filter(
      (mutation) => mutation.type === "childList"
    )[0];
    const first = mutations.addedNodes.item(0);
    if (!(first instanceof HTMLElement)) {
      return;
    }
    const removed = mutations.removedNodes.item(0);
    if (removed && this.directChild && removed === this.directChild) {
      this.unBind?.();
    }

    this.directChild = first;
    const target = this.getTargetIfAny(first);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    this.directChildEmitter.next(target);
  }

  private directChildIsTarget() {
    if (!this.directChildEmitter?.value || !this.directChild) {
      return false;
    }

    return this.directChildEmitter?.value === this.directChild;
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
    return (k: string, v: any) => this.setAttribute(k, v);
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
        const target = this.getTargetIfAny(this.directChild);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (this.attributeBinder) {
          this.attributeBinder(this.attrSetter(target), datum);
          return;
        }
        if ("value" in target) {
          target.setAttribute("value", datum.value);
        }
      });
    }
  }

  private metaBinding(
    target: Node | null,
    formController: FormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    if (target instanceof HTMLElement) {
      return formController.observeMetaByField(field, (meta) => {
        const target = this.getTargetIfAny(this.directChild);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (this.metaDataBinder && meta) {
          this.metaDataBinder(this.attrSetter(target), meta);
        }
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
    this.setField(this.getAttribute("field") as F[N]["field"]);
    const type = this.getAttribute("type") ?? DatumType.SYNC;
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
      subtree: false,
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
    if (key === "placeholder") {
      const target = this.getTargetIfAny(this.directChildEmitter?.value);
      if (!target) {
        return;
      }

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
      const target = this.getTargetIfAny(this.directChildEmitter?.value);
      if (!target) {
        return;
      }
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

  static observedAttributes() {
    return ["placeholder", "defaultValue"];
  }
}

class NRFormComponent<
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
    this.formControllerEmitter.next(controller);
  }
}

export const installNRFComponents = ({
  FormSelector,
  FieldSelector,
}: InstallDefinition) => {
  customElements.define(
    FormSelector ?? "rx-field-component",
    NRFormFieldComponent
  );
  customElements.define(FieldSelector ?? "rx-form-component", NRFormComponent);
};
