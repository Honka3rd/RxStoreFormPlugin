"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const components_1 = require("./components");
class IRFieldComponent extends components_1.FormFieldComponent {
    valuesBinding(target, formController) {
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
                    this.attributeBinder(this.attrSetter(target), datum);
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
    makeControl() {
        return this.formControllerEmitter
            .asObservable()
            .pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.switchMap)((controller) => this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)((firstChild) => {
            this.attachChildEventListeners(firstChild, controller);
            const unbindV = this.valuesBinding(firstChild, controller);
            const unbindM = this.metaBinding(firstChild, controller);
            this.unBind = () => {
                unbindV === null || unbindV === void 0 ? void 0 : unbindV();
                unbindM === null || unbindM === void 0 ? void 0 : unbindM();
            };
        }))))
            .subscribe();
    }
    constructor() {
        super();
        this.subscription = this.makeControl();
    }
    setFormController(controller) {
        this.formControllerEmitter.next(controller);
    }
    setMetaBinder(binder) {
        this.metaDataBinder = binder;
    }
    setAttrBinder(binder) {
        this.attributeBinder = binder;
    }
}
exports.IRFieldComponent = IRFieldComponent;
