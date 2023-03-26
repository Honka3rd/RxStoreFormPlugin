import { RxNStore } from "rx-store-core/main/interfaces";
import {
  FormController,
  FormControlData,
  Any,
  FormControlBasicDatum,
} from "./interfaces";

class FormControllerImpl<F extends FormControlData, S extends string>
  implements FormController<F>
{
  private connector?: RxNStore<Any>;

  constructor(
    private formSelector: S,
    public validator: <N extends number>(formData: F[N]) => F[N]["metadata"],
    private fields?: Array<{
      field: F[number]["field"];
      defaultValue: F[number]["value"];
      defaultMeta?: F[number]["metadata"];
    }>
  ) {}

  private reportNoneConnectedError() {
    throw Error("initiator method is not called");
  }

  private safeExcute<R>(
    callback: (connector: RxNStore<Record<S, () => F>>) => R
  ) {
    const connector = this.connector as RxNStore<Record<S, () => F>>;
    if (connector) {
      return callback(connector);
    }
    this.reportNoneConnectedError();
  }

  private shallowCloneFormData() {
    return this.safeExcute((connector) => {
      return this.connector?.getClonedState(this.formSelector) as F;
    });
  }

  private safeClone(callback: (data: F) => void) {
    const cloned = this.shallowCloneFormData();
    if (cloned) {
      callback(cloned);
    }
  }

  private findDatumByField(data: F, field: F[number]["field"]) {
    return data.find((datum) => datum.field === field);
  }

  private findfromClonedAndExecute(
    field: F[number]["field"],
    cloned: F,
    callback: <D extends FormControlBasicDatum>(found: D) => void
  ) {
    const found = this.findDatumByField(cloned, field);
    if (found) {
      callback(found);
    }
  }

  private commitMutation(data: F, connector: RxNStore<Record<S, () => F>>) {
    connector.setState({ [this.formSelector]: data } as {});
  }

  private safeCommitMutation<N extends number>(
    field: F[N]["field"],
    callback: (found: F[N], data: F) => void
  ) {
    this.safeExcute((connector) => {
      this.safeClone((data) => {
        this.findfromClonedAndExecute(field, data, (found: F[N]) => {
          callback({ ...found }, data);
          this.commitMutation(data, connector);
        });
      });
    });
  }

  private removeDataByFields(fields: Array<F[number]["field"]>, data: F) {
    fields.forEach((field) => {
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
    });
  }

  private addDataByFields(
    fields: Array<{
      field: F[number]["field"];
      defaultValue: F[number]["value"];
      defaultMeta?: F[number]["metadata"];
    }>,
    data: F
  ) {
    fields.forEach(({ defaultValue, defaultMeta, field }) => {
      data.push({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        metadata: defaultMeta ? defaultMeta : { errors: {} as Any },
      });
    });
  }

  getFormSelector() {
    return this.formSelector;
  }

  initiator(connector?: RxNStore<Any>) {
    this.connector = connector;
    if (this.fields) {
      return this.fields.map(({ field, defaultValue, defaultMeta }) => ({
        field,
        touched: false,
        empty: true,
        changed: false,
        hovered: false,
        focused: false,
        value: defaultValue,
        metadata: defaultMeta ? defaultMeta : { errors: {} as Any },
      })) as F;
    }
    return [] as unknown as F;
  }

  changeFormDatum<N extends number>(
    field: F[N]["field"],
    value: F[N]["value"]
  ) {
    this.safeCommitMutation(field, (found) => {
      found.value = value;
    });
    return this;
  }

  hoverFormField<N extends number>(field: F[N]["field"], hoverOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.hovered = hoverOrNot;
    });
    return this;
  }

  resetFormDatum<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator(), field);
      if (defaultDatum) {
        found.changed = defaultDatum.changed;
        found.empty = defaultDatum.empty;
        found.focused = defaultDatum.focused;
        found.hovered = defaultDatum.hovered;
        found.touched = defaultDatum.touched;
        found.metadata = defaultDatum.metadata;
        found.value = defaultDatum.value;
        return;
      }
      this.removeDataByFields([field], data);
    });
    return this;
  }

  resetFormAll() {
    this.safeExcute((connector) => {
      connector.reset(this.formSelector);
    });
    return this;
  }

  touchFormField<N extends number>(field: F[N]["field"], touchOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.touched = touchOrNot;
    });
    return this;
  }

  emptyFormField<N extends number>(field: F[N]["field"]) {
    this.safeCommitMutation(field, (found, data) => {
      const defaultDatum = this.findDatumByField(this.initiator(), field);
      if (defaultDatum) {
        found.empty = true;
        found.value = defaultDatum.value;
        return;
      }
      data.splice(
        data.findIndex((d) => d.field === field),
        1
      );
    });
    return this;
  }

  focusFormField<N extends number>(field: F[N]["field"], focusOrNot: boolean) {
    this.safeCommitMutation(field, (found) => {
      found.focused = focusOrNot;
    });
    return this;
  }

  setFormMetadata<N extends number>(
    field: F[N]["field"],
    meta: F[N]["metadata"]
  ) {
    this.safeCommitMutation(field, (found) => {
      found.metadata = meta;
    });
    return this;
  }

  setFormMetadataErrors<N extends number>(
    field: F[N]["field"],
    errors: F[N]["metadata"]["errors"]
  ) {
    this.safeCommitMutation(field, (found) => {
      const meta = { ...found.metadata };
      meta.errors = errors;
      found.metadata = meta;
    });
    return this;
  }

  setFormMetadataInfo<N extends number>(
    field: F[N]["field"],
    info: F[N]["metadata"]["info"]
  ) {
    this.safeCommitMutation(field, (found) => {
      const meta = { ...found.metadata };
      meta.info = info;
      found.metadata = meta;
    });
    return this;
  }

  setFormMetadataWarn<N extends number>(
    field: F[N]["field"],
    warn: F[N]["metadata"]["warn"]
  ) {
    this.safeCommitMutation(field, (found) => {
      const meta = { ...found.metadata };
      meta.warn = warn;
      found.metadata = meta;
    });
    return this;
  }

  createFormDatum(
    fields: Array<{
      field: F[number]["field"];
      defaultValue: F[number]["value"];
      defaultMeta?: F[number]["metadata"];
    }>
  ) {
    this.safeExcute((connector) => {
      this.safeClone((data) => {
        this.addDataByFields(fields, data);
        this.commitMutation(data, connector);
      });
    });
    return this;
  }

  deleteFormDatum(fields: Array<F[number]["field"]>) {
    this.safeExcute((connector) => {
      this.safeClone((data) => {
        this.removeDataByFields(fields, data);
        this.commitMutation(data, connector);
      });
    });
    return this;
  }
}

export default FormControllerImpl;
