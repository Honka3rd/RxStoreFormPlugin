import {
  combineLatest,
  distinctUntilChanged,
  iif,
  of,
  pairwise,
  switchMap,
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
  NRFieldMetaBinderInjector,
} from "./interfaces";

export class NRFieldComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string,
    N extends number = number
  >
  extends FormFieldComponent<F, M, S, N>
  implements
    NRFieldAttributeBinderInjector,
    NRFieldMetaBinderInjector,
    FormControllerInjector<F, M, S>
{
  private attributeBinder?: <D extends FormControlBasicDatum>(
    attributeSetter: (k: string, v: any) => void,
    attrs: D
  ) => void;
  private metaDataBinder?: <M extends FormControlBasicMetadata>(
    attributeSetter: (k: string, v: any) => void,
    meta: M
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

  private binder(
    current: HTMLElement | null,
    controller: FormController<F, M, S>
  ) {
    const unListens = [
      this.attributesBinding(current, controller),
      this.metaBinding(current, controller),
    ];
    return () => unListens.forEach((fn) => fn?.());
  }

  protected makeControl() {
    const controller$ = this.formControllerEmitter;
    // test
    controller$.subscribe((c) => console.log("test control", c))
    // ---
    const directChild$ = this.directChildEmitter.asObservable().pipe(
      distinctUntilChanged(),
      tap(() => {
        this.stopBinding?.();
      }),
      pairwise()
    );
    return controller$
      .pipe(
        switchMap((controller) =>
          iif(
            () => controller !== null,
            directChild$.pipe(
              tap(([previous, current]) => {
                console.log([previous, current], controller);
                this.attachChildEventListeners([previous, current], controller);
                this.stopBinding = this.binder(
                  current,
                  controller as FormController<F, M, S>
                );
              })
            ),
            of(null)
          )
        )
      )
      .subscribe();
  }

  constructor() {
    super();
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
}
