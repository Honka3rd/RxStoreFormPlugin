"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const field_1 = require("./field");
const formControlIRS_1 = require("./formControlIRS");
class IRFieldComponent extends field_1.FormFieldComponent {
    attributesBinding(target, formController) {
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
                    this.attributeBinder(this.attrSetter(target), datum);
                }
            });
        }
    }
    makeControl() {
        const controller$ = this.formControllerEmitter.pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.filter)(Boolean));
        const directChild$ = this.directChildEmitter
            .asObservable()
            .pipe((0, rxjs_1.distinctUntilChanged)());
        return (0, rxjs_1.combineLatest)([controller$, directChild$])
            .pipe((0, rxjs_1.tap)(([controller, current]) => {
            if (!(controller instanceof formControlIRS_1.ImmutableFormControllerImpl)) {
                throw new Error("Invalid controller, require instance of ImmutableFormControllerImpl");
            }
            this.attachChildEventListeners(current, controller);
            this.stopBinding = this.attributesBinding(current, controller);
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
        this.observer.disconnect();
        this.subscription.unsubscribe();
        (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
        const removed = this.directChildEmitter.value;
        if (removed) {
            this.removeEventListeners(removed);
        }
    }
}
exports.IRFieldComponent = IRFieldComponent;
//# sourceMappingURL=componentIRF.js.map