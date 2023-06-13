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
    let _drillDownChild_decorators;
    let _setFieldListFromMutationRecords_decorators;
    return _a = class FormControlComponent extends HTMLElement {
            drillDownChild(node) {
                this.formElement.appendChild(this.removeChild(node));
            }
            setFieldListFromMutationRecords(mutationList) {
                const nodes = [];
                mutationList
                    .filter((mutation) => mutation.type === "childList")
                    .forEach((mutation) => Array.from(mutation.addedNodes).forEach((node) => {
                    this.drillDownChild(node);
                    if (!(node instanceof field_1.FormFieldComponent)) {
                        return;
                    }
                    nodes.push(node);
                }));
                this.fieldListEmitter.next(nodes);
            }
            controlAll() {
                return (0, rxjs_1.combineLatest)([
                    this.formControllerEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
                    this.fieldListEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()),
                ]).subscribe(([controller, fields]) => {
                    if (!controller || !fields) {
                        return;
                    }
                    fields.forEach((node) => node.setFormController(controller));
                });
            }
            handleFirstRenderInForm() {
                Array.from(this.children).forEach(this.drillDownChild);
                this.appendChild(this.formElement);
            }
            applyParentAttrs() {
                const attributes = this.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attribute = attributes[i];
                    this.removeAttribute(attribute.name);
                    this.formElement.setAttribute(attribute.name, attribute.value);
                }
            }
            overwriteEventListener() {
                this.addEventListener = (type, listener, options) => {
                    this.formElement.addEventListener(type, listener, options);
                };
                this.removeEventListener = (type, listener, options) => {
                    this.formElement.removeEventListener(type, listener, options);
                };
                return this;
            }
            fillFields(fields, all = this.formElement.children) {
                for (const node of Array.from(all)) {
                    if (node instanceof field_1.FormFieldComponent) {
                        fields.push(node);
                    }
                    else {
                        this.fillFields(fields, node.children);
                    }
                }
            }
            emitFieldChildrenOnMount() {
                const fields = [];
                this.fillFields(fields);
                console.log("filled", fields);
                this.fieldListEmitter.next(fields);
            }
            constructor() {
                super();
                this.fieldListEmitter = (__runInitializers(this, _instanceExtraInitializers), new rxjs_1.BehaviorSubject([]));
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.formElement = document.createElement("form");
                this.observer = new MutationObserver(this.setFieldListFromMutationRecords);
                this.overwriteEventListener();
            }
            setFormController(controller) {
                this.formElement.setAttribute("data-selector", controller.selector());
                this.formControllerEmitter.next(controller);
            }
            connectedCallback() {
                this.handleFirstRenderInForm();
                this.applyParentAttrs();
                this.observer.observe(this.formElement, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
                this.emitFieldChildrenOnMount();
                this.subscription = this.controlAll();
            }
            disconnectedCallback() {
                var _a;
                this.observer.disconnect();
                (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            }
            attributeChangedCallback(key, prev, next) {
                if (typeof next === "string") {
                    return this.formElement.setAttribute(key, next);
                }
            }
        },
        (() => {
            _drillDownChild_decorators = [rx_store_core_1.bound];
            _setFieldListFromMutationRecords_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _drillDownChild_decorators, { kind: "method", name: "drillDownChild", static: false, private: false, access: { has: obj => "drillDownChild" in obj, get: obj => obj.drillDownChild } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setFieldListFromMutationRecords_decorators, { kind: "method", name: "setFieldListFromMutationRecords", static: false, private: false, access: { has: obj => "setFieldListFromMutationRecords" in obj, get: obj => obj.setFieldListFromMutationRecords } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
