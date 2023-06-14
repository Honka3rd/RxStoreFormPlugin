"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const field_1 = require("./field");
class NRFieldComponent extends field_1.FormFieldComponent {
    attributesBinding(target, formController) {
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
    metaBinding(target, formController) {
        const { field } = this;
        if (!formController || !field || !this.metaDataBinder) {
            return;
        }
        if (target instanceof HTMLElement) {
            return formController.observeMetaByField(field, (meta) => {
                var _a;
                if (!meta) {
                    return;
                }
                (_a = this.metaDataBinder) === null || _a === void 0 ? void 0 : _a.call(this, this.attrSetter(target), meta);
            });
        }
    }
    binder(current, controller) {
        const unListens = [
            this.attributesBinding(current, controller),
            this.metaBinding(current, controller),
        ];
        return () => unListens.forEach((fn) => fn === null || fn === void 0 ? void 0 : fn());
    }
    makeControl() {
        const controller$ = this.formControllerEmitter.pipe((0, rxjs_1.distinctUntilChanged)());
        const directChild$ = this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)(() => {
            var _a;
            (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
        }), (0, rxjs_1.pairwise)());
        return (0, rxjs_1.merge)([controller$, directChild$]).subscribe(console.log);
        /*  return controller$
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
          .subscribe(); */
    }
    constructor() {
        super();
        this.subscription = this.makeControl();
    }
    setMetaBinder(binder) {
        this.metaDataBinder = binder;
    }
    setAttrBinder(binder) {
        this.attributeBinder = binder;
    }
}
exports.NRFieldComponent = NRFieldComponent;
