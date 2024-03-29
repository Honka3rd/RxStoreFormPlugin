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
const rx_store_core_1 = require("rx-store-core");
const rx_store_types_1 = require("rx-store-types");
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
let FormControllerImpl = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _safeCommitMeta_decorators;
    let _cloneMeta_decorators;
    let _getFormData_decorators;
    let _getMeta_decorators;
    let _getDatum_decorators;
    let _getDatumValue_decorators;
    let _getClonedMetaByField_decorators;
    let _getClonedMeta_decorators;
    let _getFieldMeta_decorators;
    let _getFieldsMeta_decorators;
    let _observeMeta_decorators;
    let _observeMetaByField_decorators;
    let _observeMetaByFields_decorators;
    let _observeFormDatum_decorators;
    let _observeFormValue_decorators;
    let _observeFormData_decorators;
    let _startValidation_decorators;
    let _changeFormValue_decorators;
    let _hoverFormField_decorators;
    let _changeFieldType_decorators;
    let _resetFormDatum_decorators;
    let _resetFormAll_decorators;
    let _touchFormField_decorators;
    let _emptyFormField_decorators;
    let _focusFormField_decorators;
    let _appendFormData_decorators;
    let _removeFormData_decorators;
    let _setMetadata_decorators;
    let _setMetaByField_decorators;
    let _toFormData_decorators;
    return _a = class FormControllerImpl extends rx_store_types_1.PluginImpl {
            constructor(id, validator, subscriptions) {
                super(id);
                this.validator = (__runInitializers(this, _instanceExtraInitializers), validator);
                this.subscriptions = subscriptions;
                this.asyncConfig = {
                    lazy: false,
                    debounceDuration: 0,
                };
                this.initiator = (connector) => {
                    if (connector && !this.connector) {
                        this.connector = connector;
                        this.metadata$ = new rxjs_1.BehaviorSubject(this.validator(connector.getState(this.id), this.defaultMeta ? this.defaultMeta : this.getMeta()));
                        return;
                    }
                    if (this.fields) {
                        return this.fields.map(({ field, defaultValue, type, lazy }) => ({
                            field,
                            touched: false,
                            changed: false,
                            hovered: false,
                            focused: false,
                            value: defaultValue,
                            type: type ? type : interfaces_1.DatumType.SYNC,
                            lazy,
                        }));
                    }
                    return [];
                };
            }
            setBulkAsyncValidator(asyncValidator) {
                if (!this.asyncValidator) {
                    this.asyncValidator = asyncValidator;
                }
            }
            getFieldSource(field, datumKeys = [], comparator) {
                return this.cast(this.connector)
                    .getDataSource()
                    .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.distinctUntilChanged)(this.getComparator(this.cast(this.connector))), (0, rxjs_1.map)((formData) => formData.find((f) => f.field === field)), ...datumKeys.map((key) => (0, rxjs_1.distinctUntilKeyChanged)(key)), (0, rxjs_1.distinctUntilChanged)(comparator));
            }
            getSingleSource($validator, fieldData) {
                const source = $validator(fieldData, () => this.cloneMeta(this.getMeta()), this.getFormData);
                return source instanceof Promise ? (0, rxjs_1.from)(source) : source;
            }
            connect(lazy) {
                return lazy ? rxjs_1.exhaustMap : rxjs_1.switchMap;
            }
            listenToExcludedAll(fields) {
                this.subscriptions.pushAll(fields
                    .filter(({ type, $validator }) => type === interfaces_1.DatumType.EXCLUDED && $validator)
                    .map(({ field, $validator, lazy, debounceDuration, datumKeys, comparator, }) => ({
                    id: field,
                    subscription: this.getFieldSource(field, datumKeys, comparator)
                        .pipe((0, rxjs_1.debounceTime)(Number(debounceDuration)), (0, rxjs_1.tap)(() => {
                        this.commitMetaAsyncIndicator([field], interfaces_1.AsyncState.PENDING);
                    }), this.connect(lazy)((fieldData) => (0, rxjs_1.iif)(() => Boolean(fieldData), this.getSingleSource($validator, fieldData), (0, rxjs_1.of)(this.getMeta()))), (0, rxjs_1.catchError)(() => {
                        return (0, rxjs_1.of)(this.getChangedMetaAsync([field], interfaces_1.AsyncState.ERROR));
                    }))
                        .subscribe((meta) => {
                        this.commitMetaAsyncIndicator([field], interfaces_1.AsyncState.DONE, meta, (found) => {
                            return (!(found === null || found === void 0 ? void 0 : found.asyncIndicator) ||
                                found.asyncIndicator === interfaces_1.AsyncState.PENDING);
                        });
                    }),
                })));
            }
            setFields(fields) {
                if (!this.fields) {
                    this.fields = fields;
                }
            }
            getFields() {
                if (!this.fields) {
                    throw new Error("Fields information has not been set");
                }
                return this.fields;
            }
            setMetaComparator(metaComparator) {
                if (!this.metaComparator) {
                    this.metaComparator = metaComparator;
                }
            }
            setMetaComparatorMap(metaComparatorMap) {
                if (!this.metaComparatorMap) {
                    this.metaComparatorMap = metaComparatorMap;
                }
            }
            setMetaCloneFunction(cloneFunction) {
                if (!this.cloneFunction) {
                    this.cloneFunction = cloneFunction;
                }
            }
            setMetaCloneFunctionMap(cloneFunctionMap) {
                if (!this.cloneFunctionMap) {
                    this.cloneFunctionMap = cloneFunctionMap;
                }
            }
            setDefaultMeta(meta) {
                this.defaultMeta = meta;
            }
            setAsyncConfig(cfg) {
                this.asyncConfig = cfg;
            }
            shallowCloneFormData() {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    return casted.getClonedState(this.id);
                });
            }
            safeClone(callback) {
                const cloned = this.shallowCloneFormData();
                if (cloned) {
                    return callback(cloned);
                }
            }
            findDatumByField(data, field) {
                return data.find((datum) => datum.field === field);
            }
            findFromClonedAndExecute(field, cloned, callback) {
                const found = this.findDatumByField(cloned, field);
                if (found) {
                    callback(found);
                }
            }
            commitMutation(data, connector) {
                connector.setState({ [this.id]: data });
            }
            safeCommitMutation(field, callback) {
                this.safeExecute((connector) => {
                    this.safeClone((data) => {
                        this.findFromClonedAndExecute(field, data, (found) => {
                            const cloned = Object.assign({}, found);
                            data.splice(data.indexOf(found), 1, cloned);
                            callback(cloned, data);
                            this.commitMutation(data, this.cast(connector));
                        });
                    });
                });
            }
            safeCommitMeta(meta) {
                this.safeExecute(() => { var _a; return (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.next(meta); });
            }
            removeDataByFields(fields, data) {
                fields.forEach((field) => {
                    data.splice(data.findIndex((d) => d.field === field), 1);
                    this.subscriptions.remove(field);
                });
                fields.forEach((field) => this.subscriptions.remove(field));
            }
            appendDataByFields(fields, data) {
                fields.forEach(({ defaultValue, field, type, lazy, $validator }) => {
                    data.push({
                        field,
                        touched: false,
                        changed: false,
                        hovered: false,
                        focused: false,
                        value: defaultValue,
                        type: type ? type : interfaces_1.DatumType.SYNC,
                        lazy,
                    });
                    if (type === interfaces_1.DatumType.EXCLUDED && $validator) {
                        this.listenToExcludedAll([
                            {
                                field,
                                type,
                                $validator,
                            },
                        ]);
                    }
                });
            }
            validatorExecutor(connector) {
                return connector.observe(this.id, (formData) => {
                    const meta = this.validator(formData, this.getMeta());
                    this.safeCommitMeta(meta);
                });
            }
            getExcludedFields(connector) {
                return connector
                    .getState(this.id)
                    .filter(({ type }) => type === interfaces_1.DatumType.EXCLUDED)
                    .map(({ field }) => field);
            }
            getExcludedMeta(connector) {
                const excluded = this.getExcludedFields(connector);
                return this.getFieldsMeta(excluded);
            }
            getComparator(connector) {
                if (this.asyncConfig.compare) {
                    return this.asyncConfig.compare;
                }
                const comparatorMap = connector.getComparatorMap();
                const specCompare = comparatorMap === null || comparatorMap === void 0 ? void 0 : comparatorMap[this.id];
                return specCompare ? specCompare : connector.comparator;
            }
            getChangedMetaAsync(fields, indicator, meta, condition) {
                const reduced = fields.reduce((meta, next) => {
                    const found = meta[next];
                    if (found) {
                        if (condition) {
                            if (condition(found)) {
                                found.asyncIndicator = indicator;
                            }
                        }
                        else {
                            found.asyncIndicator = indicator;
                        }
                    }
                    return meta;
                }, meta ? Object.assign(Object.assign({}, this.getMeta()), meta) : this.getMeta());
                return reduced;
            }
            commitMetaAsyncIndicator(fields, indicator, meta, condition) {
                const reduced = this.getChangedMetaAsync(fields, indicator, meta, condition);
                this.safeCommitMeta(reduced);
            }
            getAsyncFields() {
                return this.getFormData()
                    .filter(({ type }) => type === interfaces_1.DatumType.ASYNC)
                    .map(({ field }) => field);
            }
            asyncValidatorExecutor(connector, lazy) {
                if (!this.asyncValidator) {
                    return;
                }
                const subscription = connector
                    .getDataSource()
                    .pipe((0, rxjs_1.map)((states) => states[this.id].filter(({ type }) => type === interfaces_1.DatumType.ASYNC)), (0, rxjs_1.distinctUntilChanged)(this.getComparator(connector)), (0, rxjs_1.tap)((formData) => {
                    this.commitMetaAsyncIndicator(formData.map(({ field }) => field), interfaces_1.AsyncState.PENDING);
                }), this.connect(lazy)((formData) => {
                    if (!formData.length) {
                        return (0, rxjs_1.of)(this.cloneMeta(this.getMeta()));
                    }
                    const async$ = this.asyncValidator(this.getFormData(), () => this.cloneMeta(this.getMeta()));
                    const reduced$ = async$ instanceof Promise ? (0, rxjs_1.from)(async$) : async$;
                    return reduced$.pipe((0, rxjs_1.map)((meta) => {
                        return Object.assign(Object.assign(Object.assign({}, this.getMeta()), meta), this.getExcludedMeta(connector));
                    }));
                }), (0, rxjs_1.catchError)(() => (0, rxjs_1.of)(Object.assign(Object.assign(Object.assign({}, this.getMeta()), this.getChangedMetaAsync(this.getAsyncFields(), interfaces_1.AsyncState.ERROR)), this.getExcludedMeta(connector)))))
                    .subscribe((meta) => {
                    this.commitMetaAsyncIndicator(this.getAsyncFields(), interfaces_1.AsyncState.DONE, meta, (found) => {
                        return (!(found === null || found === void 0 ? void 0 : found.asyncIndicator) ||
                            found.asyncIndicator === interfaces_1.AsyncState.PENDING);
                    });
                });
                return () => subscription.unsubscribe();
            }
            cloneMetaByField(field, meta) {
                var _a;
                const plucked = meta[field];
                const clone = (_a = this.cloneFunctionMap) === null || _a === void 0 ? void 0 : _a[field];
                if (plucked) {
                    if (clone) {
                        return clone(plucked);
                    }
                    const cloned = {};
                    cloned.errors = (0, rx_store_core_1.shallowClone)(plucked.errors);
                    if (plucked.info) {
                        cloned.info = (0, rx_store_core_1.shallowClone)(plucked.info);
                    }
                    if (plucked.warn) {
                        cloned.warn = (0, rx_store_core_1.shallowClone)(plucked.warn);
                    }
                    return cloned;
                }
                return plucked;
            }
            cloneMeta(meta) {
                const clone = this.cloneFunction;
                if (clone) {
                    return clone(meta);
                }
                return Object.getOwnPropertyNames(meta).reduce((acc, next) => {
                    acc[next] = this.cloneMetaByField(next, meta);
                    return acc;
                }, {});
            }
            cast(connector) {
                const casted = connector;
                return casted;
            }
            getFormData(fields) {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const form = casted.getState(this.id);
                    if (fields) {
                        const reduced = form.reduce((acc, next, i) => {
                            const found = fields.find((field) => next.field === field);
                            if (found) {
                                acc.push(next);
                            }
                            return acc;
                        }, []);
                        return reduced;
                    }
                    return form;
                });
            }
            getMeta() {
                var _a;
                return Object.assign({}, (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.value);
            }
            getDatum(field) {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    return this.findDatumByField(casted.getState(this.id), field);
                });
            }
            getDatumValue(field) {
                return this.safeExecute((connector) => {
                    var _a;
                    const casted = this.cast(connector);
                    const value = (_a = this.findDatumByField(casted.getState(this.id), field)) === null || _a === void 0 ? void 0 : _a.value;
                    return value;
                });
            }
            getClonedMetaByField(field) {
                const target = this.getMeta()[field];
                return target ? this.cloneMetaByField(field, target) : target;
            }
            getClonedMeta() {
                return this.cloneMeta(this.getMeta());
            }
            getFieldMeta(field) {
                var _a;
                return (_a = this.getMeta()) === null || _a === void 0 ? void 0 : _a[field];
            }
            getFieldsMeta(fields) {
                return fields.reduce((acc, next) => {
                    var _a;
                    const meta = (_a = this.getMeta()) === null || _a === void 0 ? void 0 : _a[next];
                    if (meta !== undefined) {
                        acc[next] = meta;
                    }
                    return acc;
                }, {});
            }
            observeMeta(callback) {
                var _a;
                const subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.map)(this.cloneMeta), (0, rxjs_1.distinctUntilChanged)(this.metaComparator ? this.metaComparator : (v1, v2) => v1 === v2)).subscribe(callback);
                return () => subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            }
            observeMetaByField(field, callback) {
                var _a, _b;
                const comparator = (_a = this.metaComparatorMap) === null || _a === void 0 ? void 0 : _a[field];
                const subscription = (_b = this.metadata$) === null || _b === void 0 ? void 0 : _b.pipe((0, rxjs_1.map)((meta) => this.cloneMetaByField(field, meta)), (0, rxjs_1.distinctUntilChanged)(comparator ? comparator : rx_store_core_1.shallowCompare)).subscribe(callback);
                return () => subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            }
            observeMetaByFields(fields, callback, comparator) {
                var _a;
                const subscription = (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.pipe((0, rxjs_1.map)((meta) => fields.reduce((acc, next) => {
                    acc[next] = this.cloneMetaByField(next, meta);
                    return acc;
                }, {})), (0, rxjs_1.distinctUntilChanged)(comparator ? comparator : (v1, v2) => v1 === v2)).subscribe(callback);
                return () => subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            }
            observeFormDatum(field, observer, comparator) {
                const casted = this.cast(this.connector);
                if (casted) {
                    const subscription = casted
                        .getDataSource()
                        .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field)), (0, rxjs_1.distinctUntilChanged)(comparator ? comparator : rx_store_core_1.shallowCompare))
                        .subscribe(observer);
                    return () => subscription.unsubscribe();
                }
                return () => { };
            }
            observeFormValue(field, observer, comparator) {
                const casted = this.cast(this.connector);
                if (casted) {
                    const subscription = casted
                        .getDataSource()
                        .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field).value), (0, rxjs_1.distinctUntilChanged)(comparator ? comparator : rx_store_core_1.shallowCompare))
                        .subscribe(observer);
                    return () => subscription.unsubscribe();
                }
                return () => { };
            }
            observeFormData(observer, fields, comparator) {
                const casted = this.cast(this.connector);
                if (casted) {
                    const subscription = casted
                        .getDataSource()
                        .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => {
                        if (!fields) {
                            return form;
                        }
                        return form.reduce((acc, next, i) => {
                            const found = fields.find((field) => next.field === field);
                            if (found) {
                                acc.push(next);
                            }
                            return acc;
                        }, []);
                    }), (0, rxjs_1.distinctUntilChanged)(comparator ? comparator : rx_store_core_1.shallowCompare))
                        .subscribe(observer);
                    return () => subscription.unsubscribe();
                }
                return () => { };
            }
            startValidation(lazy) {
                return this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const stopSyncValidation = this.validatorExecutor(casted);
                    const stopAsyncValidation = this.asyncValidatorExecutor(casted, lazy);
                    this.listenToExcludedAll(this.getFields());
                    return () => {
                        stopSyncValidation();
                        stopAsyncValidation === null || stopAsyncValidation === void 0 ? void 0 : stopAsyncValidation();
                        this.subscriptions.removeAll();
                    };
                });
            }
            changeFormValue(field, value) {
                this.safeCommitMutation(field, (found) => {
                    found.value = value;
                    found.changed = true;
                });
                return this;
            }
            hoverFormField(field, hoverOrNot) {
                this.safeCommitMutation(field, (found) => {
                    found.hovered = hoverOrNot;
                });
                return this;
            }
            changeFieldType(field, type, $validator) {
                this.safeCommitMutation(field, (found) => {
                    if (type === interfaces_1.DatumType.EXCLUDED && found.type !== interfaces_1.DatumType.EXCLUDED) {
                        this.listenToExcludedAll([
                            {
                                field,
                                type,
                                $validator,
                            },
                        ]);
                    }
                    if (found.type === interfaces_1.DatumType.EXCLUDED && type !== interfaces_1.DatumType.EXCLUDED) {
                        this.subscriptions.remove(field);
                    }
                    found.type = type;
                });
                return this;
            }
            resetFormDatum(field) {
                this.safeCommitMutation(field, (found, data) => {
                    const defaultDatum = this.findDatumByField(this.initiator(), field);
                    if (defaultDatum) {
                        found.changed = false;
                        found.focused = false;
                        found.hovered = false;
                        found.touched = false;
                        found.value = defaultDatum.value;
                        found.lazy = defaultDatum.lazy;
                        return this;
                    }
                    this.removeDataByFields([field], data);
                });
                return this;
            }
            resetFormAll() {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const data = this.initiator();
                    const excluded = this.getExcludedFields(casted);
                    excluded.forEach((e) => {
                        const target = data.find(({ field }) => e === field);
                        if (!target) {
                            this.subscriptions.remove(e);
                            return;
                        }
                        if (target && target.type !== interfaces_1.DatumType.EXCLUDED) {
                            this.subscriptions.remove(e);
                        }
                    });
                    casted.reset(this.id);
                });
                return this;
            }
            touchFormField(field, touchOrNot) {
                this.safeCommitMutation(field, (found) => {
                    found.touched = touchOrNot;
                });
                return this;
            }
            emptyFormField(field) {
                this.safeCommitMutation(field, (found, data) => {
                    const defaultDatum = this.findDatumByField(this.initiator(), field);
                    if (defaultDatum) {
                        found.value = defaultDatum.value;
                        return this;
                    }
                    data.splice(data.findIndex((d) => d.field === field), 1);
                });
                return this;
            }
            focusFormField(field, focusOrNot) {
                this.safeCommitMutation(field, (found) => {
                    found.focused = focusOrNot;
                });
                return this;
            }
            appendFormData(fields) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const data = casted.getClonedState(this.id);
                    this.appendDataByFields(fields, data);
                    this.commitMutation(data, casted);
                });
                return this;
            }
            removeFormData(fields) {
                this.safeExecute((connector) => {
                    const casted = this.cast(connector);
                    const data = casted.getClonedState(this.id);
                    this.removeDataByFields(fields, data);
                    this.commitMutation(data, casted);
                });
                return this;
            }
            setMetadata(meta) {
                this.safeExecute(() => {
                    var _a;
                    (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.next(Object.assign(Object.assign({}, this.metadata$.value), meta));
                });
                return this;
            }
            setMetaByField(field, metaOne) {
                this.safeExecute(() => {
                    var _a;
                    const meta = this.getMeta();
                    if (!metaOne) {
                        return this;
                    }
                    meta[field] = metaOne;
                    (_a = this.metadata$) === null || _a === void 0 ? void 0 : _a.next(Object.assign({}, meta));
                });
                return this;
            }
            toFormData() {
                return (form) => {
                    return this.getFormData().reduce((acc, { field, value }) => {
                        if (field) {
                            acc.append(field, value instanceof Blob || typeof value === "string"
                                ? value
                                : String(value));
                        }
                        return acc;
                    }, new FormData(form));
                };
            }
        },
        (() => {
            _safeCommitMeta_decorators = [rx_store_core_1.bound];
            _cloneMeta_decorators = [rx_store_core_1.bound];
            _getFormData_decorators = [rx_store_core_1.bound];
            _getMeta_decorators = [rx_store_core_1.bound];
            _getDatum_decorators = [rx_store_core_1.bound];
            _getDatumValue_decorators = [rx_store_core_1.bound];
            _getClonedMetaByField_decorators = [rx_store_core_1.bound];
            _getClonedMeta_decorators = [rx_store_core_1.bound];
            _getFieldMeta_decorators = [rx_store_core_1.bound];
            _getFieldsMeta_decorators = [rx_store_core_1.bound];
            _observeMeta_decorators = [rx_store_core_1.bound];
            _observeMetaByField_decorators = [rx_store_core_1.bound];
            _observeMetaByFields_decorators = [rx_store_core_1.bound];
            _observeFormDatum_decorators = [rx_store_core_1.bound];
            _observeFormValue_decorators = [rx_store_core_1.bound];
            _observeFormData_decorators = [rx_store_core_1.bound];
            _startValidation_decorators = [rx_store_core_1.bound];
            _changeFormValue_decorators = [rx_store_core_1.bound];
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
            _toFormData_decorators = [rx_store_core_1.bound];
            __esDecorate(_a, null, _safeCommitMeta_decorators, { kind: "method", name: "safeCommitMeta", static: false, private: false, access: { has: obj => "safeCommitMeta" in obj, get: obj => obj.safeCommitMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _cloneMeta_decorators, { kind: "method", name: "cloneMeta", static: false, private: false, access: { has: obj => "cloneMeta" in obj, get: obj => obj.cloneMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFormData_decorators, { kind: "method", name: "getFormData", static: false, private: false, access: { has: obj => "getFormData" in obj, get: obj => obj.getFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getMeta_decorators, { kind: "method", name: "getMeta", static: false, private: false, access: { has: obj => "getMeta" in obj, get: obj => obj.getMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDatum_decorators, { kind: "method", name: "getDatum", static: false, private: false, access: { has: obj => "getDatum" in obj, get: obj => obj.getDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDatumValue_decorators, { kind: "method", name: "getDatumValue", static: false, private: false, access: { has: obj => "getDatumValue" in obj, get: obj => obj.getDatumValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getClonedMetaByField_decorators, { kind: "method", name: "getClonedMetaByField", static: false, private: false, access: { has: obj => "getClonedMetaByField" in obj, get: obj => obj.getClonedMetaByField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getClonedMeta_decorators, { kind: "method", name: "getClonedMeta", static: false, private: false, access: { has: obj => "getClonedMeta" in obj, get: obj => obj.getClonedMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldMeta_decorators, { kind: "method", name: "getFieldMeta", static: false, private: false, access: { has: obj => "getFieldMeta" in obj, get: obj => obj.getFieldMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getFieldsMeta_decorators, { kind: "method", name: "getFieldsMeta", static: false, private: false, access: { has: obj => "getFieldsMeta" in obj, get: obj => obj.getFieldsMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMeta_decorators, { kind: "method", name: "observeMeta", static: false, private: false, access: { has: obj => "observeMeta" in obj, get: obj => obj.observeMeta } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMetaByField_decorators, { kind: "method", name: "observeMetaByField", static: false, private: false, access: { has: obj => "observeMetaByField" in obj, get: obj => obj.observeMetaByField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeMetaByFields_decorators, { kind: "method", name: "observeMetaByFields", static: false, private: false, access: { has: obj => "observeMetaByFields" in obj, get: obj => obj.observeMetaByFields } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormDatum_decorators, { kind: "method", name: "observeFormDatum", static: false, private: false, access: { has: obj => "observeFormDatum" in obj, get: obj => obj.observeFormDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormValue_decorators, { kind: "method", name: "observeFormValue", static: false, private: false, access: { has: obj => "observeFormValue" in obj, get: obj => obj.observeFormValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _observeFormData_decorators, { kind: "method", name: "observeFormData", static: false, private: false, access: { has: obj => "observeFormData" in obj, get: obj => obj.observeFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _startValidation_decorators, { kind: "method", name: "startValidation", static: false, private: false, access: { has: obj => "startValidation" in obj, get: obj => obj.startValidation } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFormValue_decorators, { kind: "method", name: "changeFormValue", static: false, private: false, access: { has: obj => "changeFormValue" in obj, get: obj => obj.changeFormValue } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _hoverFormField_decorators, { kind: "method", name: "hoverFormField", static: false, private: false, access: { has: obj => "hoverFormField" in obj, get: obj => obj.hoverFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _changeFieldType_decorators, { kind: "method", name: "changeFieldType", static: false, private: false, access: { has: obj => "changeFieldType" in obj, get: obj => obj.changeFieldType } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormDatum_decorators, { kind: "method", name: "resetFormDatum", static: false, private: false, access: { has: obj => "resetFormDatum" in obj, get: obj => obj.resetFormDatum } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resetFormAll_decorators, { kind: "method", name: "resetFormAll", static: false, private: false, access: { has: obj => "resetFormAll" in obj, get: obj => obj.resetFormAll } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _touchFormField_decorators, { kind: "method", name: "touchFormField", static: false, private: false, access: { has: obj => "touchFormField" in obj, get: obj => obj.touchFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _emptyFormField_decorators, { kind: "method", name: "emptyFormField", static: false, private: false, access: { has: obj => "emptyFormField" in obj, get: obj => obj.emptyFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _focusFormField_decorators, { kind: "method", name: "focusFormField", static: false, private: false, access: { has: obj => "focusFormField" in obj, get: obj => obj.focusFormField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _appendFormData_decorators, { kind: "method", name: "appendFormData", static: false, private: false, access: { has: obj => "appendFormData" in obj, get: obj => obj.appendFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _removeFormData_decorators, { kind: "method", name: "removeFormData", static: false, private: false, access: { has: obj => "removeFormData" in obj, get: obj => obj.removeFormData } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetadata_decorators, { kind: "method", name: "setMetadata", static: false, private: false, access: { has: obj => "setMetadata" in obj, get: obj => obj.setMetadata } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setMetaByField_decorators, { kind: "method", name: "setMetaByField", static: false, private: false, access: { has: obj => "setMetaByField" in obj, get: obj => obj.setMetaByField } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _toFormData_decorators, { kind: "method", name: "toFormData", static: false, private: false, access: { has: obj => "toFormData" in obj, get: obj => obj.toFormData } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.default = FormControllerImpl;
//# sourceMappingURL=formControlNRS.js.map