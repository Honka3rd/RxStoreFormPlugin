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
exports.installNRFComponents = void 0;
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
const rx_store_core_1 = require("rx-store-core");
let NRFormFieldComponent = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _setDirectChildFromMutations_decorators;
    let _attrSetter_decorators;
    return _a = class NRFormFieldComponent extends HTMLElement {
            setDirectChildFromMutations(mutationList) {
                const mutations = mutationList.filter((mutation) => mutation.type === "childList");
                if (this.unBind) {
                    const removedAll = mutations.reduce((acc, next) => {
                        Array.from(next.removedNodes).forEach((node) => {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    const removed = removedAll.find((rm) => { var _a; return rm && ((_a = this.directChildEmitter) === null || _a === void 0 ? void 0 : _a.value) === rm; });
                    if (removed) {
                        this.unBind();
                    }
                }
                if (!this.dataset.targetSelector && !this.dataset.targetId) {
                    const first = mutations[0].addedNodes.item(0);
                    if (!(first instanceof HTMLElement)) {
                        return;
                    }
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
                    const added = allAdded.find((a) => {
                        a instanceof HTMLElement && a.id === this.dataset.targetId;
                    });
                    if (!added) {
                        return;
                    }
                    if (this.dataset.targetId === added.id) {
                        added instanceof HTMLElement && this.directChildEmitter.next(added);
                    }
                    return;
                }
                if (this.dataset.targetSelector) {
                    const target = this.querySelector(this.dataset.targetSelector);
                    if (!(target instanceof HTMLElement)) {
                        return;
                    }
                    this.directChildEmitter.next(target);
                }
            }
            directChildIsTarget() {
                var _a;
                if (!((_a = this.directChildEmitter) === null || _a === void 0 ? void 0 : _a.value) && !this.children.item(0)) {
                    return false;
                }
                return this.directChildEmitter.value === this.children.item(0);
            }
            setValue(value, formController, field) {
                formController.changeFormValue(field, value);
            }
            setTouched(value, formController, field) {
                formController.touchFormField(field, value);
            }
            setFocused(value, formController, field) {
                formController.focusFormField(field, value);
            }
            setHovered(value, formController, field) {
                formController.hoverFormField(field, value);
            }
            attachChildEventListeners(target, formController) {
                const { field } = this;
                if (!formController || !field) {
                    return;
                }
                if (target instanceof HTMLElement) {
                    target.addEventListener("mouseover", () => this.setHovered(true, formController, field));
                    target.addEventListener("mouseleave", () => this.setHovered(false, formController, field));
                    target.addEventListener("focus", () => this.setFocused(true, formController, field));
                    target.addEventListener("blur", () => {
                        this.setFocused(false, formController, field);
                        this.setTouched(true, formController, field);
                    });
                    target.addEventListener("change", (event) => {
                        if (this.mapper) {
                            this.setValue(this.mapper(event), formController, field);
                            return;
                        }
                        this.setValue(event.target.value, formController, field);
                    });
                }
            }
            attrSetter(target) {
                return (k, v) => target.setAttribute(k, v);
            }
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
                            this.setAttribute("data-async-state", String(datum.asyncState));
                        this.setAttribute("data-value", datum.value);
                        if (this.attributeBinder) {
                            this.attributeBinder(this.attrSetter(target), datum);
                            return;
                        }
                        if ("value" in target) {
                            target.setAttribute("value", datum.value);
                            return;
                        }
                        target.setAttribute("data-value", datum.value);
                    });
                }
            }
            metaBinding(target, formController) {
                const { field } = this;
                if (!formController || !field) {
                    return;
                }
                if (target instanceof HTMLElement) {
                    return formController.observeMetaByField(field, (meta) => {
                        if (!meta) {
                            return;
                        }
                        if (this.metaDataBinder) {
                            this.metaDataBinder(this.attrSetter(target), meta);
                        }
                    });
                }
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
            makeControl() {
                return this.formControllerEmitter
                    .asObservable()
                    .pipe((0, rxjs_1.switchMap)((controller) => this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)((firstChild) => {
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
            setRequiredProperties() {
                var _a;
                const field = this.getAttribute("data-field");
                if (!field || !field.length) {
                    throw new Error("Form field is not set");
                }
                this.setField(field);
                const type = (_a = this.getAttribute("data-type")) !== null && _a !== void 0 ? _a : interfaces_1.DatumType.SYNC;
                this.setDatumType(type);
            }
            constructor() {
                super();
                this.field = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                this.observer = new MutationObserver(this.setDirectChildFromMutations);
                this.setRequiredProperties();
                this.subscription = this.makeControl();
            }
            setMetaBinder(binder) {
                this.metaDataBinder = binder;
            }
            setAttrBinder(binder) {
                this.attributeBinder = binder;
            }
            setDataMapper(mapper) {
                this.mapper = mapper;
            }
            setNRFormController(controller) {
                this.formControllerEmitter.next(controller);
            }
            getField() {
                return this.field;
            }
            getDatumType() {
                return this.type;
            }
            connectedCallback() {
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
            }
            disconnectedCallback() {
                var _a;
                this.observer.disconnect();
                this.subscription.unsubscribe();
                (_a = this.unBind) === null || _a === void 0 ? void 0 : _a.call(this);
            }
            attributeChangedCallback(key, prev, next) {
                const target = this.directChildEmitter.value;
                if (!target) {
                    return;
                }
                if (key === "placeholder") {
                    if (target instanceof HTMLInputElement ||
                        target instanceof HTMLTextAreaElement) {
                        if (this.directChildIsTarget()) {
                            return;
                        }
                        target.setAttribute(key, next);
                    }
                }
                if (key === "defaultValue") {
                    if (target instanceof HTMLInputElement ||
                        target instanceof HTMLTextAreaElement) {
                        if (this.directChildIsTarget()) {
                            return;
                        }
                        target.setAttribute(key, next);
                    }
                }
            }
            static observedAttributes() {
                return ["placeholder", "defaultValue"];
            }
        },
        (() => {
            _setDirectChildFromMutations_decorators = [rx_store_core_1.bound];
            _attrSetter_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setDirectChildFromMutations_decorators, { kind: "method", name: "setDirectChildFromMutations", static: false, private: false, access: { has: obj => "setDirectChildFromMutations" in obj, get: obj => obj.setDirectChildFromMutations } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _attrSetter_decorators, { kind: "method", name: "attrSetter", static: false, private: false, access: { has: obj => "attrSetter" in obj, get: obj => obj.attrSetter } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
let NRFormComponent = (() => {
    var _a;
    let _instanceExtraInitializers_1 = [];
    let _setFieldListFromMutationRecords_decorators;
    return _a = class NRFormComponent extends HTMLFormElement {
            setFieldListFromMutationRecords(mutationList) {
                const nodes = [];
                mutationList
                    .filter((mutation) => mutation.type === "childList")
                    .forEach((mutation) => Array.from(mutation.addedNodes).forEach((node) => {
                    if (!(node instanceof NRFormFieldComponent)) {
                        return;
                    }
                    nodes.push(node);
                }));
                this.fieldListEmitter.next(nodes);
            }
            controlAll() {
                return this.formControllerEmitter
                    .asObservable()
                    .pipe((0, rxjs_1.switchMap)((controller) => this.fieldListEmitter.asObservable().pipe((0, rxjs_1.tap)((nodeList) => {
                    if (controller) {
                        nodeList.forEach((node) => node.setNRFormController(controller));
                    }
                }))))
                    .subscribe();
            }
            constructor() {
                super();
                this.fieldListEmitter = (__runInitializers(this, _instanceExtraInitializers_1), new rxjs_1.BehaviorSubject([]));
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.observer = new MutationObserver(this.setFieldListFromMutationRecords);
                this.subscription = this.controlAll();
            }
            connectedCallback() {
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
            }
            disconnectedCallback() {
                this.observer.disconnect();
                this.subscription.unsubscribe();
            }
            setNRFormController(controller) {
                this.setAttribute("data-selector", controller.selector());
                this.formControllerEmitter.next(controller);
            }
        },
        (() => {
            _setFieldListFromMutationRecords_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setFieldListFromMutationRecords_decorators, { kind: "method", name: "setFieldListFromMutationRecords", static: false, private: false, access: { has: obj => "setFieldListFromMutationRecords" in obj, get: obj => obj.setFieldListFromMutationRecords } }, null, _instanceExtraInitializers_1);
        })(),
        _a;
})();
const installNRFComponents = ({ formSelector, fieldSelector, } = {}) => {
    const fieldId = fieldSelector ? fieldSelector : "rx-field-component";
    const formId = formSelector ? formSelector : "rx-form-component";
    if (!window.customElements.get(fieldId)) {
        window.customElements.define(fieldId, NRFormFieldComponent);
    }
    if (!window.customElements.get(formId)) {
        window.customElements.define(formId, NRFormComponent);
    }
};
exports.installNRFComponents = installNRFComponents;
