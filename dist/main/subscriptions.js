"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriptions = void 0;
class Subscriptions {
    constructor() {
        this.subscriptions = [];
    }
    push(id, subscription) {
        this.subscriptions.push({
            id,
            subscription,
        });
        return this;
    }
    pushAll(subscriptions) {
        subscriptions.forEach((subscription) => {
            this.subscriptions.push(subscription);
        });
        return this;
    }
    remove(id) {
        const index = this.subscriptions.findIndex((s) => s.id === id);
        if (index < 0) {
            return this;
        }
        this.subscriptions
            .splice(index, 1)
            .forEach(({ subscription }) => subscription.unsubscribe());
    }
    removeAll() {
        const length = this.subscriptions.length;
        for (let i = 0; i < length; i++) {
            const removed = this.subscriptions.pop();
            removed === null || removed === void 0 ? void 0 : removed.subscription.unsubscribe();
        }
        return this;
    }
}
exports.Subscriptions = Subscriptions;
//# sourceMappingURL=subscriptions.js.map