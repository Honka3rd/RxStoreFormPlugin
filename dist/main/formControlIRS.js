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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmutableFormControllerImpl = void 0;
var rx_store_types_1 = require("rx-store-types");
var interfaces_1 = require("./interfaces");
var immutable_1 = require("immutable");
var rxjs_1 = require("rxjs");
var ImmutableFormControllerImpl = /** @class */ (function (_super) {
    __extends(ImmutableFormControllerImpl, _super);
    function ImmutableFormControllerImpl(id, validator, asyncValidator) {
        var _this = _super.call(this, id) || this;
        _this.validator = validator;
        _this.asyncValidator = asyncValidator;
        _this.getAsyncFields = function (connector) {
            return connector
                .getState(_this.id)
                .filter(function (datum) { return datum.get("type") === interfaces_1.DatumType.ASYNC; })
                .map(function (datum) { return datum.get("field"); });
        };
        _this.initiator = function (connector) {
            if (connector && !_this.connector) {
                _this.connector = connector;
                _this.metadata$ = new rxjs_1.BehaviorSubject(connector.getState(_this.selector()));
                return;
            }
            if (_this.fields) {
                return (0, immutable_1.List)(_this.fields.map(function (_a) {
                    var field = _a.field, defaultValue = _a.defaultValue, type = _a.type;
                    return (0, immutable_1.Map)({
                        field: field,
                        touched: false,
                        empty: true,
                        changed: false,
                        hovered: false,
                        focused: false,
                        value: defaultValue,
                        type: type ? type : interfaces_1.DatumType.SYNC,
                    });
                }));
            }
            return (0, immutable_1.List)([]);
        };
        return _this;
    }
    ImmutableFormControllerImpl.prototype.removeDataByFields = function (fields, data) {
        return data.withMutations(function (mutation) {
            fields.forEach(function (f) {
                mutation.remove(mutation.findIndex(function (m) {
                    return f === m.get("field");
                }));
            });
        });
    };
    ImmutableFormControllerImpl.prototype.commitMutation = function (data, connector) {
        var _a;
        connector.setState((_a = {}, _a[this.id] = data, _a));
    };
    ImmutableFormControllerImpl.prototype.findDatumByField = function (data, field) {
        return data.find(function (datum) { return datum.get("field") === field; });
    };
    ImmutableFormControllerImpl.prototype.appendDataByFields = function (fields, data) {
        return data.withMutations(function (mutation) {
            fields.forEach(function (_a) {
                var defaultValue = _a.defaultValue, field = _a.field, type = _a.type;
                var datum = (0, immutable_1.Map)({
                    field: field,
                    touched: false,
                    empty: true,
                    changed: false,
                    hovered: false,
                    focused: false,
                    value: defaultValue,
                    type: type ? type : interfaces_1.DatumType.SYNC,
                });
                mutation.push(datum);
            });
        });
    };
    ImmutableFormControllerImpl.prototype.cast = function (connector) {
        var casted = connector;
        return casted;
    };
    ImmutableFormControllerImpl.prototype.getDatumIndex = function (field, casted) {
        var targetIndex = casted
            .getState(this.id)
            .findIndex(function (datum) { return datum.get("field") === field; });
        return targetIndex;
    };
    ImmutableFormControllerImpl.prototype.validatorExecutor = function (connector) {
        var _this = this;
        return connector.observe(this.id, function (formData) {
            var meta = _this.validator(formData, _this.getMeta());
            _this.setMetadata(meta);
        });
    };
    ImmutableFormControllerImpl.prototype.isPromise = function ($async) {
        return $async instanceof Promise;
    };
    ImmutableFormControllerImpl.prototype.setAsyncState = function (state) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var prevFormData = casted.getState(_this.id);
            var updated = prevFormData.withMutations(function (mutation) {
                _this.getAsyncFields(casted).forEach(function (field) {
                    var _a;
                    var castedField = field;
                    var foundIndex = mutation.findIndex(function (d) { return d.get("field") === castedField; });
                    var updatedDatum = (_a = mutation
                        .get(foundIndex)) === null || _a === void 0 ? void 0 : _a.set("asyncState", state);
                    updatedDatum && mutation.set(foundIndex, updatedDatum);
                });
            });
            _this.commitMutation(updated, casted);
        });
    };
    ImmutableFormControllerImpl.prototype.getExcludedMeta = function (connector) {
        var excluded = connector
            .getState(this.id)
            .filter(function (datum) { return datum.get("type") === interfaces_1.DatumType.EXCLUDED; })
            .map(function (datum) { return datum.get("field"); });
        return this.getFieldsMeta(excluded.toJS());
    };
    ImmutableFormControllerImpl.prototype.asyncValidatorExecutor = function (connector) {
        var _this = this;
        if (!this.asyncValidator) {
            return;
        }
        var subscription = connector
            .getDataSource()
            .pipe((0, rxjs_1.map)(function (states) { return states[_this.id]; }), (0, rxjs_1.distinctUntilChanged)(function (var1, var2) { return (0, immutable_1.is)(var1, var2); }), (0, rxjs_1.map)(function (formData) {
            return formData.filter(function (datum) { return datum.get("type") === interfaces_1.DatumType.ASYNC; });
        }), (0, rxjs_1.switchMap)(function (asyncFormData) {
            var oldMeta = _this.getMeta();
            if (!asyncFormData.size) {
                return (0, rxjs_1.of)(oldMeta);
            }
            _this.setAsyncState(interfaces_1.AsyncState.PENDING);
            var async$ = _this.asyncValidator(asyncFormData, oldMeta);
            var reduced$ = _this.isPromise(async$) ? (0, rxjs_1.from)(async$) : async$;
            return reduced$.pipe((0, rxjs_1.catchError)(function () {
                return (0, rxjs_1.of)({
                    success: false,
                    meta: _this.getMeta(),
                });
            }), (0, rxjs_1.map)(function (meta) {
                if ("success" in meta && !meta.success) {
                    return meta;
                }
                var m = meta;
                return { success: true, meta: m };
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
                return (0, immutable_1.merge)(_this.getMeta(), meta, _this.getExcludedMeta(connector));
            }));
        }))
            .subscribe(function (meta) {
            _this.setMetadata(meta);
        });
        return function () { return subscription.unsubscribe(); };
    };
    ImmutableFormControllerImpl.prototype.resetFormDatum = function (field) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var defaultDatum = _this.findDatumByField(_this.initiator(), field);
            var indexToReset = _this.getDatumIndex(field, casted);
            if (defaultDatum) {
                if (indexToReset > -1) {
                    _this.commitMutation(casted.getState(_this.id).set(indexToReset, defaultDatum), casted);
                }
                return;
            }
            _this.commitMutation(casted.getState(_this.id).splice(indexToReset, 1), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.resetFormAll = function () {
        var _this = this;
        this.safeExecute(function (connector) {
            connector.reset(_this.id);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.appendFormData = function (fields) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var data = _this.appendDataByFields(fields, casted.getState(_this.id));
            _this.commitMutation(data, casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.removeFormData = function (fields) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var removed = _this.removeDataByFields(fields, casted.getState(_this.id));
            _this.commitMutation(removed, casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.setMetadata = function (meta) {
        var _this = this;
        this.safeExecute(function () {
            var _a;
            (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.setMetaByField = function (field, metaOne) {
        var _this = this;
        this.safeExecute(function () {
            var _a;
            var meta = _this.getMeta();
            var single = (0, immutable_1.fromJS)(__assign({}, metaOne));
            (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta.set(field, single));
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.setFields = function (fields) {
        if (!this.fields) {
            this.fields = fields;
        }
    };
    ImmutableFormControllerImpl.prototype.observeMeta = function (callback) {
        var _a;
        var subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.distinctUntilChanged)(function (var1, var2) { return var1.equals(var2); })).subscribe(callback);
        return function () { return subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe(); };
    };
    ImmutableFormControllerImpl.prototype.observeMetaByField = function (field, callback) {
        var _a;
        var subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.map)(function (meta) { return meta.get(field); }), (0, rxjs_1.distinctUntilChanged)(function (var1, var2) { return (0, immutable_1.is)(var1, var2); })).subscribe(function (single) {
            if (single) {
                callback(single);
            }
        });
        return function () { return subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe(); };
    };
    ImmutableFormControllerImpl.prototype.getFieldMeta = function (field) {
        var _this = this;
        return this.safeExecute(function () {
            var _a;
            return (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.value.get(field);
        });
    };
    ImmutableFormControllerImpl.prototype.changeFieldType = function (field, type) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            if (targetIndex >= 0) {
                var mutation = casted
                    .getState(_this.id)
                    .get(targetIndex)
                    .set("type", type);
                _this.commitMutation(casted.getState(_this.id).set(targetIndex, mutation), casted);
            }
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.getFieldsMeta = function (fields) {
        var _this = this;
        return (0, immutable_1.Map)().withMutations(function (mutation) {
            fields.forEach(function (field) {
                mutation.set(field, _this.getFieldMeta(field));
            });
        });
    };
    ImmutableFormControllerImpl.prototype.setAsyncValidator = function (asyncValidator) {
        if (!this.asyncValidator) {
            this.asyncValidator = asyncValidator;
        }
    };
    ImmutableFormControllerImpl.prototype.changeFormValue = function (field, value) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            var mutation = casted
                .getState(_this.id)
                .get(targetIndex)
                .set("value", value);
            _this.commitMutation(casted.getState(_this.id).set(targetIndex, mutation), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.touchFormField = function (field, touchOrNot) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            var mutation = casted
                .getState(_this.id)
                .get(targetIndex)
                .set("touched", touchOrNot);
            _this.commitMutation(casted.getState(_this.id).set(targetIndex, mutation), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.emptyFormField = function (field) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            var defaultDatum = _this.findDatumByField(_this.initiator(), field);
            if (defaultDatum) {
                _this.commitMutation(casted.getState(_this.id).set(targetIndex, defaultDatum), casted);
                return;
            }
            _this.commitMutation(casted.getState(_this.id).splice(targetIndex, 1), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.focusFormField = function (field, focusOrNot) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            var mutation = casted
                .getState(_this.id)
                .get(targetIndex)
                .set("focused", focusOrNot);
            _this.commitMutation(casted.getState(_this.id).set(targetIndex, mutation), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.hoverFormField = function (field, hoverOrNot) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var targetIndex = _this.getDatumIndex(field, casted);
            var mutation = casted
                .getState(_this.id)
                .get(targetIndex)
                .set("hovered", hoverOrNot);
            _this.commitMutation(casted.getState(_this.id).set(targetIndex, mutation), casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.startValidation = function () {
        var _this = this;
        return this.safeExecute(function (connector) {
            var casted = _this.cast(connector);
            var stopValidation = _this.validatorExecutor(casted);
            var stopAsyncValidation = _this.asyncValidatorExecutor(casted);
            return function () {
                stopValidation === null || stopValidation === void 0 ? void 0 : stopValidation();
                stopAsyncValidation === null || stopAsyncValidation === void 0 ? void 0 : stopAsyncValidation();
            };
        });
    };
    ImmutableFormControllerImpl.prototype.getMeta = function () {
        var _a;
        return (0, immutable_1.Map)((_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.value);
    };
    return ImmutableFormControllerImpl;
}(rx_store_types_1.PluginImpl));
exports.ImmutableFormControllerImpl = ImmutableFormControllerImpl;
