import { bound } from "rx-store-core";
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  distinctUntilChanged,
} from "rxjs";
import { FormFieldComponent } from "./field";
import {
  ConnectedCallback,
  DisconnectedCallback,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormControllerInjector,
  ImmutableFormController,
  V,
} from "./interfaces";

export class FormControlComponent<
    F extends FormControlData,
    M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
    S extends string = string
  >
  extends HTMLElement
  implements
    ConnectedCallback,
    DisconnectedCallback,
    FormControllerInjector<F, M, S>
{
  private fieldListEmitter: Subject<FormFieldComponent<F, M, S>[]> =
    new BehaviorSubject<FormFieldComponent<F, M, S>[]>([]);
  private formControllerEmitter: BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  > = new BehaviorSubject<
    FormController<F, M, S> | ImmutableFormController<F, M, S> | null
  >(null);

  private subscription?: Subscription;

  @bound
  private setFieldListFromMutationRecords(mutationList: MutationRecord[]) {
    const nodes: FormFieldComponent<F, M, S>[] = [];
    mutationList
      .filter((mutation) => mutation.type === "childList")
      .forEach((mutation) =>
        Array.from(mutation.addedNodes).forEach((node) => {
          if (node instanceof FormFieldComponent) {
            nodes.push(node);
            return;
          }

          if (node instanceof HTMLFormElement) {
            const id = this.formControllerEmitter.value?.selector();
            if (!id) {
              return;
            }
            this.fillFields(nodes, node.children)
            node.setAttribute("data-selector", id);
          }
        })
      );
    this.fieldListEmitter.next(nodes);
  }

  private observer = new MutationObserver(this.setFieldListFromMutationRecords);

  private controlAll() {
    return combineLatest([
      this.formControllerEmitter.asObservable().pipe(distinctUntilChanged()),
      this.fieldListEmitter.asObservable().pipe(distinctUntilChanged()),
    ] as const).subscribe(([controller, fields]) => {
      if (!controller || !fields) {
        return;
      }
      fields.forEach((node) => node.setFormController(controller));
    });
  }

  private getDirectForm() {
    const formElement = this.children.item(0);
    if (!(formElement instanceof HTMLFormElement)) {
      return null;
    }
    return formElement;
  }

  private fillFields(
    fields: FormFieldComponent<F, M, S, number>[],
    all = this.getDirectForm()?.children ?? []
  ) {
    for (const node of Array.from(all)) {
      if (node instanceof FormFieldComponent) {
        fields.push(node);
      } else {
        this.fillFields(fields, node.children);
      }
    }
  }

  private emitFieldChildrenOnMount() {
    if(!this.children.length) {
      return;
    }
    const fields: FormFieldComponent<F, M, S, number>[] = [];
    this.fillFields(fields);
    this.fieldListEmitter.next(fields);
  }

  setFormController(controller: FormController<F, M, S>): void {
    this.getDirectForm()?.setAttribute("data-selector", controller.selector());
    this.formControllerEmitter.next(controller);
  }

  connectedCallback(): void {
    this.observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: false,
    });
    this.emitFieldChildrenOnMount();
    this.subscription = this.controlAll();
  }

  disconnectedCallback(): void {
    this.observer.disconnect();
    this.subscription?.unsubscribe();
  }
}
