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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormControlComponent = exports.FormFieldComponent = void 0;
const rx_store_core_1 = require("rx-store-core");
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
const formControlNRS_1 = __importDefault(require("./formControlNRS"));
const formControlIRS_1 = require("./formControlIRS");
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
                this.subscription = null;
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
                if (this.unBind) {
                    const removedAll = mutations.reduce((acc, next) => {
                        Array.from(next.removedNodes).forEach((node) => {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    const removed = removedAll.find((rm) => rm && this.directChildEmitter.value === rm);
                    if (removed) {
                        this.unBind();
                    }
                }
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
                        a instanceof HTMLElement && a.id === this.dataset.targetId;
                    });
                    added && this.directChildEmitter.next(added);
                    return;
                }
                if (this.dataset.targetSelector) {
                    const target = this.querySelector(this.dataset.targetSelector);
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
                if (target instanceof HTMLElement) {
                    target.addEventListener("mouseover", () => {
                        formController.hoverFormField(field, true);
                    });
                    target.addEventListener("mouseleave", () => {
                        formController.hoverFormField(field, false);
                    });
                    target.addEventListener("focus", () => {
                        formController.focusFormField(field, true);
                    });
                    target.addEventListener("blur", () => {
                        formController.focusFormField(field, false).touchFormField(field, true);
                    });
                    target.addEventListener("change", (event) => {
                        if (this.mapper) {
                            formController.changeFormValue(field, this.mapper(event));
                            return;
                        }
                        formController.changeFormValue(field, event.target.value);
                    });
                }
            }
            setInputDefault(target, key, next) {
                if (target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement) {
                    target.setAttribute(key, next);
                }
            }
            setInputDefaults(target, key, next) {
                if (!target) {
                    return;
                }
                if (key === "placeholder") {
                    this.setInputDefault(target, key, next);
                }
                if (key === "defaultValue") {
                    this.setInputDefault(target, key, next);
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
                if (!this.dataset.targetSelector && !this.dataset.targetId) {
                    const first = this.children.item(0);
                    if (!this.isValidDirectChild(first)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (this.dataset.targetId) {
                    const first = (_a = this.children
                        .item(0)) === null || _a === void 0 ? void 0 : _a.querySelector(`#${this.dataset.targetId}`);
                    if (!this.isValidDirectChild(first)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (this.dataset.targetSelector) {
                    const target = (_b = this.children
                        .item(0)) === null || _b === void 0 ? void 0 : _b.querySelector(this.dataset.targetSelector);
                    if (!this.isValidDirectChild(target)) {
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
                this.reportMultiChildError();
                this.emitOnlyChildOnMount().setInputDefaultsOnMount();
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
                this.setRequiredProperties();
            }
            disconnectedCallback() {
                var _a, _b;
                this.observer.disconnect();
                (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
                (_b = this.unBind) === null || _b === void 0 ? void 0 : _b.call(this);
            }
            attributeChangedCallback(key, prev, next) {
                const target = this.directChildEmitter.value;
                this.setInputDefaults(target, key, next);
            }
            static get observedAttributes() {
                return ["placeholder", "defaultValue"];
            }
        },
        (() => {
            _attrSetter_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _attrSetter_decorators, { kind: "method", name: "attrSetter", static: false, private: false, access: { has: obj => "attrSetter" in obj, get: obj => obj.attrSetter } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.FormControlComponent = (() => {
    var _a;
    let _instanceExtraInitializers_1 = [];
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
                    if (!(node instanceof FormFieldComponent)) {
                        return;
                    }
                    nodes.push(node);
                }));
                this.fieldListEmitter.next(nodes);
            }
            controlAll() {
                return (0, rxjs_1.merge)(this.formControllerEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)()), this.fieldListEmitter.asObservable(), 2)
                    .pipe((0, rxjs_1.pairwise)(), (0, rxjs_1.map)((paired) => {
                    console.log({ paired });
                    const controller = paired.find((target) => target instanceof formControlNRS_1.default ||
                        target instanceof formControlIRS_1.ImmutableFormControllerImpl);
                    const fields = paired.find((target) => Array.isArray(target));
                    return [controller, fields];
                }))
                    .subscribe(([controller, fields]) => {
                    console.log([controller, fields]);
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
                    if (node instanceof FormFieldComponent) {
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
                this.fieldListEmitter = (__runInitializers(this, _instanceExtraInitializers_1), new rxjs_1.BehaviorSubject([]));
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
            __esDecorate(_a, null, _drillDownChild_decorators, { kind: "method", name: "drillDownChild", static: false, private: false, access: { has: obj => "drillDownChild" in obj, get: obj => obj.drillDownChild } }, null, _instanceExtraInitializers_1);
            __esDecorate(_a, null, _setFieldListFromMutationRecords_decorators, { kind: "method", name: "setFieldListFromMutationRecords", static: false, private: false, access: { has: obj => "setFieldListFromMutationRecords" in obj, get: obj => obj.setFieldListFromMutationRecords } }, null, _instanceExtraInitializers_1);
        })(),
        _a;
})();
