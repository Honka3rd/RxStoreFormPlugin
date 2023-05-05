import { Plugin } from "rx-store-types";
import {
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormStubs,
  NormalFormPluginBuilderParams,
} from "./main/interfaces";
import FormControllerImpl from "./main/formControlNRS";
import { Observable } from "rxjs";

class NRFormBuilder<
  F extends FormControlData,
  M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
  S extends string = string
> {
  private NRF: FormController<F, M, S> & Plugin<S>;
  constructor({
    formSelector,
    validator,
  }: NormalFormPluginBuilderParams<F, M, S>) {
    this.NRF = new FormControllerImpl<F, M, S>(formSelector, validator);
  }

  setAsyncValidator(
    asyncValidator: (
      formData: F
    ) => Observable<Partial<M>> | Promise<Partial<M>>
  ) {
    this.NRF.setAsyncValidator(asyncValidator);
    return this;
  }

  setFields(fields: FormStubs<F>) {
    this.NRF.setFields(fields);
    return this;
  }

  setMetaComparator(
    metaComparator: (meta1: Partial<M>, meta2: Partial<M>) => boolean
  ) {
    this.NRF.setMetaComparator(metaComparator);
    return this;
  }

  setMetaComparatorMap(metaComparatorMap: {
    [K in keyof Partial<M>]: (m1: Partial<M>[K], m2: Partial<M>[K]) => boolean;
  }) {
    this.NRF.setMetaComparatorMap(metaComparatorMap);
    return this;
  }

  setMetaCloneFunction(cloneFunction: (meta: Partial<M>) => Partial<M>) {
    this.NRF.setMetaCloneFunction(cloneFunction);
    return this;
  }

  setMetaCloneFunctionMap(cloneFunctionMap: {
    [K in keyof Partial<M>]: (metaOne: Partial<M>[K]) => Partial<M>[K];
  }) {
    this.NRF.setMetaCloneFunctionMap(cloneFunctionMap);
    return this;
  }

  setDefaultMeta(meta: Partial<M>) {
    this.NRF.setDefaultMeta(meta);
    return this;
  }

  getInstance() {
    return this.NRF;
  }
}

export { NRFormBuilder };
