import {
  combineLatest,
  distinctUntilChanged,
  filter,
  tap,
} from "rxjs";
import { FormFieldComponent } from "./field";
import {
  FormControlBasicDatum,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormControllerInjector,
  NRFieldAttributeBinderInjector,
  DisconnectedCallback,
} from "./interfaces";
import FormControllerImpl from "./formControlNRS";

export class NRFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends FormFieldComponent<F, M, S, N>
  implements
    NRFieldAttributeBinderInjector,
    FormControllerInjector<F, M, S>,
    DisconnectedCallback
{
  private attributeBinder?: <D extends FormControlBasicDatum>(
    attributeSetter: (k: string, v: any) => void,
    attrs: D
  ) => void;

  private attributesBinding(
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
        this.setAttribute("data-value", String(datum.value));
        if (this.attributeBinder) {
          this.attributeBinder(this.attrSetter(target), datum);
        }
      });
    }
  }

  private metaAttributesBind(current: HTMLElement | null, controller: unknown) {
    if (current) {
      const cached = this.listeners.get(current);
      if (cached) {
        cached.metaDestruct = this.attributesBinding(
          current,
          controller as FormController<F, M, S>
        );
      }
    }
  }

  private makeControl() {
    const controller$ = this.formControllerEmitter.pipe(
      distinctUntilChanged(),
      filter(Boolean)
    );
    const directChild$ = this.directChildEmitter
      .asObservable()
      .pipe(distinctUntilChanged());

    return combineLatest([controller$, directChild$] as const)
      .pipe(
        tap(([controller, current]) => {
          if (!(controller instanceof FormControllerImpl)) {
            throw new Error(
              "Invalid controller, require instance of FormControllerImpl"
            );
          }
          this.attachChildEventListeners(current, controller);
          this.metaAttributesBind(current, controller);
        })
      )
      .subscribe();
  }

  constructor() {
    super();
    this.subscription = this.makeControl();
  }

  setAttrBinder(
    binder: <D extends FormControlBasicDatum>(
      attributeSetter: (k: string, v: any) => void,
      attrs: D
    ) => void
  ): void {
    this.attributeBinder = binder;
  }

  disconnectedCallback(): void {
    this.onDestroy();
  }
}
