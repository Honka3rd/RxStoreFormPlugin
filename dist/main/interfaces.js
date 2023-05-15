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
    DatumType["EXCLUDED"] = "Excluded";
    DatumType["ASYNC"] = "Async";
    DatumType["SYNC"] = "Sync";
})(DatumType = exports.DatumType || (exports.DatumType = {}));
