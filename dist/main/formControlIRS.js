"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmutableFormControllerImpl = void 0;
const rx_store_types_1 = require("rx-store-types");
const interfaces_1 = require("./interfaces");
const immutable_1 = require("immutable");
const rxjs_1 = require("rxjs");
const rx_store_core_1 = require("rx-store-core");
class ImmutableFormControllerImpl extends rx_store_types_1.PluginImpl {
    validator;
    asyncValidator;
    asyncConfig = {
        lazy: false,
        debounceDuration: 0,
    };
    metadata$;
    fields;
    defaultMeta;
    constructor(id, validator, asyncValidator) {
        super(id);
        this.validator = validator;
        this.asyncValidator = asyncValidator;
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
    getAsyncFields = (connector) => {
        return connector
            .getState(this.id)
            .filter((datum) => datum.get("type") === interfaces_1.DatumType.ASYNC)
            .map((datum) => datum.get("field"));
    };
    setAsyncState(state) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const prevFormData = casted.getState(this.id);
            const updated = prevFormData.withMutations((mutation) => {
                this.getAsyncFields(casted).forEach((field) => {
                    const castedField = field;
                    const foundIndex = mutation.findIndex((d) => d.get("field") === castedField);
                    const updatedDatum = mutation
                        .get(foundIndex)
                        ?.set("asyncState", state);
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
    @rx_store_core_1.bound
    getFormData() {
        return this.safeExecute((connector) => {
            const casted = this.cast(connector);
            return casted.getState(this.id);
        });
    }
    @rx_store_core_1.bound
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
    @rx_store_core_1.bound
    resetFormAll() {
        this.safeExecute((connector) => {
            connector.reset(this.id);
        });
        return this;
    }
    @rx_store_core_1.bound
    appendFormData(fields) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const data = this.appendDataByFields(fields, casted.getState(this.id));
            this.commitMutation(data, casted);
        });
        return this;
    }
    @rx_store_core_1.bound
    removeFormData(fields) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const removed = this.removeDataByFields(fields, casted.getState(this.id));
            this.commitMutation(removed, casted);
        });
        return this;
    }
    @rx_store_core_1.bound
    setMetadata(meta) {
        this.safeExecute(() => {
            this.metadata$?.next(meta);
        });
        return this;
    }
    @rx_store_core_1.bound
    setMetaByField(field, metaOne) {
        this.safeExecute(() => {
            const meta = this.getMeta();
            const single = (0, immutable_1.fromJS)({ ...metaOne });
            this.metadata$?.next(meta.set(field, single));
        });
        return this;
    }
    @rx_store_core_1.bound
    observeMeta(callback) {
        const subscription = this.metadata$
            ?.pipe((0, rxjs_1.distinctUntilChanged)((var1, var2) => var1.equals(var2)))
            .subscribe(callback);
        return () => subscription?.unsubscribe();
    }
    @rx_store_core_1.bound
    observeMetaByField(field, callback) {
        const subscription = this.metadata$
            ?.pipe((0, rxjs_1.map)((meta) => meta.get(field)), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
            .subscribe((single) => {
            if (single) {
                callback(single);
            }
        });
        return () => subscription?.unsubscribe();
    }
    @rx_store_core_1.bound
    observeFormData(fields, observer) {
        const casted = this.cast(this.connector);
        const subscription = casted
            .getDataSource()
            .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => {
            return (0, immutable_1.List)().withMutations((mutation) => {
                form.forEach((datum) => {
                    const found = fields.find((field) => datum.get("field") === field);
                    if (found) {
                        mutation.push(found);
                    }
                });
            });
        }), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
            .subscribe(observer);
        return () => subscription.unsubscribe();
    }
    @rx_store_core_1.bound
    observeFormDatum(field, observer) {
        const subscription = this.cast(this.connector)
            .getDataSource()
            .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field)), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
            .subscribe(observer);
        return () => subscription.unsubscribe();
    }
    @rx_store_core_1.bound
    observeFormValue(field, observer) {
        const subscription = this.cast(this.connector)
            .getDataSource()
            .pipe((0, rxjs_1.map)((states) => states[this.id]), (0, rxjs_1.map)((form) => this.findDatumByField(form, field).get("value")), (0, rxjs_1.distinctUntilChanged)((var1, var2) => (0, immutable_1.is)(var1, var2)))
            .subscribe(observer);
        return () => subscription.unsubscribe();
    }
    @rx_store_core_1.bound
    getDatum(field) {
        const casted = this.cast(this.connector);
        return this.findDatumByField(casted.getState(this.id), field);
    }
    @rx_store_core_1.bound
    getFieldMeta(field) {
        return this.safeExecute(() => {
            return this.metadata$?.value.get(field);
        });
    }
    @rx_store_core_1.bound
    changeFieldType(field, type) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const targetIndex = this.getDatumIndex(field, casted);
            if (targetIndex >= 0) {
                const mutation = casted
                    .getState(this.id)
                    .get(targetIndex)
                    ?.set("type", type);
                mutation &&
                    this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
            }
        });
        return this;
    }
    @rx_store_core_1.bound
    getFieldsMeta(fields) {
        return (0, immutable_1.Map)().withMutations((mutation) => {
            fields.forEach((field) => {
                mutation.set(field, this.getFieldMeta(field));
            });
        });
    }
    @rx_store_core_1.bound
    setAsyncValidator(asyncValidator) {
        if (!this.asyncValidator) {
            this.asyncValidator = asyncValidator;
        }
    }
    @rx_store_core_1.bound
    changeFormValue(field, value) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const targetIndex = this.getDatumIndex(field, casted);
            const mutation = casted
                .getState(this.id)
                .get(targetIndex)
                ?.set("value", value);
            mutation &&
                this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
        });
        return this;
    }
    @rx_store_core_1.bound
    touchFormField(field, touchOrNot) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const targetIndex = this.getDatumIndex(field, casted);
            const mutation = casted
                .getState(this.id)
                .get(targetIndex)
                ?.set("touched", touchOrNot);
            mutation &&
                this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
        });
        return this;
    }
    @rx_store_core_1.bound
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
    @rx_store_core_1.bound
    focusFormField(field, focusOrNot) {
        this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const targetIndex = this.getDatumIndex(field, casted);
            const mutation = casted
                .getState(this.id)
                .get(targetIndex)
                ?.set("focused", focusOrNot);
            mutation &&
                this.commitMutation(casted.getState(this.id).set(targetIndex, mutation), casted);
        });
        return this;
    }
    @rx_store_core_1.bound
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
    @rx_store_core_1.bound
    startValidation() {
        return this.safeExecute((connector) => {
            const casted = this.cast(connector);
            const stopValidation = this.validatorExecutor(casted);
            const stopAsyncValidation = this.asyncValidatorExecutor(casted);
            return () => {
                stopValidation?.();
                stopAsyncValidation?.();
            };
        });
    }
    @rx_store_core_1.bound
    getMeta() {
        return (0, immutable_1.Map)(this.metadata$?.value);
    }
    initiator = (connector) => {
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
exports.ImmutableFormControllerImpl = ImmutableFormControllerImpl;
