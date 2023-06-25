import { Subscription } from "rxjs";

export class Subscriptions {
  private subscriptions: Array<{
    id: string;
    subscription: Subscription;
  }> = [];

  push(id: string, subscription: Subscription) {
    this.subscriptions.push({
      id,
      subscription,
    });
    return this;
  }

  pushAll(
    subscriptions: Array<{
      id: string;
      subscription: Subscription;
    }>
  ) {
    subscriptions.forEach((subscription) => {
      this.subscriptions.push(subscription);
    });
    return this;
  }

  remove(id: string) {
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
      removed?.subscription.unsubscribe();
    }
    return this;
  }
}
