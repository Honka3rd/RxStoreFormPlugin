import {
  BehaviorSubject,
  Subject,
  Subscription,
  distinctUntilChanged,
  switchMap,
  tap,
} from "rxjs";
import {
  ConnectedCallback,
  DatumType,
  DisconnectedCallback,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  InstallDefinition,
  NRFieldDataMapperInjector,
  NRFormControllerInjector,
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
    NRFormControllerInjector<F, M, S>,
    ConnectedCallback,
    DisconnectedCallback,
    NRFieldDataMapperInjector<F, N>
{
  private field?: F[N]["field"];
  private type?: DatumType;
  private mapper?: (ev: any) => F[N]["value"];

  private formControllerEmitter: Subject<FormController<F, M, S> | null> =
    new BehaviorSubject<FormController<F, M, S> | null>(null);
  private directChildEmitter: Subject<HTMLElement | null> =
    new BehaviorSubject<HTMLElement | null>(null);
  private subscription: Subscription;

  @bound
  private setDirectChildFromMutations(mutationList: MutationRecord[]) {
    const first = mutationList
      .filter((mutation) => mutation.type === "childList")[0]
      .addedNodes.item(0);
    if (!(first instanceof HTMLElement)) {
      return;
    }

    this.directChildEmitter.next(first);
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
    firstChild: Node | null,
    formController: FormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }
    if (firstChild instanceof HTMLElement) {
      firstChild.addEventListener("mouseover", () =>
        this.setHovered(true, formController, field)
      );

      firstChild.addEventListener("mouseleave", () =>
        this.setHovered(false, formController, field)
      );

      firstChild.addEventListener("focus", () =>
        this.setFocused(true, formController, field)
      );

      firstChild.addEventListener("blur", () =>
        this.setFocused(false, formController, field)
      );

      firstChild.addEventListener("mousedown", () =>
        this.setTouched(true, formController, field)
      );

      firstChild.addEventListener("change", (event: any) => {
        if (this.mapper) {
          this.setValue(this.mapper(event), formController, field);
          return;
        }
        this.setValue(event.target.value, formController, field);
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
            })
          )
        )
      )
      .subscribe();
  }

  constructor() {
    super();
    this.setField(this.getAttribute("field") as F[N]["field"]);
    const type = this.getAttribute("type") ?? DatumType.SYNC;
    this.setDatumType(type as DatumType);
    this.subscription = this.makeControl();
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
