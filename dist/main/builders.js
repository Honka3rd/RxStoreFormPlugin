"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRFormBuilder = exports.NRFormBuilder = void 0;
var formControlNRS_1 = __importDefault(require("./formControlNRS"));
var formControlIRS_1 = require("./formControlIRS");
var NRFormBuilder = /** @class */ (function () {
    function NRFormBuilder(_a) {
        var formSelector = _a.formSelector, validator = _a.validator;
        this.NRF = new formControlNRS_1.default(formSelector, validator);
    }
    NRFormBuilder.prototype.setAsyncValidator = function (asyncValidator) {
        this.NRF.setAsyncValidator(asyncValidator);
        return this;
    };
    NRFormBuilder.prototype.setFields = function (fields) {
        this.NRF.setFields(fields);
        return this;
    };
    NRFormBuilder.prototype.setMetaComparator = function (metaComparator) {
        this.NRF.setMetaComparator(metaComparator);
        return this;
    };
    NRFormBuilder.prototype.setMetaComparatorMap = function (metaComparatorMap) {
        this.NRF.setMetaComparatorMap(metaComparatorMap);
        return this;
    };
    NRFormBuilder.prototype.setMetaCloneFunction = function (cloneFunction) {
        this.NRF.setMetaCloneFunction(cloneFunction);
        return this;
    };
    NRFormBuilder.prototype.setMetaCloneFunctionMap = function (cloneFunctionMap) {
        this.NRF.setMetaCloneFunctionMap(cloneFunctionMap);
        return this;
    };
    NRFormBuilder.prototype.setDefaultMeta = function (meta) {
        this.NRF.setDefaultMeta(meta);
        return this;
    };
    NRFormBuilder.prototype.getInstance = function () {
        return this.NRF;
    };
    return NRFormBuilder;
}());
exports.NRFormBuilder = NRFormBuilder;
var IRFormBuilder = /** @class */ (function () {
    function IRFormBuilder(_a) {
        var formSelector = _a.formSelector, validator = _a.validator;
        this.IRF = new formControlIRS_1.ImmutableFormControllerImpl(formSelector, validator);
    }
    IRFormBuilder.prototype.setAsyncValidator = function (asyncValidator) {
        this.IRF.setAsyncValidator(asyncValidator);
        return this;
    };
    IRFormBuilder.prototype.setFields = function (fields) {
        this.IRF.setFields(fields);
        return this;
    };
    IRFormBuilder.prototype.setDefaultMeta = function (meta) {
        this.IRF.setDefaultMeta(meta);
        return this;
    };
    IRFormBuilder.prototype.getInstance = function () {
        return this.IRF;
    };
    return IRFormBuilder;
}());
exports.IRFormBuilder = IRFormBuilder;
