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
exports.ImmutableFormControllerImpl = void 0;
const rx_store_types_1 = require("rx-store-types");
const interfaces_1 = require("./interfaces");
const immutable_1 = require("immutable");
const rxjs_1 = require("rxjs");
const rx_store_core_1 = require("rx-store-core");
exports.ImmutableFormControllerImpl = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _getFormData_decorators;
    let _resetFormDatum_decorators;
    let _resetFormAll_decorators;
    let _appendFormData_decorators;
    let _removeFormData_decorators;
    let _setMetadata_decorators;
    let _setMetaByField_decorators;
    let _observeMeta_decorators;
    let _observeMetaByField_decorators;
    let _observeFormData_decorators;
    let _observeFormDatum_decorators;
    let _observeFormValue_decorators;
    let _getDatum_decorators;
    let _getDatumValue_decorators;
    let _getFieldMeta_decorators;
    let _changeFieldType_decorators;
    let _getFieldsMeta_decorators;
    let _setAsyncValidator_decorators;
    let _changeFormValue_decorators;
    let _touchFormField_decorators;
    let _emptyFormField_decorators;
    let _focusFormField_decorators;
    let _hoverFormField_decorators;
    let _startValidation_decorators;
    let _getMeta_decorators;
    return _a = class ImmutableFormControllerImpl extends rx_store_types_1.PluginImpl {
            constructor(id, validator, asyncValidator) {
                super(id);
                this.validator = (__runInitializers(this, _instanceExtraInitializers), validator);
                this.asyncValidator = asyncValidator;
                this.asyncConfig = {
                    lazy: false,
                    debounceDuration: 0,
                };
                this.getAsyncFields = (connector) => {
                    return connector
                        .getState(this.id)
                        .filter((datum) => datum.get("type") === interfaces_1.DatumType.ASYNC)
                        .map((datum) => datum.get("field"));
                };
                this.initiator = (connector) => {
                    if (connector && !this.connector) {
                        this.connector = connector;
                        this.metadata$ = new rxjs_1.BehaviorSubject(this.defaultMeta ? this.defaultMeta : this.getMeta());
                        return;
                    }
                    if (this.fields) {
                        return (0, immutable_1.List)(this.fields.map(({ field, defaultValue, type }) => (0, immutable_1.Map)({
                            field,
                            touched: false,
                            empty: true,
                            changed: false,
                            hovered: false,
                            focused: false,
                            value: defaultValue,
                            type: type ? type : interfaces_1.DatumType.SYNC,
                        })));
                    }
                    return (0, immutable_1.List)([]);
                };
            }
            setFields(fields) {
                if (!this.fields) {
                    this.fields = fields;
                }
            }
            setDefaultMeta(meta) {
                this.defaultMeta = (0, immutable_1.fromJS)(meta);
            }
            setAsyncConfig(cfg) {
                this.asyncConfig = cfg;
            }
            removeDataByFields(fields, data) {
                return data.withMutations((mutation) => {
                    fields.forEach((f) => {
                        mutation.remove(mutation.findIndex((m) => {
                            return f === m.get("field");
                        }));
                    });
                });
            }
            commitMutation(data, connector) {
                connector.setState({ [this.id]: data });
            }
            findDatumByField(data, field) {
                return data.find((datum) => datum.get("field") === field);
            }
            appendDataByFields(fields, data) {
                return data.withMutations((mutation) => {
                    fields.forEach(({ defaultValue, field, type }) => {
                        const datum = (0, immutable_1.Map)({
                            field,
                            touched: false,
                            changed: false,
                            hovered: false,
                            focused: false,
                            value: defaultValue,
                            type: type ? type : interfaces_1.DatumType.SYNC,
                        });
                        mutation.push(datum);
                    });
                });
            }
            cast(connector) {
                const casted = connector;
                return casted;
            }
            getDatumIndex(field, casted) {
                const targetIndex = casted
                    .getState(this.id)
                    .findIndex((datum) => datum.get("field") === field);
                return targetIndex;
            }
            validatorExecutor(connector) {
                return connector.observe(this.id, (formData) => {
                    const meta = this.validator(formData, this.getMeta());
                    this.setMetadata(meta);
                });
            }
            isPromise($async) {
                return $async instanceof Promise;
            }
            setAsyncState(state) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const prevFormData = casted.getState(this.id);
                    const updated = prevFormData.withMutations((mutation) => {
                        this.getAsyncFields(casted).forEach((field) => {
                            var _a;
                            const castedField = field;
                            const foundIndex = mutation.findIndex((d) => d.get("field") === castedField);
                            const updatedDatum = (_a = mutation
                                .get(foundIndex)) === null || _a === void 0 ? void 0 : _a.set("asyncState", state);
                            updatedDatum && mutation.set(foundIndex, updatedDatum);
                        });
                    });
                    this.commitMutation(updated, casted);
                });
            }
            getExcludedMeta(connector) {
                const excluded = connector
                    .getState(this.id)
                    .filter((datum) => datum.get("type") === interfaces_1.DatumType.EXCLUDED)
                    .map((datum) => datum.get("field"));
                return this.getFieldsMeta(excluded);
            }
            asyncValidatorExecutor(connector) {
                if (!this.asyncValidator) {
                    return;
                }
                const connect = this.asyncConfig.lazy ? rxjs_1.exhaustMap : rxjs_1.switchMap;
                const subscription = connector
                    .getDataSource()
                    .pipe((0, rxjs_1.debounceTime)(this.asyncConfig.debounceDuration), (0, rxjs_1.map)((states) => states[this.id]
                    .filter((datum) => datum.get("type") === interfaces_1.DatumType.ASYNC)
                    .map((datum) => (0, immutable_1.Map)({
                    value: datum.get("value"),
                    changed: datum.get("changed"),
                    focused: datum.get("focused"),
                    field: datum.get("field"),
                    type: datum.get("type"),
                    hovered: datum.get("hovered"),
                    touched: datum.get("touched"),
                }))), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)), connect((formData) => {
                    const oldMeta = this.getMeta();
                    if (!formData.size) {
                        return (0, rxjs_1.of)(oldMeta);
                    }
                    this.setAsyncState(interfaces_1.AsyncState.PENDING);
                    const async$ = this.asyncValidator(this.getFormData(), oldMeta);
                    const reduced$ = this.isPromise(async$) ? (0, rxjs_1.from)(async$) : async$;
                    return reduced$.pipe((0, rxjs_1.catchError)(() => {
                        return (0, rxjs_1.of)({
                            success: false,
                            meta: this.getMeta(),
                        });
                    }), (0, rxjs_1.map)((meta) => {
                        if ("success" in meta && !meta.success) {
                            return meta;
                        }
                        const m = meta;
                        return { success: true, meta: m };
                    }), (0, rxjs_1.tap)(({ success }) => {
                        if (success) {
                            this.setAsyncState(interfaces_1.AsyncState.DONE);
                            return;
                        }
                        this.setAsyncState(interfaces_1.AsyncState.ERROR);
                    }), (0, rxjs_1.map)(({ meta, success }) => {
                        if (!success) {
                            return meta;
                        }
                        return (0, immutable_1.merge)(this.getMeta(), meta, this.getExcludedMeta(connector));
                    }));
                }))
                    .subscribe((meta) => {
                    this.setMetadata(meta);
                });
                return () => subscription.unsubscribe();
            }
            getFormData(fields) {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const form = casted.getState(this.id);
                    if (fields) {
                        const reduced = (0, immutable_1.List)(fields.reduce((acc, next) => {
                            const found = form.find((f) => f.get("field") === next);
                            if (found) {
                                acc.push(found);
                            }
                            return acc;
                        }, []));
                        return reduced;
                    }
                    return form;
                });
            }
            resetFormDatum(field) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const defaultDatum = this.findDatumByField(this.initiator(), field);
                    const indexToReset = this.getDatumIndex(field, casted);
                    if (defaultDatum) {
                        if (indexToReset > -1) {
                            this.commitMutation(casted.getState(this.id).set(indexToReset, defaultDatum), casted);
                        }
                        return;
                    }
                    this.commitMutation(casted.getState(this.id).splice(indexToReset, 1), casted);
                });
                return this;
            }
            resetFormAll() {
                this.safeExecute((connector) => {
                    connector.reset(this.id);
                });
                return this;
            }
            appendFormData(fields) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const data = this.appendDataByFields(fields, casted.getState(this.id));
                    this.commitMutation(data, casted);
                });
                return this;
            }
            removeFormData(fields) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const removed = this.removeDataByFields(fields, casted.getState(this.id));
                    this.commitMutation(removed, casted);
                });
                return this;
            }
            setMetadata(meta) {
                this.safeExecute(() => {
                    var _a;
                    (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta);
                });
                return this;
            }
            setMetaByField(field, metaOne) {
                this.safeExecute(() => {
                    var _a;
                    const meta = this.getMeta();
                    const single = (0, immutable_1.fromJS)(Object.assign({}, metaOne));
                    (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta.set(field, single));
                });
                return this;
            }
            observeMeta(callback) {
                var _a;
                const subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.distinctUntilChanged)((var1, var2) => var1.equals(var2))).subscribe(callback);
                return () => subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            }
            observeMetaByField(field, callback) {
                var _a;
                const subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.map)((meta) => meta.get(field)), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2))).subscribe((single) => {
                    if (single) {
                        callback(single);
                    }
                });
                return () => subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            }
            observeFormData(observer, fields) {
                const casted = this.cast(this.connector);
                const subscription = casted
                    .getDataSource()
                    .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => {
                    if (!fields) {
                        return form;
                    }
                    return (0, immutable_1.List)(fields.reduce((acc, next) => {
                        const found = form.find((f) => f.get("field") === next);
                        if (found) {
                            acc.push(found);
                        }
                        return acc;
                    }, []));
                }), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
                    .subscribe(observer);
                return () => subscription.unsubscribe();
            }
            observeFormDatum(field, observer) {
                const subscription = this.cast(this.connector)
                    .getDataSource()
                    .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field)), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
                    .subscribe(observer);
                return () => subscription.unsubscribe();
            }
            observeFormValue(field, observer) {
                const subscription = this.cast(this.connector)
                    .getDataSource()
                    .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field).get("value")), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
                    .subscribe(observer);
                return () => subscription.unsubscribe();
            }
            getDatum(field) {
                const casted = this.cast(this.connector);
                return this.findDatumByField(casted.getState(this.id), field);
            }
            getDatumValue(field) {
                const casted = this.cast(this.connector);
                return this.findDatumByField(casted.getState(this.id), field).get("value");
            }
            getFieldMeta(field) {
                return this.safeExecute(() => {
                    var _a;
                    return (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.value.get(field);
                });
            }
            changeFieldType(field, type) {
                this.safeExecute((connector) => {
                    var _a;
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    if (targetIndex >= 0) {
                        const mutation = (_a = casted
                            .getState(this.id)
                            .get(targetIndex)) === null || _a === void 0 ? void 0 : _a.set("type", type);
                        mutation &&
                            this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
                    }
                });
                return this;
            }
            getFieldsMeta(fields) {
                return (0, immutable_1.Map)().withMutations((mutation) => {
                    fields.forEach((field) => {
                        mutation.set(field, this.getFieldMeta(field));
                    });
                });
            }
            setAsyncValidator(asyncValidator) {
                if (!this.asyncValidator) {
                    this.asyncValidator = asyncValidator;
                }
            }
            changeFormValue(field, value) {
                this.safeExecute((connector) => {
                    var _a;
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    const mutation = (_a = casted
                        .getState(this.id)
                        .get(targetIndex)) === null || _a === void 0 ? void 0 : _a.set("value", value);
                    mutation &&
                        this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
                });
                return this;
            }
            touchFormField(field, touchOrNot) {
                this.safeExecute((connector) => {
                    var _a;
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    const mutation = (_a = casted
                        .getState(this.id)
                        .get(targetIndex)) === null || _a === void 0 ? void 0 : _a.set("touched", touchOrNot);
                    mutation &&
                        this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
                });
                return this;
            }
            emptyFormField(field) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    const defaultDatum = this.findDatumByField(this.initiator(), field);
                    if (defaultDatum) {
                        this.commitMutation(casted.getState(this.id).set(targetIndex, defaultDatum), casted);
                        return;
                    }
                    this.commitMutation(casted.getState(this.id).splice(targetIndex, 1), casted);
                });
                return this;
            }
            focusFormField(field, focusOrNot) {
                this.safeExecute((connector) => {
                    var _a;
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    const mutation = (_a = casted
                        .getState(this.id)
                        .get(targetIndex)) === null || _a === void 0 ? void 0 : _a.set("focused", focusOrNot);
                    mutation &&
                        this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
                });
                return this;
            }
            hoverFormField(field, hoverOrNot) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const targetIndex = this.getDatumIndex(field, casted);
                    const mutation = casted
                        .getState(this.id)
                        .get(targetIndex)
                        .set("hovered", hoverOrNot);
                    this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
                });
                return this;
            }
            startValidation() {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const stopValidation = this.validatorExecutor(casted);
                    const stopAsyncValidation = this.asyncValidatorExecutor(casted);
                    return () => {
                        stopValidation === null || stopValidation === void 0 ? void 0 : stopValidation();
                        stopAsyncValidation === null || stopAsyncValidation === void 0 ? void 0 : stopAsyncValidation();
                    };
                });
            }
            getMeta() {
                var _a;
                return (0, immutable_1.Map)((_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.value);
            }
        },
        (() => {
            _getFormData_decorators = [rx_store_core_1.bound];
            _resetFormDatum_decorators = [rx_store_core_1.bound];
            _resetFormAll_decorators = [rx_store_core_1.bound];
            _appendFormData_decorators = [rx_store_core_1.bound];
            _removeFormData_decorators = [rx_store_core_1.bound];
            _setMetadata_decorators = [rx_store_core_1.bound];
            _setMetaByField_decorators = [rx_store_core_1.bound];
            _observeMeta_decorators = [rx_store_core_1.bound];
            _observeMetaByField_decorators = [rx_store_core_1.bound];
            _observeFormData_decorators = [rx_store_core_1.bound];
            _observeFormDatum_decorators = [rx_store_core_1.bound];
            _observeFormValue_decorators = [rx_store_core_1.bound];
            _getDatum_decorators = [rx_store_core_1.bound];
            _getDatumValue_decorators = [rx_store_core_1.bound];
            _getFieldMeta_decorators = [rx_store_core_1.bound];
            _changeFieldType_decorators = [rx_store_core_1.bound];
            _getFieldsMeta_decorators = [rx_store_core_1.bound];
            _setAsyncValidator_decorators = [rx_store_core_1.bound];
            _changeFormValue_decorators = [rx_store_core_1.bound];
            _touchFormField_decorators = [rx_store_core_1.bound];
            _emptyFormField_decorators = [rx_store_core_1.bound];
            _focusFormField_decorators = [rx_store_core_1.bound];
            _hoverFormField_decorators = [rx_store_core_1.bound];
            _startValidation_decorators = [rx_store_core_1.bound];
            _getMeta_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _getFormData_decorators, { kind: "method", name: "getFormData", static: false, private: false, access: { has: obj => "getFormData" in obj, get: obj => obj.getFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormDatum_decorators, { kind: "method", name: "resetFormDatum", static: false, private: false, access: { has: obj => "resetFormDatum" in obj, get: obj => obj.resetFormDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormAll_decorators, { kind: "method", name: "resetFormAll", static: false, private: false, access: { has: obj => "resetFormAll" in obj, get: obj => obj.resetFormAll } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _appendFormData_decorators, { kind: "method", name: "appendFormData", static: false, private: false, access: { has: obj => "appendFormData" in obj, get: obj => obj.appendFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _removeFormData_decorators, { kind: "method", name: "removeFormData", static: false, private: false, access: { has: obj => "removeFormData" in obj, get: obj => obj.removeFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetadata_decorators, { kind: "method", name: "setMetadata", static: false, private: false, access: { has: obj => "setMetadata" in obj, get: obj => obj.setMetadata } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetaByField_decorators, { kind: "method", name: "setMetaByField", static: false, private: false, access: { has: obj => "setMetaByField" in obj, get: obj => obj.setMetaByField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMeta_decorators, { kind: "method", name: "observeMeta", static: false, private: false, access: { has: obj => "observeMeta" in obj, get: obj => obj.observeMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMetaByField_decorators, { kind: "method", name: "observeMetaByField", static: false, private: false, access: { has: obj => "observeMetaByField" in obj, get: obj => obj.observeMetaByField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormData_decorators, { kind: "method", name: "observeFormData", static: false, private: false, access: { has: obj => "observeFormData" in obj, get: obj => obj.observeFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormDatum_decorators, { kind: "method", name: "observeFormDatum", static: false, private: false, access: { has: obj => "observeFormDatum" in obj, get: obj => obj.observeFormDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormValue_decorators, { kind: "method", name: "observeFormValue", static: false, private: false, access: { has: obj => "observeFormValue" in obj, get: obj => obj.observeFormValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDatum_decorators, { kind: "method", name: "getDatum", static: false, private: false, access: { has: obj => "getDatum" in obj, get: obj => obj.getDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDatumValue_decorators, { kind: "method", name: "getDatumValue", static: false, private: false, access: { has: obj => "getDatumValue" in obj, get: obj => obj.getDatumValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldMeta_decorators, { kind: "method", name: "getFieldMeta", static: false, private: false, access: { has: obj => "getFieldMeta" in obj, get: obj => obj.getFieldMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFieldType_decorators, { kind: "method", name: "changeFieldType", static: false, private: false, access: { has: obj => "changeFieldType" in obj, get: obj => obj.changeFieldType } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldsMeta_decorators, { kind: "method", name: "getFieldsMeta", static: false, private: false, access: { has: obj => "getFieldsMeta" in obj, get: obj => obj.getFieldsMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setAsyncValidator_decorators, { kind: "method", name: "setAsyncValidator", static: false, private: false, access: { has: obj => "setAsyncValidator" in obj, get: obj => obj.setAsyncValidator } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFormValue_decorators, { kind: "method", name: "changeFormValue", static: false, private: false, access: { has: obj => "changeFormValue" in obj, get: obj => obj.changeFormValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _touchFormField_decorators, { kind: "method", name: "touchFormField", static: false, private: false, access: { has: obj => "touchFormField" in obj, get: obj => obj.touchFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _emptyFormField_decorators, { kind: "method", name: "emptyFormField", static: false, private: false, access: { has: obj => "emptyFormField" in obj, get: obj => obj.emptyFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _focusFormField_decorators, { kind: "method", name: "focusFormField", static: false, private: false, access: { has: obj => "focusFormField" in obj, get: obj => obj.focusFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _hoverFormField_decorators, { kind: "method", name: "hoverFormField", static: false, private: false, access: { has: obj => "hoverFormField" in obj, get: obj => obj.hoverFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _startValidation_decorators, { kind: "method", name: "startValidation", static: false, private: false, access: { has: obj => "startValidation" in obj, get: obj => obj.startValidation } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getMeta_decorators, { kind: "method", name: "getMeta", static: false, private: false, access: { has: obj => "getMeta" in obj, get: obj => obj.getMeta } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
//# sourceMappingURL=formControlIRS.js.map