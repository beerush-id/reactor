export type GenericType = 'string' | 'number' | 'object' | 'array' | 'date' | 'function' | 'boolean';
export type ItemTypeOf<T> = T extends readonly (infer U)[] ? U : never;
export type ObjectAction = 'set' | 'delete';
export type ArrayAction = 'copyWithin' | 'fill' | 'pop' | 'push' | 'shift' | 'unshift' | 'splice' | 'sort' | 'reverse';
export type Action = ObjectAction | ArrayAction;
export type Store<T> = {
    subscribe: Subscribe<T>;
    set: Setter<T>;
};
export type Filtered<T> = Pick<T, {
    [K in keyof T]: T[K] extends Restricted ? never : T[K] extends Restricted[] ? never : K;
}[keyof T]>;
export type Reactive<T> = T & Store<T>;
export type Reactivities<T> = T & Merge<Store<T>, (T extends object[] ? Reactivities<ItemTypeOf<T>>[] : T extends object ? {
    [K in keyof Filtered<T>]: T[K] extends Restricted ? T[K] : T[K] extends Restricted[] ? T[K] : Reactivities<T[K]>;
} : T)>;
export type Merge<T, S> = {
    [K in keyof T]: T[K];
} & S;
export type SubscribeFn<T> = (fn: Subscriber<T>, init?: boolean, actions?: Action[], props?: Array<keyof T> | string[]) => Unsubscribe;
export type Subscribe<T> = SubscribeFn<T> & {
    for: (actions: Action[], handler: SubscriberFn<T>, props?: Array<keyof T> | string[]) => Unsubscribe;
    actions: (actions: Action[], handler: SubscriberFn<T>) => Unsubscribe;
    props: (props: Array<keyof T> | string[], handler: SubscriberFn<T>) => Unsubscribe;
};
export type SubscriberFn<T> = (self?: T, prop?: keyof T, value?: T[keyof T], action?: Action, path?: string, target?: unknown) => void;
export type Subscriber<T> = SubscriberFn<T> & {
    actions?: Action[];
    props?: Array<keyof T> | string[];
};
export type Unsubscribe = UnsubscribeFn & {
    unsubscribe?: () => void;
};
type UnsubscribeFn = () => void;
export type Setter<T> = (value?: T, prop?: keyof T, action?: string, path?: string, target?: unknown) => void;
export type Restricted = string | number | boolean | bigint | symbol | null | undefined;
export type ReactAble = object[] | object;
export type StateChangeMessage = {
    store: string;
    action: Action;
    path: string;
    value: unknown;
};
export {};
