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
exports.FormComponent = exports.FormFieldComponent = void 0;
const rx_store_core_1 = require("rx-store-core");
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
exports.FormFieldComponent = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _attrSetter_decorators;
    return _a = class FormFieldComponent extends HTMLElement {
            isValidDirectChild(target) {
                return target instanceof HTMLElement && target.parentNode === this;
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
                    added && this.directChildEmitter.next(added);
                    return;
                }
                if (this.dataset.targetSelector) {
                    const target = this.querySelector(this.dataset.targetSelector);
                    target && this.directChildEmitter.next(target);
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
                const type = (_a = this.getAttribute("data-type")) !== null && _a !== void 0 ? _a : interfaces_1.DatumType.SYNC;
                this.setDatumType(type);
            }
            constructor() {
                super();
                this.field = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                this.subscription = null;
                this.observer = new MutationObserver(this.setDirectChildFromMutations);
                this.setRequiredProperties();
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
                var _a, _b;
                this.observer.disconnect();
                (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
                (_b = this.unBind) === null || _b === void 0 ? void 0 : _b.call(this);
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
exports.FormComponent = (() => {
    var _a;
    let _instanceExtraInitializers_1 = [];
    let _setFieldListFromMutationRecords_decorators;
    return _a = class FormComponent extends HTMLFormElement {
            setFieldListFromMutationRecords(mutationList) {
                const nodes = [];
                mutationList
                    .filter((mutation) => mutation.type === "childList")
                    .forEach((mutation) => Array.from(mutation.addedNodes).forEach((node) => {
                    if (!(node instanceof FormFieldComponent)) {
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
