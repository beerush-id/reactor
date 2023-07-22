import type { ReactAble, Reactive, Reactivities, StateChangeMessage } from './types.js';
type PersistentData = {
    data: Reactive<unknown>;
    recursive?: boolean;
};
export declare let ReactiveStore: {
    [key: string]: Reactive<never>;
};
export declare let PersistentStore: {
    version: string;
    store: {
        [key: string]: PersistentData;
    };
    claims: string[];
    reflects?: string[];
    channel?: BroadcastChannel;
    clear: () => void;
    write: () => void;
};
export declare function reflect({ store, path, action, value }: StateChangeMessage): void;
export declare function publish(message: StateChangeMessage): void;
export declare function upgrade(version: string): void;
/**
 * Register an object/array to the ReactiveStore.
 * @param {string} name - name in the store.
 * @param {T extends object} object - Object/Array to register and make it reactive.
 * @param recursive - Transform object inside an array as well.
 * @param protect
 * @returns {Reactive<T extends object>}
 */
export declare function resistant<T extends ReactAble, R extends boolean = true>(name: string, object: T, recursive?: boolean, protect?: string[]): R extends true ? Reactivities<T> : Reactive<T>;
export declare function forget(name: string): void;
/**
 * Register an object/array to the Persistent Store.
 * @param {string} name
 * @param {T} object
 * @param {boolean} recursive
 * @param {string[]} protect
 * @returns {R extends true ? Reactivities<T> : Reactive<T>}
 */
export declare function persistent<T extends ReactAble, R extends boolean = true>(name: string, object: T, recursive?: boolean, protect?: string[]): R extends true ? Reactivities<T> : Reactive<T>;
export declare function purge(name: string): void;
export {};
