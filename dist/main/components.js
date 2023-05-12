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
    return _a = /** @class */ (function (_super) {
            __extends(NRFormFieldComponent, _super);
            function NRFormFieldComponent() {
                var _this = this;
                var _a;
                _this = _super.call(this) || this;
                _this.field = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.formControllerEmitter = new rxjs_1.BehaviorSubject(null);
                _this.directChildEmitter = new rxjs_1.BehaviorSubject(null);
                _this.observer = new MutationObserver(_this.setDirectChildFromMutations);
                _this.setField(_this.getAttribute("field"));
                var type = (_a = _this.getAttribute("type")) !== null && _a !== void 0 ? _a : interfaces_1.DatumType.SYNC;
                _this.setDatumType(type);
                _this.subscription = _this.makeControl();
                return _this;
            }
            NRFormFieldComponent.prototype.setDirectChildFromMutations = function (mutationList) {
                var first = mutationList
                    .filter(function (mutation) { return mutation.type === "childList"; })[0]
                    .addedNodes.item(0);
                if (!(first instanceof HTMLElement)) {
                    return;
                }
                this.directChildEmitter.next(first);
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
            NRFormFieldComponent.prototype.attachChildEventListeners = function (firstChild, formController) {
                var _this = this;
                var field = this.field;
                if (!formController || !field) {
                    return;
                }
                if (firstChild instanceof HTMLElement) {
                    firstChild.addEventListener("mouseover", function () {
                        return _this.setHovered(true, formController, field);
                    });
                    firstChild.addEventListener("mouseleave", function () {
                        return _this.setHovered(false, formController, field);
                    });
                    firstChild.addEventListener("focus", function () {
                        return _this.setFocused(true, formController, field);
                    });
                    firstChild.addEventListener("blur", function () {
                        return _this.setFocused(false, formController, field);
                    });
                    firstChild.addEventListener("mousedown", function () {
                        return _this.setTouched(true, formController, field);
                    });
                    firstChild.addEventListener("change", function (event) {
                        if (_this.mapper) {
                            _this.setValue(_this.mapper(event), formController, field);
                            return;
                        }
                        _this.setValue(event.target.value, formController, field);
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
                    }));
                }))
                    .subscribe();
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
                    subtree: false,
                    childList: true,
                    attributes: false,
                });
            };
            NRFormFieldComponent.prototype.disconnectedCallback = function () {
                this.observer.disconnect();
                this.subscription.unsubscribe();
            };
            return NRFormFieldComponent;
        }(HTMLElement)),
        (function () {
            _setDirectChildFromMutations_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _setDirectChildFromMutations_decorators, { kind: "method", name: "setDirectChildFromMutations", static: false, private: false, access: { has: function (obj) { return "setDirectChildFromMutations" in obj; }, get: function (obj) { return obj.setDirectChildFromMutations; } } }, null, _instanceExtraInitializers);
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
    var FormSelector = _a.FormSelector, FieldSelector = _a.FieldSelector;
    customElements.define(FormSelector !== null && FormSelector !== void 0 ? FormSelector : "rx-field-component", NRFormFieldComponent);
    customElements.define(FieldSelector !== null && FieldSelector !== void 0 ? FieldSelector : "rx-form-component", NRFormComponent);
};
exports.installNRFComponents = installNRFComponents;
