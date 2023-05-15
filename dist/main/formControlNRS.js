"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rx_store_types_1 = require("rx-store-types");
const rx_store_core_1 = require("rx-store-core");
const interfaces_1 = require("./interfaces");
const rxjs_1 = require("rxjs");
class FormControllerImpl extends rx_store_types_1.PluginImpl {
    validator;
    metadata$;
    asyncValidator;
    fields = [];
    metaComparator;
    metaComparatorMap;
    cloneFunction;
    cloneFunctionMap;
    defaultMeta;
    constructor(id, validator) {
        super(id);
        this.validator = validator;
    }
    setAsyncValidator(asyncValidator) {
        if (!this.asyncValidator) {
            this.asyncValidator = asyncValidator;
        }
    }
    setFields(fields) {
        this.fields = fields;
    }
    getFields() {
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
        if (!this.defaultMeta) {
            this.defaultMeta = meta;
        }
    }
    shallowCloneFormData() {
        return this.safeExecute((connector) => {
            const casted = connector;
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
                    const cloned = { ...found };
                    data.splice(data.indexOf(found), 1, cloned);
                    callback(cloned, data);
                    const casted = connector;
                    this.commitMutation(data, casted);
                });
            });
        });
    }
    safeCommitMeta(meta) {
        this.safeExecute(() => this.metadata$?.next(meta));
    }
    removeDataByFields(fields, data) {
        fields.forEach((field) => {
            data.splice(data.findIndex((d) => d.field === field), 1);
        });
    }
    appendDataByFields(fields, data) {
        fields.forEach(({ defaultValue, field, type }) => {
            data.push({
                field,
                touched: false,
                changed: false,
                hovered: false,
                focused: false,
                value: defaultValue,
                type: type ? type : interfaces_1.DatumType.SYNC,
            });
        });
    }
    validatorExecutor(connector) {
        return connector.observe(this.id, (formData) => {
            const meta = this.validator(formData, this.getMeta());
            this.safeCommitMeta(meta);
        });
    }
    getExcludedMeta(connector) {
        const excluded = connector
            .getState(this.id)
            .filter(({ type }) => type === interfaces_1.DatumType.EXCLUDED)
            .map(({ field }) => field);
        return this.getFieldsMeta(excluded);
    }
    getAsyncFields = (connector) => {
        return connector
            .getState(this.id)
            .filter(({ type }) => type === interfaces_1.DatumType.ASYNC)
            .map(({ field }) => field);
    };
    setAsyncState(state) {
        this.safeExecute((connector) => {
            const casted = connector;
            const cloned = casted.getClonedState(this.id);
            this.getAsyncFields(casted).forEach((field) => {
                const found = cloned.find((c) => c.field === field);
                if (found) {
                    found.asyncState = state;
                }
            });
            this.commitMutation(cloned, casted);
        });
    }
    asyncValidatorExecutor(connector) {
        if (!this.asyncValidator) {
            return;
        }
        const comparatorMap = connector.getComparatorMap();
        const specCompare = comparatorMap?.[this.id];
        const compare = specCompare ? specCompare : connector.comparator;
        const subscription = connector
            .getDataSource()
            .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.distinctUntilChanged)(compare), (0, rxjs_1.map)((formData) => formData.filter(({ type }) => type === interfaces_1.DatumType.ASYNC)), (0, rxjs_1.switchMap)((asyncFormData) => {
            const oldMeta = this.getMeta();
            if (!asyncFormData.length) {
                return (0, rxjs_1.of)(oldMeta);
            }
            this.setAsyncState(interfaces_1.AsyncState.PENDING);
            const async$ = this.asyncValidator(asyncFormData, oldMeta);
            const reduced$ = async$ instanceof Promise ? (0, rxjs_1.from)(async$) : async$;
            return reduced$.pipe((0, rxjs_1.catchError)(() => {
                return (0, rxjs_1.of)({
                    success: false,
                    meta: this.getMeta(),
                });
            }), (0, rxjs_1.map)((meta) => {
                if ("success" in meta) {
                    return meta;
                }
                return { success: true, meta };
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
                return {
                    ...this.getMeta(),
                    ...meta,
                    ...this.getExcludedMeta(connector),
                };
            }));
        }))
            .subscribe((meta) => meta && this.safeCommitMeta(meta));
        return () => subscription.unsubscribe();
    }
    initiator = (connector) => {
        if (connector && !this.connector) {
            this.connector = connector;
            this.metadata$ = new rxjs_1.BehaviorSubject(this.validator(connector.getState(this.id), this.defaultMeta ? this.defaultMeta : this.getMeta()));
            return;
        }
        if (this.fields) {
            return this.fields.map(({ field, defaultValue, type }) => ({
                field,
                touched: false,
                changed: false,
                hovered: false,
                focused: false,
                value: defaultValue,
                type: type ? type : interfaces_1.DatumType.SYNC,
            }));
        }
        return [];
    };
    @rx_store_core_1.bound
    getMeta() {
        return { ...this.metadata$?.value };
    }
    @rx_store_core_1.bound
    getDatum(field) {
        return this.safeExecute((connector) => {
            const casted = connector;
            return this.findDatumByField(casted.getState(this.id), field);
        });
    }
    @rx_store_core_1.bound
    getDatumValue(field) {
        return this.safeExecute((connector) => {
            const casted = connector;
            const value = this.findDatumByField(casted.getState(this.id), field)?.value;
            return value;
        });
    }
    @rx_store_core_1.bound
    getClonedMetaByField(field) {
        const meta = this.getMeta();
        const clone = this.cloneFunctionMap?.[field]
            ? this.cloneFunctionMap[field]
            : this.cloneFunction;
        const target = meta[field];
        if (clone && target) {
            return clone(target);
        }
        const casted = this.connector;
        const defaultClone = casted?.cloneFunction;
        if (defaultClone) {
            return defaultClone(target);
        }
        return target;
    }
    @rx_store_core_1.bound
    getFieldMeta(field) {
        return this.getMeta()?.[field];
    }
    @rx_store_core_1.bound
    getFieldsMeta(fields) {
        return fields.reduce((acc, next) => {
            const meta = this.getMeta()?.[next];
            if (meta !== undefined) {
                acc[next] = meta;
            }
            return acc;
        }, {});
    }
    @rx_store_core_1.bound
    observeMeta(callback) {
        const subscription = this.metadata$
            ?.pipe((0, rxjs_1.distinctUntilChanged)(this.metaComparator))
            .subscribe(callback);
        return () => subscription?.unsubscribe();
    }
    @rx_store_core_1.bound
    observeMetaByField(field, callback) {
        const subscription = this.metadata$
            ?.pipe((0, rxjs_1.map)((meta) => meta[field]), (0, rxjs_1.distinctUntilChanged)(this.metaComparatorMap?.[field]))
            .subscribe(callback);
        return () => subscription?.unsubscribe();
    }
    @rx_store_core_1.bound
    observeFormDatum(field, observer, comparator) {
        const casted = this.connector;
        if (casted) {
            const subscription = casted
                .getDataSource()
                .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field)), (0, rxjs_1.distinctUntilChanged)(comparator))
                .subscribe(observer);
            return () => subscription.unsubscribe();
        }
        return () => { };
    }
    @rx_store_core_1.bound
    observeFormValue(field, observer, comparator) {
        const casted = this.connector;
        if (casted) {
            const subscription = casted
                .getDataSource()
                .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field).value), (0, rxjs_1.distinctUntilChanged)(comparator))
                .subscribe(observer);
            return () => subscription.unsubscribe();
        }
        return () => { };
    }
    @rx_store_core_1.bound
    observeFormData(fields, observer, comparator) {
        const casted = this.connector;
        if (casted) {
            const subscription = casted
                .getDataSource()
                .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => form.reduce((acc, next, i) => {
                const found = fields.find((field) => next.field === field);
                if (found) {
                    acc.push(next);
                }
                return acc;
            }, [])), (0, rxjs_1.distinctUntilChanged)(comparator))
                .subscribe(observer);
            return () => subscription.unsubscribe();
        }
        return () => { };
    }
    @rx_store_core_1.bound
    startValidation() {
        return this.safeExecute((connector) => {
            const stopSyncValidation = this.validatorExecutor(connector);
            const stopAsyncValidation = this.asyncValidatorExecutor(connector);
            return () => {
                stopSyncValidation();
                stopAsyncValidation?.();
            };
        });
    }
    @rx_store_core_1.bound
    changeFormValue(field, value) {
        this.safeCommitMutation(field, (found) => {
            found.value = value;
        });
        return this;
    }
    @rx_store_core_1.bound
    hoverFormField(field, hoverOrNot) {
        this.safeCommitMutation(field, (found) => {
            found.hovered = hoverOrNot;
        });
        return this;
    }
    @rx_store_core_1.bound
    changeFieldType(field, type) {
        this.safeCommitMutation(field, (found) => {
            found.type = type;
        });
        return this;
    }
    @rx_store_core_1.bound
    resetFormDatum(field) {
        this.safeCommitMutation(field, (found, data) => {
            const defaultDatum = this.findDatumByField(this.initiator(), field);
            if (defaultDatum) {
                found.changed = false;
                found.focused = false;
                found.hovered = false;
                found.touched = false;
                found.value = defaultDatum.value;
                return this;
            }
            this.removeDataByFields([field], data);
        });
        return this;
    }
    @rx_store_core_1.bound
    resetFormAll() {
        this.safeExecute((connector) => {
            connector.reset(this.id);
        });
        return this;
    }
    @rx_store_core_1.bound
    touchFormField(field, touchOrNot) {
        this.safeCommitMutation(field, (found) => {
            found.touched = touchOrNot;
        });
        return this;
    }
    @rx_store_core_1.bound
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
    @rx_store_core_1.bound
    focusFormField(field, focusOrNot) {
        this.safeCommitMutation(field, (found) => {
            found.focused = focusOrNot;
        });
        return this;
    }
    @rx_store_core_1.bound
    appendFormData(fields) {
        this.safeExecute((connector) => {
            const casted = connector;
            const data = casted.getClonedState(this.id);
            this.appendDataByFields(fields, data);
            this.commitMutation(data, casted);
        });
        return this;
    }
    @rx_store_core_1.bound
    removeFormData(fields) {
        this.safeExecute((connector) => {
            const casted = connector;
            const data = casted.getClonedState(this.id);
            this.removeDataByFields(fields, data);
            this.commitMutation(data, casted);
        });
        return this;
    }
    @rx_store_core_1.bound
    setMetadata(meta) {
        this.safeExecute(() => {
            this.metadata$?.next({ ...this.metadata$.value, ...meta });
        });
        return this;
    }
    @rx_store_core_1.bound
    setMetaByField(field, metaOne) {
        this.safeExecute(() => {
            const meta = this.getMeta();
            meta[field] = metaOne;
            this.metadata$?.next({ ...meta });
        });
        return this;
    }
}
exports.default = FormControllerImpl;
