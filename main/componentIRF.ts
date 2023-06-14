import {
  combineLatest,
  distinctUntilChanged,
  pairwise,
  switchMap,
  tap,
} from "rxjs";
import { FormFieldComponent } from "./field";
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
        const state = datum.get("asyncState");
        state && this.setAttribute("data-async_state", String(state));
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

  private binder(
    current: HTMLElement | null,
    controller: ImmutableFormController<F, M, S>
  ) {
    const unListens = [
      this.attributesBinding(current, controller),
      this.metaBinding(current, controller),
    ];
    return () => unListens.forEach((fn) => fn?.());
  }

  protected makeControl() {
    return combineLatest([
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.directChildEmitter.asObservable().pipe(
        distinctUntilChanged(),
        tap(() => {
          this.stopBinding?.();
        }),
        pairwise()
      ),
    ] as const).subscribe(([controller, [previous, current]]) => {
      this.attachChildEventListeners([previous, current], controller);
      this.stopBinding = this.binder(
        current,
        controller as ImmutableFormController<F, M, S>
      );
    });
  }

  constructor() {
    super();
    this.subscription = this.makeControl();
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
