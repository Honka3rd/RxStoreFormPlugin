import { distinctUntilChanged, switchMap, tap } from "rxjs";
import { FormFieldComponent } from "./components";
import {
  FormControlBasicMetadata,
  FormControlData,
  IRFieldAttributeBinderInjector,
  IRFieldMetaBinderInjector,
  ImmutableFormController,
  K,
  V,
} from "./interfaces";
import { Map } from "immutable";
export class IRFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends FormFieldComponent<F, M, S, N>
  implements IRFieldAttributeBinderInjector<F>, IRFieldMetaBinderInjector
{
  private attributeBinder?: (
    attributeSetter: (k: string, v: any) => void,
    attrs: Map<K<F[number]>, V<F[number]>>
  ) => void;

  private metaDataBinder?: (
    attributeSetter: (k: string, v: any) => void,
    meta: Map<"errors" | "info" | "warn", Map<string, any>>
  ) => void;

  private valuesBinding(
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
        const state = datum.get("asyncState");
        state && this.setAttribute("data-asyncState", String(state));
        const value = datum.get("value");
        value && this.setAttribute("data-value", String(value));
        if (this.attributeBinder) {
          this.attributeBinder(
            this.attrSetter(target),
            datum as Map<K<F[number]>, V<F[number]>>
          );
          return;
        }
        if ("value" in target) {
          target.setAttribute("value", String(value));
          return;
        }
        target.setAttribute("data-value", String(value));
      });
    }
  }

  private metaBinding(
    target: Node | null,
    formController: ImmutableFormController<F, M, S> | null
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

  protected makeControl() {
    return this.formControllerEmitter
      .asObservable()
      .pipe(
        distinctUntilChanged(),
        switchMap((controller) =>
          this.directChildEmitter.asObservable().pipe(
            distinctUntilChanged(),
            tap((firstChild) => {
              this.attachChildEventListeners(firstChild, controller);
              const unbindV = this.valuesBinding(
                firstChild,
                controller as ImmutableFormController<F, M, S>
              );
              const unbindM = this.metaBinding(
                firstChild,
                controller as ImmutableFormController<F, M, S>
              );
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

  constructor() {
    super();
    this.subscription = this.makeControl();
  }

  setFormController(
    controller: ImmutableFormController<F, M, S>
  ): void {
    this.formControllerEmitter.next(controller);
  }

  setMetaBinder(
    binder: (
      attributeSetter: (k: string, v: any) => void,
      meta: Map<"errors" | "info" | "warn", Map<string, any>>
    ) => void
  ): void {
    this.metaDataBinder = binder;
  }

  setAttrBinder(
    binder: (
      attributeSetter: (k: string, v: any) => void,
      attrs: Map<K<F[number]>, V<F[number]>>
    ) => void
  ): void {
    this.attributeBinder = binder;
  }
}
