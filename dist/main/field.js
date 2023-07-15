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
    let _setDirectChildFromMutations_decorators;
    let _attrSetter_decorators;
    return _a = class FormFieldComponent extends HTMLElement {
            constructor() {
                super(...arguments);
                this.field = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                this.listeners = new WeakMap();
                this.observer = new MutationObserver(this.setDirectChildFromMutations);
            }
            isValidDirectChild(target) {
                return target instanceof HTMLElement && target.parentNode === this;
            }
            getDataset() {
                return Object.assign(Object.assign({}, this.dataset), { field: this.field });
            }
            reportMultiChildError() {
                if (this.children.length > 1) {
                    throw new Error(`${this.getDataset().field} has multiple child, only accept one child`);
                }
            }
            removeEventListeners(removed) {
                const cachedListeners = this.listeners.get(removed);
                if (cachedListeners) {
                    removed.removeEventListener("mouseover", cachedListeners.mouseover);
                    removed.removeEventListener("mouseleave", cachedListeners.mouseover);
                    removed.removeEventListener("focus", cachedListeners.focus);
                    removed.removeEventListener("blur", cachedListeners.mouseover);
                    removed.removeEventListener("keydown", cachedListeners.mouseover);
                    removed.removeEventListener("change", cachedListeners.focus);
                    cachedListeners.destruct();
                }
            }
            setDirectChildFromMutations(mutationList) {
                const mutations = mutationList.filter((mutation) => mutation.type === "childList");
                if (this.stopBinding) {
                    const removed = mutations
                        .map((mutation) => {
                        return Array.from(mutation.removedNodes);
                    })
                        .reduce((nodes, next) => {
                        next.forEach((node) => {
                            nodes.push(node);
                        });
                        return nodes;
                    }, [])
                        .find((node) => node === this.directChildEmitter.value);
                    if (removed) {
                        this.stopBinding();
                        this.directChildEmitter.next(null);
                        this.removeEventListeners(removed);
                    }
                }
                if (!this.getDataset().target_selector && !this.getDataset().target_id) {
                    const first = mutations[0].addedNodes.item(0);
                    if (!this.isValidDirectChild(first)) {
                        return;
                    }
                    this.reportMultiChildError();
                    this.directChildEmitter.next(first);
                    return;
                }
                if (this.getDataset().target_id) {
                    const allAdded = mutations.reduce((acc, next) => {
                        Array.from(next.addedNodes).forEach((node) => {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    const added = allAdded.find((a) => {
                        a instanceof HTMLElement && a.id === this.getDataset().target_id;
                    });
                    added && this.directChildEmitter.next(added);
                    return;
                }
                const { target_selector } = this.getDataset();
                if (target_selector) {
                    const target = this.querySelector(target_selector);
                    target && this.directChildEmitter.next(target);
                }
            }
            directChildIsTarget() {
                const { value } = this.directChildEmitter;
                return value && value === this.children.item(0);
            }
            getChangeFunction(formController, field, current) {
                const { changeEventMapper } = this;
                if (changeEventMapper) {
                    return (event) => {
                        formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, changeEventMapper(event));
                    };
                }
                if (current instanceof HTMLInputElement) {
                    if (current.type === "checkbox" || current.type === "radio") {
                        return ({ target }) => {
                            formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, target.checked);
                        };
                    }
                    if (current.type === "file") {
                        return ({ target }) => {
                            formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, target.files);
                        };
                    }
                }
                return ({ target }) => {
                    formController === null || formController === void 0 ? void 0 : formController.changeFormValue(field, target.value);
                };
            }
            attachChildEventListeners(current, formController) {
                const { field } = this;
                if (!formController || !field) {
                    return;
                }
                const { manual_binding } = this.getDataset();
                if (manual_binding === "true") {
                    return;
                }
                if (!current) {
                    return;
                }
                if (current instanceof HTMLElement) {
                    const { change, mouseleave, mouseover, blur, keydown, focus, destruct } = this.getBindingListeners(formController, field, current);
                    current.addEventListener("mouseover", mouseover);
                    current.addEventListener("mouseleave", mouseleave);
                    current.addEventListener("focus", focus);
                    current.addEventListener("blur", blur);
                    current.addEventListener("keydown", keydown);
                    current.addEventListener("change", change);
                    this.listeners.set(current, {
                        focus,
                        blur,
                        mouseleave,
                        mouseover,
                        keydown,
                        change,
                        destruct,
                    });
                }
            }
            getBindingListeners(formController, field, current) {
                const { keyboardEventMapper } = this;
                const keydown = keyboardEventMapper
                    ? (event) => {
                        formController.changeFormValue(field, keyboardEventMapper(event));
                    }
                    : (event) => {
                        formController.changeFormValue(field, event.target.value);
                    };
                const destruct = formController.observeFormValue(field, (val) => {
                    if (current instanceof HTMLInputElement) {
                        if (current.type === "checkbox" || current.type === "radio") {
                            current.checked = Boolean(val);
                            return;
                        }
                        if (current.type === "file" &&
                            Object.getPrototypeOf(val) === FileList.prototype) {
                            current.files = val;
                            return;
                        }
                        current.value = val;
                    }
                });
                return {
                    mouseover() {
                        formController.hoverFormField(field, true);
                    },
                    mouseleave() {
                        formController.hoverFormField(field, false);
                    },
                    focus() {
                        formController.focusFormField(field, true);
                    },
                    blur() {
                        formController.focusFormField(field, false).touchFormField(field, true);
                    },
                    keydown,
                    change: this.getChangeFunction(formController, field, current),
                    destruct,
                };
            }
            setInputDefault(target, key, next) {
                if (target instanceof HTMLInputElement ||
                    target instanceof HTMLTextAreaElement) {
                    target.setAttribute(key, next);
                }
            }
            emitOnlyChildOnMount() {
                var _a, _b;
                const { target_id, target_selector } = this.getDataset();
                if (!target_selector && !target_id) {
                    const first = this.children.item(0);
                    if (!this.isValidDirectChild(first)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (target_id) {
                    const first = (_a = this.children.item(0)) === null || _a === void 0 ? void 0 : _a.querySelector(`#${target_id}`);
                    if (!(first instanceof HTMLElement)) {
                        return this;
                    }
                    this.directChildEmitter.next(first);
                    return this;
                }
                if (target_selector) {
                    const target = (_b = this.children.item(0)) === null || _b === void 0 ? void 0 : _b.querySelector(target_selector);
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
            setKeyboardEventMapperMapper(mapper) {
                this.keyboardEventMapper = mapper;
            }
            setChangeEventMapperMapper(mapper) {
                this.changeEventMapper = mapper;
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
                this.emitOnlyChildOnMount();
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
                this.setRequiredProperties();
            }
            attributeChangedCallback(key, prev, next) {
                if (key === "data-target_id" && next) {
                    const target = this.querySelector(`#${next}`);
                    if (target instanceof HTMLElement) {
                        this.directChildEmitter.next(target);
                        return;
                    }
                }
                if (key === "data-target_selector" && next) {
                    const target = this.querySelector(next);
                    if (target instanceof HTMLElement) {
                        this.directChildEmitter.next(target);
                        return;
                    }
                }
                if (!next) {
                    const first = this.firstElementChild;
                    if (first instanceof HTMLElement) {
                        this.directChildEmitter.next(first);
                        return;
                    }
                }
                this.directChildEmitter.next(null);
            }
            static get observedAttributes() {
                return ["data-target_id", "data-target_selector"];
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
//# sourceMappingURL=field.js.map