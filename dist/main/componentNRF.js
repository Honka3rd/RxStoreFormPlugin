"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NRFieldComponent = void 0;
const rxjs_1 = require("rxjs");
const field_1 = require("./field");
const formControlNRS_1 = __importDefault(require("./formControlNRS"));
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
                this.setAttribute("data-value", String(datum.value));
                if (this.attributeBinder) {
                    this.attributeBinder(this.attrSetter(target), datum);
                }
            });
        }
    }
    attributeUnbind(current, unbind) {
        if (current) {
            const cached = this.listeners.get(current);
            if (cached && unbind) {
                cached.metaDestruct = unbind;
            }
        }
    }
    isValidFormController(obj) {
        return obj instanceof formControlNRS_1.default;
    }
    reportInvalidController(obj) {
        console.error(obj);
        throw new Error("Invalid controller, require instance of ImmutableFormControllerImpl");
    }
    makeControl() {
        const controller$ = this.formControllerEmitter.pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.filter)(Boolean));
        const directChild$ = this.directChildEmitter
            .asObservable()
            .pipe((0, rxjs_1.distinctUntilChanged)());
        return (0, rxjs_1.combineLatest)([controller$, directChild$])
            .pipe((0, rxjs_1.tap)(([controller, current]) => {
            if (!this.isValidFormController(controller)) {
                return this.reportInvalidController(controller);
            }
            this.attachChildEventListeners(current, controller);
            const unbind = this.attributesBinding(current, controller);
            this.attributeUnbind(current, unbind);
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
        this.onDestroy();
    }
}
exports.NRFieldComponent = NRFieldComponent;
//# sourceMappingURL=componentNRF.js.map