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
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var FormControllerImpl = /** @class */ (function () {
    function FormControllerImpl(formSelector, validator, asyncValidator, fields, metaComparator) {
        this.formSelector = formSelector;
        this.validator = validator;
        this.asyncValidator = asyncValidator;
        this.fields = fields;
        this.metaComparator = metaComparator;
    }
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
            var defaultValue = _a.defaultValue, field = _a.field;
            data.push({
                field: field,
                touched: false,
                empty: true,
                changed: false,
                hovered: false,
                focused: false,
                value: defaultValue,
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
    FormControllerImpl.prototype.asyncValidatorExecutor = function (connector) {
        var _this = this;
        if (!this.asyncValidator) {
            return function () { };
        }
        var subscription = connector
            .getDataSource()
            .pipe((0, rxjs_1.distinctUntilChanged)(connector.comparator), (0, rxjs_1.switchMap)(function (formData) {
            var async$ = _this.asyncValidator(formData);
            if (async$ instanceof Promise) {
                return (0, rxjs_1.from)(async$);
            }
            return async$;
        }))
            .subscribe(function (meta) { return _this.safeCommitMeta(meta); });
        return function () { return subscription.unsubscribe(); };
    };
    FormControllerImpl.prototype.getFormSelector = function () {
        return this.formSelector;
    };
    FormControllerImpl.prototype.observeMeta = function (callback) {
        var _a;
        var subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.distinctUntilChanged)(this.metaComparator)).subscribe(callback);
        return function () { return subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe(); };
    };
    FormControllerImpl.prototype.startObserve = function (callback) {
        var _this = this;
        this.safeExecute(function (connector) {
            _this.unobserve = _this.validatorExecutor(connector);
            _this.unobserveAsync = _this.asyncValidatorExecutor(connector);
            _this.unobserveMeta = _this.observeMeta(callback);
        });
        return this;
    };
    FormControllerImpl.prototype.stopObserve = function () {
        var _a, _b, _c;
        (_a = this.unobserve) === null || _a === void 0 ? void 0 : _a.call(this);
        (_b = this.unobserveAsync) === null || _b === void 0 ? void 0 : _b.call(this);
        (_c = this.unobserveMeta) === null || _c === void 0 ? void 0 : _c.call(this);
    };
    FormControllerImpl.prototype.initiator = function (connector) {
        if (connector && !this.connector) {
            this.connector = connector;
            this.metadata$ = new rxjs_1.BehaviorSubject(this.validator(connector.getState(this.formSelector)));
        }
        if (this.fields) {
            return this.fields.map(function (_a) {
                var field = _a.field, defaultValue = _a.defaultValue;
                return ({
                    field: field,
                    touched: false,
                    empty: true,
                    changed: false,
                    hovered: false,
                    focused: false,
                    value: defaultValue,
                });
            });
        }
        return [];
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
                return;
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
    FormControllerImpl.prototype.createFormDatum = function (fields) {
        var _this = this;
        return this.safeExecute(function (connector) {
            return _this.safeClone(function (data) {
                _this.appendDataByFields(fields, data);
                return data;
            });
        });
    };
    FormControllerImpl.prototype.fieldsDiff = function (fields) {
        var _this = this;
        var _a;
        var created = [];
        var removed = [];
        fields.forEach(function (datum) {
            var _a;
            if (!Boolean((_a = _this.fields) === null || _a === void 0 ? void 0 : _a.find(function (f) { return f.field === datum.field; }))) {
                created.push(datum);
            }
        });
        (_a = this.fields) === null || _a === void 0 ? void 0 : _a.forEach(function (datum) {
            if (!Boolean(fields === null || fields === void 0 ? void 0 : fields.find(function (f) { return f.field === datum.field; }))) {
                removed.push(datum.field);
            }
        });
        return {
            created: created,
            removed: removed,
        };
    };
    FormControllerImpl.prototype.updateFormFields = function (fields) {
        var _this = this;
        var _a = this.fieldsDiff(fields), created = _a.created, removed = _a.removed;
        var createdData = this.createFormDatum(created);
        this.safeExecute(function (connector) {
            var formData = connector.getClonedState(_this.formSelector);
            removed.forEach(function (field) {
                var delIndex = formData.findIndex(function (f) { return f.field === field; });
                if (delIndex > -1) {
                    formData.splice(formData.findIndex(function (f) { return f.field === field; }), 1);
                }
            });
            createdData === null || createdData === void 0 ? void 0 : createdData.forEach(function (datum) {
                formData.push(datum);
            });
            _this.commitMutation(formData, connector);
        });
        return this;
    };
    return FormControllerImpl;
}());
exports.default = FormControllerImpl;
