"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormControlComponent = exports.IRFieldComponent = exports.NRFieldComponent = exports.IRFormBuilder = exports.NRFormBuilder = exports.installNRFComponents = void 0;
const builders_1 = require("./main/builders");
Object.defineProperty(exports, "NRFormBuilder", { enumerable: true, get: function () { return builders_1.NRFormBuilder; } });
Object.defineProperty(exports, "IRFormBuilder", { enumerable: true, get: function () { return builders_1.IRFormBuilder; } });
const componentNRF_1 = require("./main/componentNRF");
Object.defineProperty(exports, "NRFieldComponent", { enumerable: true, get: function () { return componentNRF_1.NRFieldComponent; } });
const componentIRF_1 = require("./main/componentIRF");
Object.defineProperty(exports, "IRFieldComponent", { enumerable: true, get: function () { return componentIRF_1.IRFieldComponent; } });
const form_1 = require("./main/form");
Object.defineProperty(exports, "FormControlComponent", { enumerable: true, get: function () { return form_1.FormControlComponent; } });
const installNRFComponents = ({ formSelector, fieldNrSelector, fieldIrSelector, } = {}) => {
    const fieldNrId = fieldNrSelector ? fieldNrSelector : "rx-field-component";
    const fieldIrId = fieldIrSelector
        ? fieldIrSelector
        : "rx-immutable-field-component";
    const formId = formSelector ? formSelector : "rx-form-component";
    if (!window.customElements.get(fieldNrId)) {
        window.customElements.define(fieldNrId, componentNRF_1.NRFieldComponent);
    }
    if (!window.customElements.get(fieldIrId)) {
        window.customElements.define(fieldIrId, componentIRF_1.IRFieldComponent);
    }
    if (!window.customElements.get(formId)) {
        window.customElements.define(formId, form_1.FormControlComponent);
    }
};
exports.installNRFComponents = installNRFComponents;
//# sourceMappingURL=index.js.map