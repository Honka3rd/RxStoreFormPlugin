"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
exports.installNRFComponents = void 0;
var rxjs_1 = require("rxjs");
var interfaces_1 = require("./interfaces");
var rx_store_core_1 = require("rx-store-core");
var NRFormFieldComponent = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _setDirectChildFromMutations_decorators;
    var _attrSetter_decorators;
    return _a = /** @class */ (function (_super) {
            __extends(NRFormFieldComponent, _super);
            function NRFormFieldComponent() {
                var _this = _super.call(this) || this;
                _this.field = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                _this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                _this.observer = new MutationObserver(_this.setDirectChildFromMutations);
                _this.setRequiredProperties();
                _this.subscription = _this.makeControl();
                return _this;
            }
            NRFormFieldComponent.prototype.setDirectChildFromMutations = function (mutationList) {
                var _this = this;
                var mutations = mutationList.filter(function (mutation) { return mutation.type === "childList"; });
                if (this.unBind) {
                    var removedAll = mutations.reduce(function (acc, next) {
                        Array.from(next.removedNodes).forEach(function (node) {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    var removed = removedAll.find(function (rm) { var _a; return rm && ((_a = _this.directChildEmitter) === null || _a === void 0 ? void 0 : _a.value) === rm; });
                    if (removed) {
                        this.unBind();
                    }
                }
                if (!this.dataset.targetSelector && !this.dataset.targetId) {
                    var first = mutations[0].addedNodes.item(0);
                    if (!(first instanceof HTMLElement)) {
                        return;
                    }
                    this.directChildEmitter.next(first);
                    return;
                }
                if (this.dataset.targetId) {
                    var allAdded = mutations.reduce(function (acc, next) {
                        Array.from(next.addedNodes).forEach(function (node) {
                            acc.push(node);
                        });
                        return acc;
                    }, []);
                    var added = allAdded.find(function (a) {
                        a instanceof HTMLElement && a.id === _this.dataset.targetId;
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
                    var target = this.querySelector(this.dataset.targetSelector);
                    if (!(target instanceof HTMLElement)) {
                        return;
                    }
                    this.directChildEmitter.next(target);
                }
            };
            NRFormFieldComponent.prototype.directChildIsTarget = function () {
                var _a;
                if (!((_a = this.directChildEmitter) === null || _a === void 0 ? void 0 : _a.value) && !this.children.item(0)) {
                    return false;
                }
                return this.directChildEmitter.value === this.children.item(0);
            };
            NRFormFieldComponent.prototype.setValue = function (value, formController, field) {
                formController.changeFormValue(field, value);
            };
            NRFormFieldComponent.prototype.setTouched = function (value, formController, field) {
                formController.touchFormField(field, value);
            };
            NRFormFieldComponent.prototype.setFocused = function (value, formController, field) {
                formController.focusFormField(field, value);
            };
            NRFormFieldComponent.prototype.setHovered = function (value, formController, field) {
                formController.hoverFormField(field, value);
            };
            NRFormFieldComponent.prototype.attachChildEventListeners = function (target, formController) {
                var _this = this;
                var field = this.field;
                if (!formController || !field) {
                    return;
                }
                if (target instanceof HTMLElement) {
                    target.addEventListener("mouseover", function () {
                        return _this.setHovered(true, formController, field);
                    });
                    target.addEventListener("mouseleave", function () {
                        return _this.setHovered(false, formController, field);
                    });
                    target.addEventListener("focus", function () {
                        return _this.setFocused(true, formController, field);
                    });
                    target.addEventListener("blur", function () {
                        _this.setFocused(false, formController, field);
                        _this.setTouched(true, formController, field);
                    });
                    target.addEventListener("change", function (event) {
                        if (_this.mapper) {
                            _this.setValue(_this.mapper(event), formController, field);
                            return;
                        }
                        _this.setValue(event.target.value, formController, field);
                    });
                }
            };
            NRFormFieldComponent.prototype.attrSetter = function (target) {
                return function (k, v) { return target.setAttribute(k, v); };
            };
            NRFormFieldComponent.prototype.valuesBinding = function (target, formController) {
                var _this = this;
                var field = this.field;
                if (!formController || !field) {
                    return;
                }
                if (target instanceof HTMLElement) {
                    return formController.observeFormDatum(field, function (datum) {
                        _this.setAttribute("data-focused", String(datum.focused));
                        _this.setAttribute("data-changed", String(datum.changed));
                        _this.setAttribute("data-touched", String(datum.touched));
                        _this.setAttribute("data-hovered", String(datum.hovered));
                        datum.asyncState &&
                            _this.setAttribute("data-async-state", String(datum.asyncState));
                        _this.setAttribute("data-value", datum.value);
                        if (_this.attributeBinder) {
                            _this.attributeBinder(_this.attrSetter(target), datum);
                            return;
                        }
                        if ("value" in target) {
                            target.setAttribute("value", datum.value);
                            return;
                        }
                        target.setAttribute("data-value", datum.value);
                    });
                }
            };
            NRFormFieldComponent.prototype.metaBinding = function (target, formController) {
                var _this = this;
                var field = this.field;
                if (!formController || !field) {
                    return;
                }
                if (target instanceof HTMLElement) {
                    return formController.observeMetaByField(field, function (meta) {
                        if (!meta) {
                            return;
                        }
                        if (_this.metaDataBinder) {
                            _this.metaDataBinder(_this.attrSetter(target), meta);
                        }
                    });
                }
            };
            NRFormFieldComponent.prototype.setField = function (field) {
                if (this.field) {
                    return;
                }
                this.field = field;
            };
            NRFormFieldComponent.prototype.setDatumType = function (type) {
                if (this.type) {
                    return;
                }
                this.type = type;
            };
            NRFormFieldComponent.prototype.makeControl = function () {
                var _this = this;
                return this.formControllerEmitter
                    .asObservable()
                    .pipe((0, rxjs_1.switchMap)(function (controller) {
                    return _this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)(function (firstChild) {
                        _this.attachChildEventListeners(firstChild, controller);
                        var unbindV = _this.valuesBinding(firstChild, controller);
                        var unbindM = _this.metaBinding(firstChild, controller);
                        _this.unBind = function () {
                            unbindV === null || unbindV === void 0 ? void 0 : unbindV();
                            unbindM === null || unbindM === void 0 ? void 0 : unbindM();
                        };
                    }));
                }))
                    .subscribe();
            };
            NRFormFieldComponent.prototype.setRequiredProperties = function () {
                var _a;
                var field = this.getAttribute("data-field");
                if (!field || !field.length) {
                    throw new Error("Form field is not set");
                }
                this.setField(field);
                var type = (_a = this.getAttribute("data-type")) !== null && _a !== void 0 ? _a : interfaces_1.DatumType.SYNC;
                this.setDatumType(type);
            };
            NRFormFieldComponent.prototype.setMetaBinder = function (binder) {
                this.metaDataBinder = binder;
            };
            NRFormFieldComponent.prototype.setAttrBinder = function (binder) {
                this.attributeBinder = binder;
            };
            NRFormFieldComponent.prototype.setDataMapper = function (mapper) {
                this.mapper = mapper;
            };
            NRFormFieldComponent.prototype.setNRFormController = function (controller) {
                this.formControllerEmitter.next(controller);
            };
            NRFormFieldComponent.prototype.getField = function () {
                return this.field;
            };
            NRFormFieldComponent.prototype.getDatumType = function () {
                return this.type;
            };
            NRFormFieldComponent.prototype.connectedCallback = function () {
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
            };
            NRFormFieldComponent.prototype.disconnectedCallback = function () {
                var _a;
                this.observer.disconnect();
                this.subscription.unsubscribe();
                (_a = this.unBind) === null || _a === void 0 ? void 0 : _a.call(this);
            };
            NRFormFieldComponent.prototype.attributeChangedCallback = function (key, prev, next) {
                var target = this.directChildEmitter.value;
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
            };
            NRFormFieldComponent.observedAttributes = function () {
                return ["placeholder", "defaultValue"];
            };
            return NRFormFieldComponent;
        }(HTMLElement)),
        (function () {
            _setDirectChildFromMutations_decorators = [rx_store_core_1.bound];
            _attrSetter_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setDirectChildFromMutations_decorators, { kind: "method", name: "setDirectChildFromMutations", static: false, private: false, access: { has: function (obj) { return "setDirectChildFromMutations" in obj; }, get: function (obj) { return obj.setDirectChildFromMutations; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _attrSetter_decorators, { kind: "method", name: "attrSetter", static: false, private: false, access: { has: function (obj) { return "attrSetter" in obj; }, get: function (obj) { return obj.attrSetter; } } }, null, _instanceExtraInitializers);
        })(),
        _a;
}();
var NRFormComponent = function () {
    var _a;
    var _instanceExtraInitializers_1 = [];
    var _setFieldListFromMutationRecords_decorators;
    return _a = /** @class */ (function (_super) {
            __extends(NRFormComponent, _super);
            function NRFormComponent() {
                var _this = _super.call(this) || this;
                _this.fieldListEmitter = (__runInitializers(_this, _instanceExtraInitializers_1), new rxjs_1.BehaviorSubject([]));
                _this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                _this.observer = new MutationObserver(_this.setFieldListFromMutationRecords);
                _this.subscription = _this.controlAll();
                return _this;
            }
            NRFormComponent.prototype.setFieldListFromMutationRecords = function (mutationList) {
                var nodes = [];
                mutationList
                    .filter(function (mutation) { return mutation.type === "childList"; })
                    .forEach(function (mutation) {
                    return Array.from(mutation.addedNodes).forEach(function (node) {
                        if (!(node instanceof NRFormFieldComponent)) {
                            return;
                        }
                        nodes.push(node);
                    });
                });
                this.fieldListEmitter.next(nodes);
            };
            NRFormComponent.prototype.controlAll = function () {
                var _this = this;
                return this.formControllerEmitter
                    .asObservable()
                    .pipe((0, rxjs_1.switchMap)(function (controller) {
                    return _this.fieldListEmitter.asObservable().pipe((0, rxjs_1.tap)(function (nodeList) {
                        if (controller) {
                            nodeList.forEach(function (node) {
                                return node.setNRFormController(controller);
                            });
                        }
                    }));
                }))
                    .subscribe();
            };
            NRFormComponent.prototype.connectedCallback = function () {
                this.observer.observe(this, {
                    subtree: true,
                    childList: true,
                    attributes: false,
                });
            };
            NRFormComponent.prototype.disconnectedCallback = function () {
                this.observer.disconnect();
                this.subscription.unsubscribe();
            };
            NRFormComponent.prototype.setNRFormController = function (controller) {
                this.setAttribute("data-selector", controller.selector());
                this.formControllerEmitter.next(controller);
            };
            return NRFormComponent;
        }(HTMLFormElement)),
        (function () {
            _setFieldListFromMutationRecords_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setFieldListFromMutationRecords_decorators, { kind: "method", name: "setFieldListFromMutationRecords", static: false, private: false, access: { has: function (obj) { return "setFieldListFromMutationRecords" in obj; }, get: function (obj) { return obj.setFieldListFromMutationRecords; } } }, null, _instanceExtraInitializers_1);
        })(),
        _a;
}();
var installNRFComponents = function (_a) {
    var _b = _a === void 0 ? {} : _a, formSelector = _b.formSelector, fieldSelector = _b.fieldSelector;
    var fieldId = fieldSelector ? fieldSelector : "rx-field-component";
    var formId = formSelector ? formSelector : "rx-form-component";
    if (!window.customElements.get(fieldId)) {
        window.customElements.define(fieldId, NRFormFieldComponent);
    }
    if (!window.customElements.get(formId)) {
        window.customElements.define(formId, NRFormComponent);
    }
};
exports.installNRFComponents = installNRFComponents;
