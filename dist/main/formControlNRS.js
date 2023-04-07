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
var interfaces_1 = require("./interfaces");
var rxjs_1 = require("rxjs");
var FormControllerImpl = /** @class */ (function () {
    function FormControllerImpl(formSelector, validator, asyncValidator, fields, metaComparator, metaComparatorMap, cloneFunction, cloneFunctionMap) {
        var _this = this;
        this.formSelector = formSelector;
        this.validator = validator;
        this.asyncValidator = asyncValidator;
        this.fields = fields;
        this.metaComparator = metaComparator;
        this.metaComparatorMap = metaComparatorMap;
        this.cloneFunction = cloneFunction;
        this.cloneFunctionMap = cloneFunctionMap;
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
    };
    FormControllerImpl.prototype.removeFormData = function (fields) {
        var _this = this;
        this.safeExecute(function (connector) {
            var data = connector.getClonedState(_this.formSelector);
            _this.removeDataByFields(fields, data);
            _this.commitMutation(data, connector);
        });
    };
    FormControllerImpl.prototype.setMetadata = function (meta) {
        var _this = this;
        this.safeExecute(function () {
            var _a;
            (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(__assign(__assign({}, _this.metadata$.value), meta));
        });
    };
    FormControllerImpl.prototype.setMetaByField = function (field, metaOne) {
        var _this = this;
        this.safeExecute(function () {
            var _a;
            var meta = _this.getMeta();
            meta[field] = metaOne;
            (_a = _this.metadata$) === null || _a === void 0 ? void 0 : _a.next(__assign({}, meta));
        });
    };
    return FormControllerImpl;
}());
exports.default = FormControllerImpl;
