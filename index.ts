import { NRFormBuilder, IRFormBuilder } from "./main/builders";
import { NRFieldComponent } from "./main/componentNRF";
import { IRFieldComponent } from "./main/componentIRF";
import { FormControlComponent } from "./main/form";
import { InstallDefinition } from "./main/interfaces";

export const installNRFComponents = ({
  formSelector,
  fieldNrSelector,
  fieldIrSelector,
}: InstallDefinition = {}) => {
  const fieldNrId = fieldNrSelector ? fieldNrSelector : "rx-field-component";
  const fieldIrId = fieldIrSelector
    ? fieldIrSelector
    : "rx-immutable-field-component";
  const formId = formSelector ? formSelector : "rx-form-component";
  if (!window.customElements.get(fieldNrId)) {
    window.customElements.define(fieldNrId, NRFieldComponent);
  }

  if (!window.customElements.get(fieldIrId)) {
    window.customElements.define(fieldIrId, IRFieldComponent);
  }

  if (!window.customElements.get(formId)) {
    window.customElements.define(formId, FormControlComponent);
  }
};

export {
  NRFormBuilder,
  IRFormBuilder,
  NRFieldComponent,
  IRFieldComponent,
  FormControlComponent
};
