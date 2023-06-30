import {
  Subscription,
  combineLatest,
  distinctUntilChanged,
  filter,
  tap,
} from "rxjs";
import { FormFieldComponent } from "./field";
import {
  DisconnectedCallback,
  FormControlBasicMetadata,
  FormControlData,
  FormControllerInjector,
  IRFieldAttributeBinderInjector,
  ImmutableFormController,
  K,
  V,
} from "./interfaces";
import { Map } from "immutable";
import { ImmutableFormControllerImpl } from "./formControlIRS";
export class IRFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends FormFieldComponent<F, M, S, N>
  implements
    IRFieldAttributeBinderInjector<F>,
    DisconnectedCallback,
    FormControllerInjector<F, M, S>
{
  private subscription: Subscription;
  private attributeBinder?: (
    attributeSetter: (k: string, v: any) => void,
    attrs: Map<K<F[number]>, V<F[number]>>
  ) => void;

  private attributesBinding(
    target: Node | null,
    formController: ImmutableFormController<F, M, S> | null
  ) {
    const { field } = this;
    if (!formController || !field) {
      return;
    }

    if (target instanceof HTMLElement) {
      return formController.observeFormDatum(field, (datum) => {
        this.setAttribute("data-focused", String(datum.get("focused")));
        this.setAttribute("data-changed", String(datum.get("changed")));
        this.setAttribute("data-touched", String(datum.get("touched")));
        this.setAttribute("data-hovered", String(datum.get("hovered")));
        const value = datum.get("value");
        value && this.setAttribute("data-value", String(value));
        if (this.attributeBinder) {
          this.attributeBinder(
            this.attrSetter(target),
            datum as Map<K<F[number]>, V<F[number]>>
          );
        }
      });
    }
  }

  protected makeControl() {
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
          if (!(controller instanceof ImmutableFormControllerImpl)) {
            throw new Error(
              "Invalid controller, require instance of ImmutableFormControllerImpl"
            );
          }
          this.attachChildEventListeners(current, controller);
          this.stopBinding = this.attributesBinding(
            current,
            controller as ImmutableFormController<F, M, S>
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
    binder: (
      attributeSetter: (k: string, v: any) => void,
      attrs: Map<K<F[number]>, V<F[number]>>
    ) => void
  ): void {
    this.attributeBinder = binder;
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription.unsubscribe();
    this.stopBinding?.();
    const removed = this.directChildEmitter.value;
    if (removed) {
      this.removeEventListeners(removed);
    }
  }
}
