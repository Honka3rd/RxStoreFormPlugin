"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.push(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.push(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormControlComponent = void 0;
const rx_store_core_1 = require("rx-store-core");
const rxjs_1 = require("rxjs");
const field_1 = require("./field");
exports.FormControlComponent = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _setFieldListFromMutationRecords_decorators;
    return _a = class FormControlComponent extends HTMLElement {
            constructor() {
                super(...arguments);
                this.fieldListIncomingEmitter = (__runInitializers(this, _instanceExtraInitializers), new rxjs_1.BehaviorSubject([]));
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.formIncomingEmitter = new rxjs_1.BehaviorSubject(null);
                this.formHandlers = new WeakMap();
                this.fieldsObserver = new MutationObserver(this.setFieldListFromMutationRecords);
            }
            setFieldListFromMutationRecords(mutationList) {
                const filtered = mutationList.filter((mutation) => mutation.type === "childList");
                const addedFields = filtered.reduce((acc, mutation) => {
                    Array.from(mutation.addedNodes)
                        .filter((node) => node instanceof field_1.FormFieldComponent)
                        .forEach((node) => {
                        acc.push(node);
                    });
                    return acc;
                }, []);
                if (addedFields.length) {
                    this.fieldListIncomingEmitter.next(addedFields);
                }
                const insertedForm = filtered
                    .reduce((acc, mutation) => {
                    const nodes = Array.from(mutation.addedNodes);
                    nodes.forEach((node) => {
                        acc.push(node);
                    });
                    return acc;
                }, [])
                    .find((node) => node instanceof HTMLFormElement);
                if (insertedForm) {
                    this.formIncomingEmitter.next(insertedForm);
                }
                const removedForm = filtered
                    .reduce((acc, mutation) => {
                    const nodes = Array.from(mutation.removedNodes);
                    nodes.forEach((node) => {
                        acc.push(node);
                    });
                    return acc;
                }, [])
                    .find((node) => node instanceof HTMLFormElement);
                if (removedForm) {
                    const handlers = this.formHandlers.get(removedForm);
                    if (handlers === null || handlers === void 0 ? void 0 : handlers.submit) {
                        removedForm.removeEventListener("submit", handlers.submit);
                    }
                    if (handlers === null || handlers === void 0 ? void 0 : handlers.reset) {
                        removedForm.removeEventListener("reset", handlers.reset);
                    }
                    this.formIncomingEmitter.next(null);
                }
            }
            controlAll() {
                return (0, rxjs_1.combineLatest)([
                    this.formControllerEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
                    this.fieldListIncomingEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
                    this.formIncomingEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
                ]).subscribe(([controller, fields, form]) => {
                    if (!controller || !fields) {
                        return;
                    }
                    if (form) {
                        form.setAttribute("data-selector", controller.selector());
                        const onSubmit = (e) => {
                            var _a;
                            e.preventDefault();
                            (_a = this.submitCustomHandler) === null || _a === void 0 ? void 0 : _a.call(this, e, controller.toFormData());
                        };
                        const onReset = (e) => {
                            var _a;
                            e.preventDefault();
                            (_a = this.resetCustomHandler) === null || _a === void 0 ? void 0 : _a.call(this, e);
                            controller.resetFormAll();
                        };
                        form.addEventListener("submit", onSubmit);
                        form.addEventListener("reset", onReset);
                        this.formHandlers.set(form, {
                            submit: onSubmit,
                            reset: onReset,
                        });
                    }
                    fields.forEach((node) => node.setFormController(controller));
                });
            }
            getDirectForm() {
                return this.querySelector("form");
            }
            fillFields(fields, all, map) {
                var _a, _b;
                if (all === void 0) { all = (_b = (_a = this.getDirectForm()) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : []; }
                if (map === void 0) { map = new WeakMap(); }
                for (const node of Array.from(all)) {
                    if (node instanceof field_1.FormFieldComponent && !map.has(node)) {
                        fields.push(node);
                    }
                    else {
                        this.fillFields(fields, node.children, map);
                    }
                    map.set(node, node);
                }
            }
            emitFieldChildrenOnMount() {
                if (!this.children.length) {
                    return;
                }
                const form = this.getDirectForm();
                if (!form) {
                    return;
                }
                this.formIncomingEmitter.next(form);
                const fields = [];
                this.fillFields(fields, form.children);
                if (fields.length) {
                    this.fieldListIncomingEmitter.next(fields);
                }
            }
            setFormController(controller) {
                var _a;
                (_a = this.getDirectForm()) === null || _a === void 0 ? void 0 : _a.setAttribute("data-selector", controller.selector());
                this.formControllerEmitter.next(controller);
            }
            setOnReset(reset) {
                this.resetCustomHandler = reset;
            }
            setOnSubmit(submit) {
                this.submitCustomHandler = submit;
            }
            connectedCallback() {
                this.fieldsObserver.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
                this.emitFieldChildrenOnMount();
                this.subscription = this.controlAll();
            }
            disconnectedCallback() {
                var _a;
                this.fieldsObserver.disconnect();
                (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            }
        },
        (() => {
            _setFieldListFromMutationRecords_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setFieldListFromMutationRecords_decorators, { kind: "method", name: "setFieldListFromMutationRecords", static: false, private: false, access: { has: obj => "setFieldListFromMutationRecords" in obj, get: obj => obj.setFieldListFromMutationRecords } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
//# sourceMappingURL=form.js.map