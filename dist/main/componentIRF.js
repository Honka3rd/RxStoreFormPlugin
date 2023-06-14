"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const field_1 = require("./field");
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
                const state = datum.get("asyncState");
                state && this.setAttribute("data-async_state", String(state));
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
    binder(current, controller) {
        const unListens = [
            this.attributesBinding(current, controller),
            this.metaBinding(current, controller),
        ];
        return () => unListens.forEach((fn) => fn === null || fn === void 0 ? void 0 : fn());
    }
    makeControl() {
        return (0, rxjs_1.combineLatest)([
            this.formControllerEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
            this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)(() => {
                var _a;
                (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
            }), (0, rxjs_1.pairwise)()),
        ]).subscribe(([controller, [previous, current]]) => {
            this.attachChildEventListeners([previous, current], controller);
            this.stopBinding = this.binder(current, controller);
        });
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
exports.IRFieldComponent = IRFieldComponent;
