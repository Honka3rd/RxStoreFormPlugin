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
        let controller;
        let childRecord;
        const controlSubscription = controller$.subscribe((c) => {
            var _a;
            console.log("controlSubscription", { controller, childRecord });
            if (c instanceof formControlNRS_1.default) {
                controller = c;
                (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
                if (!childRecord) {
                    return;
                }
                this.attachChildEventListeners(childRecord, c);
                this.stopBinding = this.binder(childRecord[1], controller);
            }
        });
        const childSubscription = directChild$.subscribe((record) => {
            var _a;
            (_a = this.stopBinding) === null || _a === void 0 ? void 0 : _a.call(this);
            childRecord = record;
            console.log("childSubscription", { controller, childRecord });
            if (!controller) {
                return;
            }
            this.attachChildEventListeners(record, controller);
            this.stopBinding = this.binder(record[1], controller);
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
    setMetaBinder(binder) {
        this.metaDataBinder = binder;
    }
    setAttrBinder(binder) {
        this.attributeBinder = binder;
    }
}
exports.NRFieldComponent = NRFieldComponent;
