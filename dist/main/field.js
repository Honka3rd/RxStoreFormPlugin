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
exports.FormFieldComponent = void 0;
const rx_store_core_1 = require("rx-store-core");
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
exports.FormFieldComponent = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _attrSetter_decorators;
    return _a = class FormFieldComponent extends HTMLElement {
            constructor() {
                super(...arguments);
                this.field = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                this.observer = new MutationObserver(this.setDirectChildFromMutations);
            }
            isValidDirectChild(target) {
                return target instanceof HTMLElement && target.parentNode === this;
            }
            reportMultiChildError() {
                if (this.children.length > 1) {
                    throw new Error(`${this.dataset.field} has multiple child, only accept one child`);
                }
            }
            setDirectChildFromMutations(mutationList) {
                const mutations = mutationList.filter((mutation) => mutation.type === "childList");
                if (!this.dataset.targetSelector && !this.dataset.targetId) {
                    const first = mutations[0].addedNodes.item(0);
                    if (!this.isValidDirectChild(first)) {
                        return;
                    }
                    this.reportMultiChildError();
                    this.directChildEmitter.next(first);
                    return;
                }
                if (this.dataset.targetId) {
                    const allAdded = mutations.reduce((acc, next) => {
                        Array.from(next.addedNodes).forEach((node) => {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    this.reportMultiChildError();
                    const added = allAdded.find((a) => {
                        a instanceof HTMLElement && a.id === this.dataset.target_id;
                    });
                    added && this.directChildEmitter.next(added);
                    return;
                }
                if (this.dataset.target_selector) {
                    const target = this.querySelector(this.dataset.target_selector);
                    this.reportMultiChildError();
                    target && this.directChildEmitter.next(target);
                }
            }
            directChildIsTarget() {
                const { value } = this.directChildEmitter;
                return value && value === this.children.item(0);
            }
            attachChildEventListeners(target, formController) {
                const { field } = this;
                if (!formController || !field) {
                    return;
                }
                const [previous, current] = target;
                if (!previous && !current) {
                    return;
                }
                function mouseover() {
                    formController === null || formController === void 0 ? void 0 : formController.hoverFormField(field, true);
                }
                ;
                function mouseleave() {
                    formController === null || formController === void 0 ? void 0 : formController.hoverFormField(field, false);
                }
                ;
                function focus() {
                    formController === null || formController === void 0 ? void 0 : formController.focusFormField(field, true);
                }
                ;
                function blur() {
                    formController === null || formController === void 0 ? void 0 : formController.focusFormField(field, false).touchFormField(field, true);
                }
                ;
                const context = this;
                function change(event) {
                    if (context.mapper) {
                        formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, context.mapper(event));
                        return;
                    }
                    formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, event.target.value);
                }
                ;
                if (current instanceof HTMLElement) {
                    current.addEventListener("mouseover", mouseover);
                    current.addEventListener("mouseleave", mouseleave);
                    current.addEventListener("focus", focus);
                    current.addEventListener("blur", blur);
                    current.addEventListener("keydown", change);
                }
                if (previous instanceof HTMLElement) {
                    previous.removeEventListener("mouseover", mouseover);
                    previous.removeEventListener("mouseleave", mouseleave);
                    previous.removeEventListener("focus", focus);
                    previous.removeEventListener("blur", blur);
                    previous.removeEventListener("keydown", change);
                }
            }
            setInputDefault(target, key, next) {
                if (target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement) {
                    target.setAttribute(key, next);
                }
            }
            setInputDefaultsOnMount() {
                const first = this.directChildEmitter.value;
                if (!first) {
                    return;
                }
                const placeholder = this.getAttribute("placeholder");
                placeholder && this.setInputDefault(first, "placeholder", placeholder);
                const defaultValue = this.getAttribute("defaultValue");
                defaultValue && this.setInputDefault(first, "defaultValue", defaultValue);
            }
            emitOnlyChildOnMount() {
                var _a, _b;
                if (!this.dataset.target_selector && !this.dataset.target_id) {
                    const first = this.children.item(0);
                    if (!this.isValidDirectChild(first)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (this.dataset.target_id) {
                    const first = (_a = this.children
                        .item(0)) === null || _a === void 0 ? void 0 : _a.querySelector(`#${this.dataset.target_id}`);
                    if (!(first instanceof HTMLElement)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (this.dataset.target_selector) {
                    const target = (_b = this.children
                        .item(0)) === null || _b === void 0 ? void 0 : _b.querySelector(this.dataset.target_selector);
                    if (!(target instanceof HTMLElement)) {
                        return this;
                    }
                    this.directChildEmitter.next(target);
                }
                return this;
            }
            attrSetter(target) {
                return (k, v) => target.setAttribute(k, v);
            }
            setField(field) {
                if (this.field) {
                    return;
                }
                this.field = field;
            }
            setDatumType(type) {
                if (this.type) {
                    return;
                }
                this.type = type;
            }
            setRequiredProperties() {
                var _a;
                const field = this.getAttribute("data-field");
                if (!field || !field.length) {
                    throw new Error("Form field is not set");
                }
                this.setField(field);
                const first = this.directChildEmitter.value;
                first && this.setInputDefault(first, "name", field);
                const type = (_a = this.getAttribute("data-type")) !== null && _a !== void 0 ? _a : interfaces_1.DatumType.SYNC;
                this.setDatumType(type);
            }
            setDataMapper(mapper) {
                this.mapper = mapper;
            }
            setFormController(controller) {
                this.formControllerEmitter.next(controller);
            }
            getField() {
                return this.field;
            }
            getDatumType() {
                return this.type;
            }
            connectedCallback() {
                console.log("connected", this.field);
                this.reportMultiChildError();
                this.emitOnlyChildOnMount().setInputDefaultsOnMount();
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
                this.setRequiredProperties();
            }
        },
        (() => {
            _attrSetter_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _attrSetter_decorators, { kind: "method", name: "attrSetter", static: false, private: false, access: { has: obj => "attrSetter" in obj, get: obj => obj.attrSetter } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
