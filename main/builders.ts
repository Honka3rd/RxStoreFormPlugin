import { Observable } from "rxjs";
import FormControllerImpl from "./formControlNRS";
import {
  AsyncValidationConfig,
  FormControlBasicMetadata,
  FormControlData,
  FormController,
  FormStubs,
  ImmutableFormController,
  ImmutableFormPluginBuilderParams,
  ImmutableMeta,
  NormalFormPluginBuilderParams,
  V,
} from "./interfaces";
import { ImmutableFormControllerImpl } from "./formControlIRS";
import { List, Map } from "immutable";
import { Subscriptions } from "./subscriptions";

class NRFormBuilder<
  F extends FormControlData,
  M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
  S extends string = string
> {
  private NRF: FormController<F, M, S>;
  constructor({
    formSelector,
    validator,
  }: NormalFormPluginBuilderParams<F, M, S>) {
    this.NRF = new FormControllerImpl<F, M, S>(
      formSelector,
      validator,
      new Subscriptions()
    );
  }

  setBulkAsyncValidator(
    asyncValidator: (
      formData: F,
      metadata: () => Partial<M>
    ) => Observable<Partial<M>> | Promise<Partial<M>>
  ) {
    this.NRF.setBulkAsyncValidator(asyncValidator);
    return this;
  }

  setFields(fields: FormStubs<F, M>) {
    this.NRF.setFields(fields);
    this.setDefaultMeta(
      fields.reduce((meta, next) => {
        meta[next["field"]] = {
          errors: {},
        } as M[F[number]["field"]];
        return meta;
      }, {} as Partial<M>)
    );
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

  setAsyncConfig(cfg: AsyncValidationConfig) {
    this.NRF.setAsyncConfig(cfg);
    return this;
  }

  getInstance() {
    return this.NRF;
  }
}

class IRFormBuilder<
  F extends FormControlData,
  M extends Partial<Record<F[number]["field"], FormControlBasicMetadata>>,
  S extends string = string
> {
  private IRF: ImmutableFormController<F, M, S>;
  constructor({
    formSelector,
    validator,
  }: ImmutableFormPluginBuilderParams<F, M, S>) {
    this.IRF = new ImmutableFormControllerImpl<F, M, S>(
      formSelector,
      validator,
      new Subscriptions()
    );
  }

  setBulkAsyncValidator(
    asyncValidator: (
      formData: List<Map<keyof F[number], V<F[number]>>>,
      meta: () => ImmutableMeta<F, M>
    ) =>
      | Observable<ImmutableMeta<F, M>>
      | Promise<ImmutableMeta<F, M>>
  ) {
    this.IRF.setBulkAsyncValidator(asyncValidator);
    return this;
  }

  setFields(fields: FormStubs<F, M>) {
    this.IRF.setFields(fields);
    this.setDefaultMeta(
      fields.reduce((meta, next) => {
        meta[next["field"]] = {
          errors: {},
        } as M[F[number]["field"]];
        return meta;
      }, {} as Partial<M>)
    );
    return this;
  }

  setDefaultMeta(meta: Partial<M>) {
    this.IRF.setDefaultMeta(meta);
    return this;
  }

  setAsyncConfig(cfg: AsyncValidationConfig) {
    this.IRF.setAsyncConfig(cfg);
    return this;
  }

  getInstance() {
    return this.IRF;
  }
}

export { NRFormBuilder, IRFormBuilder };
