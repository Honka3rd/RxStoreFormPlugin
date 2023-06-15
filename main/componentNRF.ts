import {
  Subscription,
  combineLatest,
  distinctUntilChanged,
  pairwise,
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
  private subscription: Subscription;
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
        datum.asyncState &&
          this.setAttribute("data-async_state", String(datum.asyncState));
        this.setAttribute("data-value", datum.value);
        if (this.attributeBinder) {
          this.attributeBinder(this.attrSetter(target), datum);
          return;
        }
        try {
          if (target.getAttribute("value") !== datum.value) {
            target.setAttribute("value", datum.value);
          }
        } catch (e) {
          if (target.dataset.value !== datum.value) {
            target.setAttribute("data-value", String(datum.value));
          }
        }
      });
    }
  }

  protected makeControl() {
    const controller$ = this.formControllerEmitter.pipe(distinctUntilChanged());
    const directChild$ = this.directChildEmitter.asObservable().pipe(
      distinctUntilChanged(),
      tap(() => {
        this.stopBinding?.();
      }),
      pairwise()
    );

    return combineLatest([controller$, directChild$] as const)
      .pipe(
        tap(([controller, records]) => {
          if (!(controller instanceof FormControllerImpl)) {
            throw new Error(
              "Invalid controller, require instance of FormControllerImpl"
            );
          }
          this.attachChildEventListeners(records, controller);
          this.stopBinding = this.attributesBinding(
            records[1],
            controller as FormController<F, M, S>
          );
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
    this.observer.disconnect();
    this.subscription.unsubscribe();
  }
}
