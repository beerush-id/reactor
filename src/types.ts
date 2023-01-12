export type GenericType = 'string' | 'number' | 'object' | 'array' | 'date' | 'function' | 'boolean';

export function typeOf(obj: unknown): GenericType {
  return toString.call(obj).replace(/\[object /, '').replace(/]/, '').toLowerCase() as GenericType;
}

export type ItemTypeOf<T> = T extends readonly (infer U)[] ? U : never;

export type Store<T> = { subscribe: Subscribe<T>; set: Setter<T>; }
export type SubReactive<T, R> = R extends true ? (T extends unknown[] ? Reactive<ItemTypeOf<T>, R>[] : { [K in keyof T]: Reactive<T[K], R> }) : T;
export type Reactive<T, R extends boolean = false> = T & Store<T> & SubReactive<T, R>;

export type Subscribe<T> = (fn: Subscriber<T>) => Unsubscribe;
export type Subscriber<T> = (
  self?: T,
  prop?: keyof T,
  value?: T[keyof T],
  action?: string,
  path?: string,
  target?: unknown
) => void;
export type Unsubscribe = UnsubscribeFn & {
  unsubscribe?: () => void;
};
type UnsubscribeFn = () => void;

export type Setter<T> = (value?: T, prop?: keyof T, action?: string, path?: string, target?: unknown) => void;
export type ReactAble = {
  [key: string]: unknown;
} | { [key: string]: unknown }[];
