"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const components_1 = require("./components");
class IRFieldComponent extends components_1.FormFieldComponent {
    attributeBinder;
    metaDataBinder;
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
                if (!meta) {
                    return;
                }
                this.metaDataBinder?.(this.attrSetter(target), meta);
            });
        }
    }
    makeControl() {
        return this.formControllerEmitter
            .asObservable()
            .pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.switchMap)((controller) => this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)((firstChild) => {
            this.attachChildEventListeners(firstChild, controller);
            const unListens = [
                this.valuesBinding(firstChild, controller),
                this.metaBinding(firstChild, controller),
            ];
            this.unBind = () => unListens.forEach((fn) => fn?.());
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
