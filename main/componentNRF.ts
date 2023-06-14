import { distinctUntilChanged, pairwise, tap } from "rxjs";
import { FormFieldComponent } from "./field";
import FormControllerImpl from "./formControlNRS";
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
    const controller$ = this.formControllerEmitter.pipe(distinctUntilChanged());
    const directChild$ = this.directChildEmitter.asObservable().pipe(
      distinctUntilChanged(),
      tap(() => {
        this.stopBinding?.();
      }),
      pairwise()
    );

    // test
    this.formControllerEmitter.subscribe((controller) => {
      console.log({ controller });
    });
    // ---

    let controller: FormController<F, M, S>;
    let childRecord: [HTMLElement | null, HTMLElement | null];

    const controlSubscription = controller$.subscribe((c) => {
      console.log("controlSubscription", { controller: c, childRecord });
      if (c instanceof FormControllerImpl) {
        controller = c;
        this.stopBinding?.();
        if (!childRecord) {
          return;
        }
        this.attachChildEventListeners(childRecord, c);
        this.stopBinding = this.binder(
          childRecord[1],
          controller as FormController<F, M, S>
        );
      }
    });

    const childSubscription = directChild$.subscribe((record) => {
      this.stopBinding?.();
      childRecord = record;
      console.log("childSubscription", { controller, childRecord });
      if (!controller) {
        return;
      }
      this.attachChildEventListeners(record, controller);
      this.stopBinding = this.binder(
        record[1],
        controller as FormController<F, M, S>
      );
    });
    return () => {
      controlSubscription.unsubscribe();
      childSubscription.unsubscribe();
    };
  }

  constructor() {
    super();
    this.unsubscribe = this.makeControl();
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
