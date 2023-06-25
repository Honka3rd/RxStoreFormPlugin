"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFormBuilder = exports.NRFormBuilder = void 0;
const formControlNRS_1 = __importDefault(require("./formControlNRS"));
const formControlIRS_1 = require("./formControlIRS");
const subscriptions_1 = require("./subscriptions");
class NRFormBuilder {
    constructor({ formSelector, validator, }) {
        this.NRF = new formControlNRS_1.default(formSelector, validator, new subscriptions_1.Subscriptions());
    }
    setBulkAsyncValidator(asyncValidator) {
        this.NRF.setBulkAsyncValidator(asyncValidator);
        return this;
    }
    setFields(fields) {
        this.NRF.setFields(fields);
        this.setDefaultMeta(fields.reduce((meta, next) => {
            meta[next["field"]] = {
                errors: {},
            };
            return meta;
        }, {}));
        return this;
    }
    setMetaComparator(metaComparator) {
        this.NRF.setMetaComparator(metaComparator);
        return this;
    }
    setMetaComparatorMap(metaComparatorMap) {
        this.NRF.setMetaComparatorMap(metaComparatorMap);
        return this;
    }
    setMetaCloneFunction(cloneFunction) {
        this.NRF.setMetaCloneFunction(cloneFunction);
        return this;
    }
    setMetaCloneFunctionMap(cloneFunctionMap) {
        this.NRF.setMetaCloneFunctionMap(cloneFunctionMap);
        return this;
    }
    setDefaultMeta(meta) {
        this.NRF.setDefaultMeta(meta);
        return this;
    }
    setAsyncConfig(cfg) {
        this.NRF.setAsyncConfig(cfg);
        return this;
    }
    getInstance() {
        return this.NRF;
    }
}
exports.NRFormBuilder = NRFormBuilder;
class IRFormBuilder {
    constructor({ formSelector, validator, }) {
        this.IRF = new formControlIRS_1.ImmutableFormControllerImpl(formSelector, validator, new subscriptions_1.Subscriptions());
    }
    setBulkAsyncValidator(asyncValidator) {
        this.IRF.setBulkAsyncValidator(asyncValidator);
        return this;
    }
    setFields(fields) {
        this.IRF.setFields(fields);
        this.setDefaultMeta(fields.reduce((meta, next) => {
            meta[next["field"]] = {
                errors: {},
            };
            return meta;
        }, {}));
        return this;
    }
    setDefaultMeta(meta) {
        this.IRF.setDefaultMeta(meta);
        return this;
    }
    setAsyncConfig(cfg) {
        this.IRF.setAsyncConfig(cfg);
        return this;
    }
    getInstance() {
        return this.IRF;
    }
}
exports.IRFormBuilder = IRFormBuilder;
//# sourceMappingURL=builders.js.map