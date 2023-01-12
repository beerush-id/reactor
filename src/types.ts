export type GenericType = 'string' | 'number' | 'object' | 'array' | 'date' | 'function' | 'boolean';
export type ItemTypeOf<T> = T extends readonly (infer U)[] ? U : never;

export type Store<T> = { subscribe: Subscribe<T>; set: Setter<T>; }
export type Filtered<T> = Pick<T, {
  [K in keyof T]: T[K] extends Restricted ? never : T[K] extends Restricted[] ? never : K;
}[keyof T]>;
export type Reactive<T> = T & Store<T>;
export type Reactivities<T> = T & Merge<Store<T>, (
  T extends object[]
  ? Reactivities<ItemTypeOf<T>>[]
  : T extends object
    ? {
      [K in keyof Filtered<T>]: T[K] extends Restricted
                                ? T[K]
                                : T[K] extends Restricted[]
                                  ? T[K]
                                  : Reactivities<T[K]>;
    }
    : T)>;
export type Merge<T, S> = {
  [K in keyof T]: T[K];
} & S;

export type Subscribe<T> = (fn: Subscriber<T>, init?: boolean) => Unsubscribe;
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
export type Restricted = string | number | boolean | bigint | symbol | null | undefined;
export type ReactAble = object[] | object;

// export type ShouldReact<T, R> = R extends true ? Reactive<T> : T;
// export type ReactiveArray<T extends unknown[], R> = Merge<Store<T>, (ItemTypeOf<T> extends object
//                                                                      ? ReactiveObject<ItemTypeOf<T>, R>[]
//                                                                      : T)>;
// export type ReactiveObject<T extends object, R> = Merge<Store<T>, {
//   [K in keyof ReactiveAble<T>]: ShouldReact<ReactiveAble<T>[K], R>
// }>;
// export type ReactiveIt<T, R> = (T extends unknown[]
//                                 ? ReactiveArray<T, R>
//                                 : T extends object
//                                   ? ReactiveObject<T, R>
//                                   : T);
// export type Reactive<T, R = false> = T & Merge<Store<T>, ReactiveIt<T, R>>;
// export type Reactivities<T> = Reactive<T, true>;

