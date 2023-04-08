"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var rx_store_core_1 = require("rx-store-core");
var interfaces_1 = require("./interfaces");
var rxjs_1 = require("rxjs");
var FormControllerImpl = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _selector_decorators;
    var _getMeta_decorators;
    var _getClonedMetaByField_decorators;
    var _getFieldMeta_decorators;
    var _getFieldsMeta_decorators;
    var _observeMeta_decorators;
    var _observeMetaByField_decorators;
    var _startValidation_decorators;
    var _changeFormDatum_decorators;
    var _hoverFormField_decorators;
    var _changeFieldType_decorators;
    var _resetFormDatum_decorators;
    var _resetFormAll_decorators;
    var _touchFormField_decorators;
    var _emptyFormField_decorators;
    var _focusFormField_decorators;
    var _appendFormData_decorators;
    var _removeFormData_decorators;
    var _setMetadata_decorators;
    var _setMetaByField_decorators;
    return _a = /** @class */ (function () {
            function FormControllerImpl(formSelector, validator) {
                var _this = this;
                this.formSelector = (__runInitializers(this, _instanceExtraInitializers), formSelector);
                this.validator = validator;
                this.getAsyncFields = function (connector) {
                    return connector
                        .getState(_this.formSelector)
                        .filter(function (_a) {
                        var type = _a.type;
                        return type === interfaces_1.DatumType.ASYNC;
                    })
                        .map(function (_a) {
                        var field = _a.field;
                        return field;
                    });
                };
                this.initiator = function (connector) {
                    if (connector && !_this.connector) {
                        _this.connector = connector;
                        _this.metadata$ = new rxjs_1.BehaviorSubject(_this.validator(connector.getState(_this.formSelector)));
                    }
                    if (_this.fields) {
                        return _this.fields.map(function (_a) {
                            var field = _a.field, defaultValue = _a.defaultValue, type = _a.type;
                            return ({
                                field: field,
                                touched: false,
                                empty: true,
                                changed: false,
                                hovered: false,
                                focused: false,
                                value: defaultValue,
                                type: type ? type : interfaces_1.DatumType.SYNC,
                            });
                        });
                    }
                    return [];
                };
            }
            FormControllerImpl.prototype.setAsyncValidator = function (asyncValidator) {
                if (!this.asyncValidator) {
                    this.asyncValidator = asyncValidator;
                }
            };
            FormControllerImpl.prototype.setFields = function (fields) {
                if (!this.fields) {
                    this.fields = fields;
                }
            };
            FormControllerImpl.prototype.setMetaComparator = function (metaComparator) {
                if (!this.metaComparator) {
                    this.metaComparator = metaComparator;
                }
            };
            FormControllerImpl.prototype.setMetaComparatorMap = function (metaComparatorMap) {
                if (!this.metaComparatorMap) {
                    this.metaComparatorMap = metaComparatorMap;
                }
            };
            FormControllerImpl.prototype.setMetaCloneFunction = function (cloneFunction) {
                if (!this.cloneFunction) {
                    this.cloneFunction = cloneFunction;
                }
            };
            FormControllerImpl.prototype.setMetaCloneFunctionMap = function (cloneFunctionMap) {
                if (!this.cloneFunctionMap) {
                    this.cloneFunctionMap = cloneFunctionMap;
                }
            };
            FormControllerImpl.prototype.reportNoneConnectedError = function () {
                throw Error("initiator method is not called");
            };
            FormControllerImpl.prototype.safeExecute = function (callback) {
                var connector = this.connector;
                if (connector) {
                    return callback(connector);
                }
                this.reportNoneConnectedError();
            };
            FormControllerImpl.prototype.shallowCloneFormData = function () {
                var _this = this;
                return this.safeExecute(function (connector) {
                    return connector.getClonedState(_this.formSelector);
                });
            };
            FormControllerImpl.prototype.safeClone = function (callback) {
                var cloned = this.shallowCloneFormData();
                if (cloned) {
                    return callback(cloned);
                }
            };
            FormControllerImpl.prototype.findDatumByField = function (data, field) {
                return data.find(function (datum) { return datum.field === field; });
            };
            FormControllerImpl.prototype.findFromClonedAndExecute = function (field, cloned, callback) {
                var found = this.findDatumByField(cloned, field);
                if (found) {
                    callback(found);
                }
            };
            FormControllerImpl.prototype.commitMutation = function (data, connector) {
                var _a;
                connector.setState((_a = {}, _a[this.formSelector] = data, _a));
            };
            FormControllerImpl.prototype.safeCommitMutation = function (field, callback) {
                var _this = this;
                this.safeExecute(function (connector) {
                    _this.safeClone(function (data) {
                        _this.findFromClonedAndExecute(field, data, function (found) {
                            callback(__assign({}, found), data);
                            _this.commitMutation(data, connector);
                        });
                    });
                });
            };
            FormControllerImpl.prototype.safeCommitMeta = function (meta) {
                var _this = this;
                this.safeExecute(function () { var _a; return (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta); });
            };
            FormControllerImpl.prototype.removeDataByFields = function (fields, data) {
                fields.forEach(function (field) {
                    data.splice(data.findIndex(function (d) { return d.field === field; }), 1);
                });
            };
            FormControllerImpl.prototype.appendDataByFields = function (fields, data) {
                fields.forEach(function (_a) {
                    var defaultValue = _a.defaultValue, field = _a.field, type = _a.type;
                    data.push({
                        field: field,
                        touched: false,
                        empty: true,
                        changed: false,
                        hovered: false,
                        focused: false,
                        value: defaultValue,
                        type: type ? type : interfaces_1.DatumType.SYNC,
                    });
                });
            };
            FormControllerImpl.prototype.validatorExecutor = function (connector) {
                var _this = this;
                return connector.observe(this.formSelector, function (formData) {
                    var meta = _this.validator(formData);
                    _this.safeCommitMeta(meta);
                });
            };
            FormControllerImpl.prototype.getExcludedMeta = function (connector) {
                var excluded = connector
                    .getState(this.formSelector)
                    .filter(function (_a) {
                    var type = _a.type;
                    return type === interfaces_1.DatumType.EXCLUDED;
                })
                    .map(function (_a) {
                    var field = _a.field;
                    return field;
                });
                return this.getFieldsMeta(excluded);
            };
            FormControllerImpl.prototype.setAsyncState = function (state) {
                var _this = this;
                this.safeExecute(function (connector) {
                    var cloned = connector.getClonedState(_this.formSelector);
                    _this.getAsyncFields(connector).forEach(function (field) {
                        var found = cloned.find(function (c) { return c.field === field; });
                        if (found) {
                            found.asyncState = state;
                        }
                    });
                    _this.commitMutation(cloned, connector);
                });
            };
            FormControllerImpl.prototype.asyncValidatorExecutor = function (connector) {
                var _this = this;
                if (!this.asyncValidator) {
                    return;
                }
                var comparatorMap = connector.getComparatorMap();
                var specCompare = comparatorMap === null || comparatorMap === void 0 ? void 0 : comparatorMap[this.formSelector];
                var compare = specCompare ? specCompare : connector.comparator;
                var subscription = connector
                    .getDataSource()
                    .pipe((0, rxjs_1.map)(function (states) { return states[_this.formSelector]; }), (0, rxjs_1.distinctUntilChanged)(compare), (0, rxjs_1.map)(function (formData) {
                    return formData.filter(function (_a) {
                        var type = _a.type;
                        return type === interfaces_1.DatumType.ASYNC;
                    });
                }), (0, rxjs_1.switchMap)(function (asyncFormData) {
                    if (!asyncFormData.length) {
                        return (0, rxjs_1.of)(_this.getMeta());
                    }
                    _this.setAsyncState(interfaces_1.AsyncState.PENDING);
                    var async$ = _this.asyncValidator(asyncFormData);
                    var reduced$ = async$ instanceof Promise ? (0, rxjs_1.from)(async$) : async$;
                    return reduced$.pipe((0, rxjs_1.catchError)(function () {
                        return (0, rxjs_1.of)({
                            success: false,
                            meta: _this.getMeta(),
                        });
                    }), (0, rxjs_1.map)(function (meta) {
                        if ("success" in meta) {
                            return meta;
                        }
                        return { success: true, meta: meta };
                    }), (0, rxjs_1.tap)(function (_a) {
                        var success = _a.success;
                        if (success) {
                            _this.setAsyncState(interfaces_1.AsyncState.DONE);
                            return;
                        }
                        _this.setAsyncState(interfaces_1.AsyncState.ERROR);
                    }), (0, rxjs_1.map)(function (_a) {
                        var meta = _a.meta, success = _a.success;
                        if (!success) {
                            return meta;
                        }
                        return __assign(__assign(__assign({}, _this.getMeta()), meta), _this.getExcludedMeta(connector));
                    }));
                }))
                    .subscribe(function (meta) { return meta && _this.safeCommitMeta(meta); });
                return function () { return subscription.unsubscribe(); };
            };
            FormControllerImpl.prototype.selector = function () {
                return this.formSelector;
            };
            FormControllerImpl.prototype.chain = function () {
                var plugins = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    plugins[_i] = arguments[_i];
                }
                this.safeExecute(function (connector) {
                    Array.from(plugins).forEach(function (plugin) {
                        plugin.initiator(connector);
                    });
                });
                return this;
            };
            FormControllerImpl.prototype.getMeta = function () {
                var _a;
                return __assign({}, (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.value);
            };
            FormControllerImpl.prototype.getClonedMetaByField = function (field) {
                var _a, _b;
                var meta = this.getMeta();
                var clone = ((_a = this.cloneFunctionMap) === null || _a === void 0 ? void 0 : _a[field])
                    ? this.cloneFunctionMap[field]
                    : this.cloneFunction;
                var target = meta[field];
                if (clone && target) {
                    return clone(target);
                }
                var defaultClone = (_b = this.connector) === null || _b === void 0 ? void 0 : _b.cloneFunction;
                if (defaultClone) {
                    return defaultClone(target);
                }
                return target;
            };
            FormControllerImpl.prototype.getFieldMeta = function (field) {
                var _a;
                return (_a = this.getMeta()) === null || _a === void 0 ? void 0 : _a[field];
            };
            FormControllerImpl.prototype.getFieldsMeta = function (fields) {
                var _this = this;
                return fields.reduce(function (acc, next) {
                    var _a;
                    var meta = (_a = _this.getMeta()) === null || _a === void 0 ? void 0 : _a[next];
                    if (meta !== undefined) {
                        acc[next] = meta;
                    }
                    return acc;
                }, {});
            };
            FormControllerImpl.prototype.observeMeta = function (callback) {
                var _a;
                var subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.distinctUntilChanged)(this.metaComparator)).subscribe(callback);
                return function () { return subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe(); };
            };
            FormControllerImpl.prototype.observeMetaByField = function (field, callback) {
                var _a, _b;
                var subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.map)(function (meta) { return meta[field]; }), (0, rxjs_1.distinctUntilChanged)((_b = this.metaComparatorMap) === null || _b === void 0 ? void 0 : _b[field])).subscribe(callback);
                return function () { return subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe(); };
            };
            FormControllerImpl.prototype.startValidation = function () {
                var _this = this;
                return this.safeExecute(function (connector) {
                    var stopSyncValidation = _this.validatorExecutor(connector);
                    var stopAsyncValidation = _this.asyncValidatorExecutor(connector);
                    return {
                        stopSyncValidation: stopSyncValidation,
                        stopAsyncValidation: stopAsyncValidation,
                    };
                });
            };
            FormControllerImpl.prototype.changeFormDatum = function (field, value) {
                this.safeCommitMutation(field, function (found) {
                    found.value = value;
                });
                return this;
            };
            FormControllerImpl.prototype.hoverFormField = function (field, hoverOrNot) {
                this.safeCommitMutation(field, function (found) {
                    found.hovered = hoverOrNot;
                });
                return this;
            };
            FormControllerImpl.prototype.changeFieldType = function (field, type) {
                this.safeCommitMutation(field, function (found) {
                    found.type = type;
                });
                return this;
            };
            FormControllerImpl.prototype.resetFormDatum = function (field) {
                var _this = this;
                this.safeCommitMutation(field, function (found, data) {
                    var defaultDatum = _this.findDatumByField(_this.initiator(), field);
                    if (defaultDatum) {
                        found.changed = defaultDatum.changed;
                        found.empty = defaultDatum.empty;
                        found.focused = defaultDatum.focused;
                        found.hovered = defaultDatum.hovered;
                        found.touched = defaultDatum.touched;
                        found.value = defaultDatum.value;
                        return _this;
                    }
                    _this.removeDataByFields([field], data);
                });
                return this;
            };
            FormControllerImpl.prototype.resetFormAll = function () {
                var _this = this;
                this.safeExecute(function (connector) {
                    connector.reset(_this.formSelector);
                });
                return this;
            };
            FormControllerImpl.prototype.touchFormField = function (field, touchOrNot) {
                this.safeCommitMutation(field, function (found) {
                    found.touched = touchOrNot;
                });
                return this;
            };
            FormControllerImpl.prototype.emptyFormField = function (field) {
                var _this = this;
                this.safeCommitMutation(field, function (found, data) {
                    var defaultDatum = _this.findDatumByField(_this.initiator(), field);
                    if (defaultDatum) {
                        found.empty = true;
                        found.value = defaultDatum.value;
                        return;
                    }
                    data.splice(data.findIndex(function (d) { return d.field === field; }), 1);
                });
                return this;
            };
            FormControllerImpl.prototype.focusFormField = function (field, focusOrNot) {
                this.safeCommitMutation(field, function (found) {
                    found.focused = focusOrNot;
                });
                return this;
            };
            FormControllerImpl.prototype.appendFormData = function (fields) {
                var _this = this;
                this.safeExecute(function (connector) {
                    var data = connector.getClonedState(_this.formSelector);
                    _this.appendDataByFields(fields, data);
                    _this.commitMutation(data, connector);
                });
                return this;
            };
            FormControllerImpl.prototype.removeFormData = function (fields) {
                var _this = this;
                this.safeExecute(function (connector) {
                    var data = connector.getClonedState(_this.formSelector);
                    _this.removeDataByFields(fields, data);
                    _this.commitMutation(data, connector);
                });
                return this;
            };
            FormControllerImpl.prototype.setMetadata = function (meta) {
                var _this = this;
                this.safeExecute(function () {
                    var _a;
                    (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(__assign(__assign({}, _this.metadata$.value), meta));
                });
                return this;
            };
            FormControllerImpl.prototype.setMetaByField = function (field, metaOne) {
                var _this = this;
                this.safeExecute(function () {
                    var _a;
                    var meta = _this.getMeta();
                    meta[field] = metaOne;
                    (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(__assign({}, meta));
                });
                return this;
            };
            return FormControllerImpl;
        }()),
        (function () {
            _selector_decorators = [rx_store_core_1.bound];
            _getMeta_decorators = [rx_store_core_1.bound];
            _getClonedMetaByField_decorators = [rx_store_core_1.bound];
            _getFieldMeta_decorators = [rx_store_core_1.bound];
            _getFieldsMeta_decorators = [rx_store_core_1.bound];
            _observeMeta_decorators = [rx_store_core_1.bound];
            _observeMetaByField_decorators = [rx_store_core_1.bound];
            _startValidation_decorators = [rx_store_core_1.bound];
            _changeFormDatum_decorators = [rx_store_core_1.bound];
            _hoverFormField_decorators = [rx_store_core_1.bound];
            _changeFieldType_decorators = [rx_store_core_1.bound];
            _resetFormDatum_decorators = [rx_store_core_1.bound];
            _resetFormAll_decorators = [rx_store_core_1.bound];
            _touchFormField_decorators = [rx_store_core_1.bound];
            _emptyFormField_decorators = [rx_store_core_1.bound];
            _focusFormField_decorators = [rx_store_core_1.bound];
            _appendFormData_decorators = [rx_store_core_1.bound];
            _removeFormData_decorators = [rx_store_core_1.bound];
            _setMetadata_decorators = [rx_store_core_1.bound];
            _setMetaByField_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _selector_decorators, { kind: "method", name: "selector", static: false, private: false, access: { has: function (obj) { return "selector" in obj; }, get: function (obj) { return obj.selector; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getMeta_decorators, { kind: "method", name: "getMeta", static: false, private: false, access: { has: function (obj) { return "getMeta" in obj; }, get: function (obj) { return obj.getMeta; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getClonedMetaByField_decorators, { kind: "method", name: "getClonedMetaByField", static: false, private: false, access: { has: function (obj) { return "getClonedMetaByField" in obj; }, get: function (obj) { return obj.getClonedMetaByField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldMeta_decorators, { kind: "method", name: "getFieldMeta", static: false, private: false, access: { has: function (obj) { return "getFieldMeta" in obj; }, get: function (obj) { return obj.getFieldMeta; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldsMeta_decorators, { kind: "method", name: "getFieldsMeta", static: false, private: false, access: { has: function (obj) { return "getFieldsMeta" in obj; }, get: function (obj) { return obj.getFieldsMeta; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMeta_decorators, { kind: "method", name: "observeMeta", static: false, private: false, access: { has: function (obj) { return "observeMeta" in obj; }, get: function (obj) { return obj.observeMeta; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMetaByField_decorators, { kind: "method", name: "observeMetaByField", static: false, private: false, access: { has: function (obj) { return "observeMetaByField" in obj; }, get: function (obj) { return obj.observeMetaByField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _startValidation_decorators, { kind: "method", name: "startValidation", static: false, private: false, access: { has: function (obj) { return "startValidation" in obj; }, get: function (obj) { return obj.startValidation; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFormDatum_decorators, { kind: "method", name: "changeFormDatum", static: false, private: false, access: { has: function (obj) { return "changeFormDatum" in obj; }, get: function (obj) { return obj.changeFormDatum; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _hoverFormField_decorators, { kind: "method", name: "hoverFormField", static: false, private: false, access: { has: function (obj) { return "hoverFormField" in obj; }, get: function (obj) { return obj.hoverFormField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFieldType_decorators, { kind: "method", name: "changeFieldType", static: false, private: false, access: { has: function (obj) { return "changeFieldType" in obj; }, get: function (obj) { return obj.changeFieldType; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormDatum_decorators, { kind: "method", name: "resetFormDatum", static: false, private: false, access: { has: function (obj) { return "resetFormDatum" in obj; }, get: function (obj) { return obj.resetFormDatum; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormAll_decorators, { kind: "method", name: "resetFormAll", static: false, private: false, access: { has: function (obj) { return "resetFormAll" in obj; }, get: function (obj) { return obj.resetFormAll; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _touchFormField_decorators, { kind: "method", name: "touchFormField", static: false, private: false, access: { has: function (obj) { return "touchFormField" in obj; }, get: function (obj) { return obj.touchFormField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _emptyFormField_decorators, { kind: "method", name: "emptyFormField", static: false, private: false, access: { has: function (obj) { return "emptyFormField" in obj; }, get: function (obj) { return obj.emptyFormField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _focusFormField_decorators, { kind: "method", name: "focusFormField", static: false, private: false, access: { has: function (obj) { return "focusFormField" in obj; }, get: function (obj) { return obj.focusFormField; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _appendFormData_decorators, { kind: "method", name: "appendFormData", static: false, private: false, access: { has: function (obj) { return "appendFormData" in obj; }, get: function (obj) { return obj.appendFormData; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _removeFormData_decorators, { kind: "method", name: "removeFormData", static: false, private: false, access: { has: function (obj) { return "removeFormData" in obj; }, get: function (obj) { return obj.removeFormData; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetadata_decorators, { kind: "method", name: "setMetadata", static: false, private: false, access: { has: function (obj) { return "setMetadata" in obj; }, get: function (obj) { return obj.setMetadata; } } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetaByField_decorators, { kind: "method", name: "setMetaByField", static: false, private: false, access: { has: function (obj) { return "setMetaByField" in obj; }, get: function (obj) { return obj.setMetaByField; } } }, null, _instanceExtraInitializers);
        })(),
        _a;
}();
exports.default = FormControllerImpl;
