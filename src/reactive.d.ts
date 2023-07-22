import type { ArrayAction, ObjectAction, ReactAble, Reactive, Reactivities } from './types.js';
export declare const OBJECT_MUTATIONS: ObjectAction[];
export declare const ARRAY_MUTATIONS: ArrayAction[];
export declare function reactive<T extends ReactAble, R extends boolean = false>(source: T, recursive?: boolean, protect?: string[]): R extends true ? Reactivities<T> : Reactive<T>;
