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
    function ImmutableFormControllerImpl(id, validator) {
        var _this = _super.call(this, id) || this;
        _this.validator = validator;
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
    ImmutableFormControllerImpl.prototype.resetFormDatum = function (field) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = connector;
            var defaultDatum = _this.findDatumByField(_this.initiator(), field);
            if (defaultDatum) {
                var indexToReset = casted
                    .getState(_this.id)
                    .findIndex(function (im) { return im.get("field") === field; });
                if (indexToReset > -1) {
                    _this.commitMutation(casted.getState(_this.id).set(indexToReset, defaultDatum), casted);
                }
            }
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
            var casted = connector;
            var data = _this.appendDataByFields(fields, casted.getState(_this.id));
            _this.commitMutation(data, casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.removeFormData = function (fields) {
        var _this = this;
        this.safeExecute(function (connector) {
            var casted = connector;
            var removed = _this.removeDataByFields(fields, casted.getState(_this.id));
            _this.commitMutation(removed, casted);
        });
        return this;
    };
    ImmutableFormControllerImpl.prototype.setMetadata = function (meta) {
        var _this = this;
        this.safeExecute(function () {
            var _a;
            var casted = (0, immutable_1.fromJS)(meta);
            (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(casted);
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
            var casted = connector;
            var targetIndex = casted
                .getState(_this.id)
                .findIndex(function (datum) { return datum.get("field") === field; });
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
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.setAsyncValidator = function (asyncValidator) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.changeFormDatum = function (field, touchOrNot) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.touchFormField = function (field, touchOrNot) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.emptyFormField = function (field) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.focusFormField = function (field, focusOrNot) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.hoverFormField = function (field, hoverOrNot) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.asyncValidator = function (formData) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.startValidation = function (callback) {
        throw new Error("Method not implemented.");
    };
    ImmutableFormControllerImpl.prototype.getMeta = function () {
        throw new Error("Method not implemented.");
    };
    return ImmutableFormControllerImpl;
}(rx_store_types_1.PluginImpl));
exports.ImmutableFormControllerImpl = ImmutableFormControllerImpl;
