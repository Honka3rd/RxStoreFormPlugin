"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFormBuilder = exports.NRFormBuilder = void 0;
const formControlNRS_1 = __importDefault(require("./formControlNRS"));
const formControlIRS_1 = require("./formControlIRS");
class NRFormBuilder {
    constructor({ formSelector, validator, }) {
        this.NRF = new formControlNRS_1.default(formSelector, validator);
    }
    setAsyncValidator(asyncValidator) {
        this.NRF.setAsyncValidator(asyncValidator);
        return this;
    }
    setFields(fields) {
        this.NRF.setFields(fields);
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
    getInstance() {
        return this.NRF;
    }
}
exports.NRFormBuilder = NRFormBuilder;
class IRFormBuilder {
    constructor({ formSelector, validator, }) {
        this.IRF = new formControlIRS_1.ImmutableFormControllerImpl(formSelector, validator);
    }
    setAsyncValidator(asyncValidator) {
        this.IRF.setAsyncValidator(asyncValidator);
        return this;
    }
    setFields(fields) {
        this.IRF.setFields(fields);
        return this;
    }
    setDefaultMeta(meta) {
        this.IRF.setDefaultMeta(meta);
        return this;
    }
    getInstance() {
        return this.IRF;
    }
}
exports.IRFormBuilder = IRFormBuilder;
