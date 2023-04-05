"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatumType = exports.AsyncState = void 0;
var AsyncState;
(function (AsyncState) {
    AsyncState[AsyncState["PENDING"] = 0] = "PENDING";
    AsyncState[AsyncState["DONE"] = 1] = "DONE";
    AsyncState[AsyncState["ERROR"] = 2] = "ERROR";
})(AsyncState = exports.AsyncState || (exports.AsyncState = {}));
var DatumType;
(function (DatumType) {
    DatumType[DatumType["EXCLUDED"] = 0] = "EXCLUDED";
    DatumType[DatumType["ASYNC"] = 1] = "ASYNC";
    DatumType[DatumType["SYNC"] = 2] = "SYNC";
})(DatumType = exports.DatumType || (exports.DatumType = {}));
