"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncState = void 0;
var AsyncState;
(function (AsyncState) {
    AsyncState[AsyncState["PENDING"] = 0] = "PENDING";
    AsyncState[AsyncState["DONE"] = 1] = "DONE";
    AsyncState[AsyncState["ERROR"] = 2] = "ERROR";
})(AsyncState = exports.AsyncState || (exports.AsyncState = {}));
