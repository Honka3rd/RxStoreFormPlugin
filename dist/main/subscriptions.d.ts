import { Subscription } from "rxjs";
export declare class Subscriptions {
    private subscriptions;
    push(id: string, subscription: Subscription): this;
    pushAll(subscriptions: Array<{
        id: string;
        subscription: Subscription;
    }>): this;
    remove(id: string): this | undefined;
    removeAll(): this;
}
