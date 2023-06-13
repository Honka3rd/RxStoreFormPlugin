import { NRFormBuilder, IRFormBuilder } from "./main/builders";
import { NRFieldComponent } from "./main/componentNRF";
import { IRFieldComponent } from "./main/componentIRF";
import { FormControlComponent } from "./main/form";
import { InstallDefinition } from "./main/interfaces";
export declare const installNRFComponents: ({ formSelector, fieldNrSelector, fieldIrSelector, }?: InstallDefinition) => void;
export { NRFormBuilder, IRFormBuilder, NRFieldComponent, IRFieldComponent, FormControlComponent };
