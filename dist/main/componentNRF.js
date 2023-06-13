"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const components_1 = require("./components");
class NRFieldComponent extends components_1.FormFieldComponent {
    valuesBinding(target, formController) {
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
                    this.setAttribute("data-asyncState", String(datum.asyncState));
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
    makeControl() {
        return this.formControllerEmitter
            .asObservable()
            .pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.switchMap)((controller) => this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)((firstChild) => {
            this.attachChildEventListeners(firstChild, controller);
            const unListens = [
                this.valuesBinding(firstChild, controller),
                this.metaBinding(firstChild, controller),
            ];
            this.unBind = () => unListens.forEach((fn) => fn === null || fn === void 0 ? void 0 : fn());
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
exports.NRFieldComponent = NRFieldComponent;
