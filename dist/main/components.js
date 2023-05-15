"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installNRFComponents = void 0;
const rxjs_1 = require("rxjs");
const interfaces_1 = require("./interfaces");
const rx_store_core_1 = require("rx-store-core");
class NRFormFieldComponent extends HTMLElement {
    field;
    type;
    mapper;
    attributeBinder;
    metaDataBinder;
    formControllerEmitter = new rxjs_1.BehaviorSubject(null);
    directChildEmitter = new rxjs_1.BehaviorSubject(null);
    subscription;
    unBind;
    @rx_store_core_1.bound
    setDirectChildFromMutations(mutationList) {
        const mutations = mutationList.filter((mutation) => mutation.type === "childList");
        if (this.unBind) {
            const removedAll = mutations.reduce((acc, next) => {
                Array.from(next.removedNodes).forEach((node) => {
                    acc.push(node);
                });
                return acc;
            }, []);
            const removed = removedAll.find((rm) => rm && this.directChildEmitter?.value === rm);
            if (removed) {
                this.unBind();
            }
        }
        if (!this.dataset.targetSelector && !this.dataset.targetId) {
            const first = mutations[0].addedNodes.item(0);
            if (!(first instanceof HTMLElement)) {
                return;
            }
            this.directChildEmitter.next(first);
            return;
        }
        if (this.dataset.targetId) {
            const allAdded = mutations.reduce((acc, next) => {
                Array.from(next.addedNodes).forEach((node) => {
                    acc.push(node);
                });
                return acc;
            }, []);
            const added = allAdded.find((a) => {
                a instanceof HTMLElement && a.id === this.dataset.targetId;
            });
            if (!added) {
                return;
            }
            if (this.dataset.targetId === added.id) {
                added instanceof HTMLElement && this.directChildEmitter.next(added);
            }
            return;
        }
        if (this.dataset.targetSelector) {
            const target = this.querySelector(this.dataset.targetSelector);
            if (!(target instanceof HTMLElement)) {
                return;
            }
            this.directChildEmitter.next(target);
        }
    }
    directChildIsTarget() {
        if (!this.directChildEmitter?.value && !this.children.item(0)) {
            return false;
        }
        return this.directChildEmitter.value === this.children.item(0);
    }
    observer = new MutationObserver(this.setDirectChildFromMutations);
    setValue(value, formController, field) {
        formController.changeFormValue(field, value);
    }
    setTouched(value, formController, field) {
        formController.touchFormField(field, value);
    }
    setFocused(value, formController, field) {
        formController.focusFormField(field, value);
    }
    setHovered(value, formController, field) {
        formController.hoverFormField(field, value);
    }
    attachChildEventListeners(target, formController) {
        const { field } = this;
        if (!formController || !field) {
            return;
        }
        if (target instanceof HTMLElement) {
            target.addEventListener("mouseover", () => this.setHovered(true, formController, field));
            target.addEventListener("mouseleave", () => this.setHovered(false, formController, field));
            target.addEventListener("focus", () => this.setFocused(true, formController, field));
            target.addEventListener("blur", () => {
                this.setFocused(false, formController, field);
                this.setTouched(true, formController, field);
            });
            target.addEventListener("change", (event) => {
                if (this.mapper) {
                    this.setValue(this.mapper(event), formController, field);
                    return;
                }
                this.setValue(event.target.value, formController, field);
            });
        }
    }
    @rx_store_core_1.bound
    attrSetter(target) {
        return (k, v) => target.setAttribute(k, v);
    }
    valuesBinding(target, formController) {
        const { field } = this;
        if (!formController || !field) {
            return;
        }
        if (target instanceof HTMLElement) {
            return formController.observeFormDatum(field, (datum) => {
                this.setAttribute("data-focused", String(datum.focused));
                this.setAttribute("data-changed", String(datum.changed));
                this.setAttribute("data-touched", String(datum.touched));
                this.setAttribute("data-hovered", String(datum.hovered));
                datum.asyncState &&
                    this.setAttribute("data-async-state", String(datum.asyncState));
                this.setAttribute("data-value", datum.value);
                if (this.attributeBinder) {
                    this.attributeBinder(this.attrSetter(target), datum);
                    return;
                }
                if ("value" in target) {
                    target.setAttribute("value", datum.value);
                    return;
                }
                target.setAttribute("data-value", datum.value);
            });
        }
    }
    metaBinding(target, formController) {
        const { field } = this;
        if (!formController || !field) {
            return;
        }
        if (target instanceof HTMLElement) {
            return formController.observeMetaByField(field, (meta) => {
                if (!meta) {
                    return;
                }
                if (this.metaDataBinder) {
                    this.metaDataBinder(this.attrSetter(target), meta);
                }
            });
        }
    }
    setField(field) {
        if (this.field) {
            return;
        }
        this.field = field;
    }
    setDatumType(type) {
        if (this.type) {
            return;
        }
        this.type = type;
    }
    makeControl() {
        return this.formControllerEmitter
            .asObservable()
            .pipe((0, rxjs_1.switchMap)((controller) => this.directChildEmitter.asObservable().pipe((0, rxjs_1.distinctUntilChanged)(), (0, rxjs_1.tap)((firstChild) => {
            this.attachChildEventListeners(firstChild, controller);
            const unbindV = this.valuesBinding(firstChild, controller);
            const unbindM = this.metaBinding(firstChild, controller);
            this.unBind = () => {
                unbindV?.();
                unbindM?.();
            };
        }))))
            .subscribe();
    }
    setRequiredProperties() {
        const field = this.getAttribute("data-field");
        if (!field || !field.length) {
            throw new Error("Form field is not set");
        }
        this.setField(field);
        const type = this.getAttribute("data-type") ?? interfaces_1.DatumType.SYNC;
        this.setDatumType(type);
    }
    constructor() {
        super();
        this.setRequiredProperties();
        this.subscription = this.makeControl();
    }
    setMetaBinder(binder) {
        this.metaDataBinder = binder;
    }
    setAttrBinder(binder) {
        this.attributeBinder = binder;
    }
    setDataMapper(mapper) {
        this.mapper = mapper;
    }
    setNRFormController(controller) {
        this.formControllerEmitter.next(controller);
    }
    getField() {
        return this.field;
    }
    getDatumType() {
        return this.type;
    }
    connectedCallback() {
        this.observer.observe(this, {
            subtree: true,
            childList: true,
            attributes: false,
        });
    }
    disconnectedCallback() {
        this.observer.disconnect();
        this.subscription.unsubscribe();
        this.unBind?.();
    }
    attributeChangedCallback(key, prev, next) {
        const target = this.directChildEmitter.value;
        if (!target) {
            return;
        }
        if (key === "placeholder") {
            if (target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement) {
                if (this.directChildIsTarget()) {
                    return;
                }
                target.setAttribute(key, next);
            }
        }
        if (key === "defaultValue") {
            if (target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement) {
                if (this.directChildIsTarget()) {
                    return;
                }
                target.setAttribute(key, next);
            }
        }
    }
    static observedAttributes() {
        return ["placeholder", "defaultValue"];
    }
}
class NRFormComponent extends HTMLFormElement {
    fieldListEmitter = new rxjs_1.BehaviorSubject([]);
    formControllerEmitter = new rxjs_1.BehaviorSubject(null);
    subscription;
    @rx_store_core_1.bound
    setFieldListFromMutationRecords(mutationList) {
        const nodes = [];
        mutationList
            .filter((mutation) => mutation.type === "childList")
            .forEach((mutation) => Array.from(mutation.addedNodes).forEach((node) => {
            if (!(node instanceof NRFormFieldComponent)) {
                return;
            }
            nodes.push(node);
        }));
        this.fieldListEmitter.next(nodes);
    }
    observer = new MutationObserver(this.setFieldListFromMutationRecords);
    controlAll() {
        return this.formControllerEmitter
            .asObservable()
            .pipe((0, rxjs_1.switchMap)((controller) => this.fieldListEmitter.asObservable().pipe((0, rxjs_1.tap)((nodeList) => {
            if (controller) {
                nodeList.forEach((node) => node.setNRFormController(controller));
            }
        }))))
            .subscribe();
    }
    constructor() {
        super();
        this.subscription = this.controlAll();
    }
    connectedCallback() {
        this.observer.observe(this, {
            subtree: true,
            childList: true,
            attributes: false,
        });
    }
    disconnectedCallback() {
        this.observer.disconnect();
        this.subscription.unsubscribe();
    }
    setNRFormController(controller) {
        this.setAttribute("data-selector", controller.selector());
        this.formControllerEmitter.next(controller);
    }
}
const installNRFComponents = ({ formSelector, fieldSelector, } = {}) => {
    const fieldId = fieldSelector ? fieldSelector : "rx-field-component";
    const formId = formSelector ? formSelector : "rx-form-component";
    if (!window.customElements.get(fieldId)) {
        window.customElements.define(fieldId, NRFormFieldComponent);
    }
    if (!window.customElements.get(formId)) {
        window.customElements.define(formId, NRFormComponent);
    }
};
exports.installNRFComponents = installNRFComponents;
