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
                try {
                    if (target.getAttribute("value") !== datum.value) {
                        target.setAttribute("value", datum.value);
                    }
                }
                catch (e) {
                    if (target.dataset.value !== datum.value) {
                        target.setAttribute("data-value", String(datum.value));
                    }
                }
            });
        }
    }
    makeControl() {
        const controller$ = this.formControllerEmitter.pipe((0, rxjs_1.distinctUntilChanged)());
        const directChild$ = this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)(() => {
            var _a;
            (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
        }), (0, rxjs_1.pairwise)());
        return (0, rxjs_1.combineLatest)([controller$, directChild$])
            .pipe((0, rxjs_1.tap)(([controller, records]) => {
            this.attachChildEventListeners(records, controller);
            this.stopBinding = this.attributesBinding(records[1], controller);
        }))
            .subscribe();
    }
    constructor() {
        super();
        this.subscription = this.makeControl();
    }
    setAttrBinder(binder) {
        this.attributeBinder = binder;
    }
    disconnectedCallback() {
        var _a;
        if ((_a = this.container) === null || _a === void 0 ? void 0 : _a.contains(this)) {
            this.observer.disconnect();
            this.subscription.unsubscribe();
        }
    }
}
exports.NRFieldComponent = NRFieldComponent;
