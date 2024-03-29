import type {
  Action,
  ArrayAction,
  GenericType,
  ObjectAction,
  ReactAble,
  Reactive,
  Reactivities,
  Store,
  Subscriber,
  Unsubscribe,
} from './types.js';

export const OBJECT_MUTATIONS: ObjectAction[] = [ 'set', 'delete' ];
export const ARRAY_MUTATIONS: ArrayAction[] = [
  'copyWithin',
  'fill',
  'pop',
  'push',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
];

export function reactive<T extends ReactAble, R extends boolean = false>(
  source: T,
  recursive?: boolean,
  protect: string[] = [ 'set', 'subscribe' ],
): R extends true ? Reactivities<T> : Reactive<T> {
  const reflected: T & Store<T> = source as never;
  const subscribers: Subscriber<T>[] = [];
  let self: Reactive<T>;

  const subscribe = (
    handler: Subscriber<T>,
    init = true,
    actions?: Action[],
    props?: string[],
  ): Unsubscribe => {
    if (init) {
      handler(self);
    }

    if (Array.isArray(actions)) {
      handler.actions = actions;
    }

    if (Array.isArray(props)) {
      handler.props = props;
    }

    subscribers.push(handler);

    const unsub: Unsubscribe = () => {
      subscribers.splice(subscribers.indexOf(handler), 1);
    };
    unsub.unsubscribe = () => unsub();

    return unsub;
  };

  subscribe.for = (actions: Action[], handler: Subscriber<T>, props?: string[]) => {
    return subscribe(handler, false, actions, props);
  };

  subscribe.actions = (actions: Action[], handler: Subscriber<T>) => {
    return subscribe(handler, false, actions);
  };

  subscribe.props = (props: string[], handler: Subscriber<T>) => {
    return subscribe(handler, false, undefined, props);
  };

  const set = (
    value?: unknown,
    prop?: keyof T,
    action?: Action,
    path?: string,
    target?: unknown,
  ) => {
    if (value === self || (!value && !action)) {
      return;
    }

    if ((typeof prop as never) === 'string') {
      if (Array.isArray(reflected)) {
        if (target && typeof path === 'string') {
          const i = (reflected as T[]).indexOf(target as never);

          if (i > -1) {
            path = path ? `${ i }.${ path }` : (i as never);
            target = self;
          }
        } else {
          path = prop as never;
          target = self;
        }
      } else if (target && typeof path === 'string') {
        for (const [ k, v ] of Object.entries(reflected)) {
          if (v === target) {
            path = path ? `${ k }.${ path }` : k;
            target = self;
          }
        }
      } else {
        path = prop as never;
        target = self;
      }
    }

    for (const notify of subscribers) {
      if (typeof notify === 'function') {
        if (notify.props && notify.actions) {
          if (
            notify.props.includes((path || prop) as never) &&
            notify.actions.includes(action as never)
          ) {
            notify(self, prop, value as never, action, path, target);
          }
        } else if (notify.props) {
          if (notify.props.includes((path || prop) as never)) {
            notify(self, prop, value as never, action, path, target);
          }
        } else if (notify.actions) {
          if (notify.actions.includes(action as never)) {
            notify(self, prop, value as never, action, path, target);
          }
        } else {
          notify(self, prop, value as never, action, path, target);
        }
      }
    }
  };

  const handler: ProxyHandler<T> = {
    set: (
      target: T,
      prop: string,
      newValue: ReactAble | Reactive<ReactAble>,
      receiver: unknown,
    ): boolean => {
      if ([ 'set', 'subscribe' ].includes(prop)) {
        return true;
      }

      if (target[prop as never] === newValue) {
        return true;
      }

      if (protect.includes(prop)) {
        Reflect.set(target, prop, newValue, receiver);
        return true;
      }

      if (recursive && [ 'array', 'object' ].includes(typeOf(newValue))) {
        if ((newValue as Reactive<T>).subscribe) {
          (newValue as Reactive<T>).subscribe((o, p, n, a, h, t) => {
            self.set(n as never, p, a, h, t);
          });

          Reflect.set(target, prop, newValue, receiver);
        } else {
          const reacted = reactive(newValue, recursive);
          reacted.subscribe((o, p, n, a, h, t) => {
            self.set(n as never, p, a, h, t);
          });

          Reflect.set(target, prop, reacted, receiver);
        }
      } else {
        Reflect.set(target, prop, newValue, receiver);
      }

      self.set(newValue as never, prop as keyof T, 'set');
      return true;
    },
    deleteProperty: (target: T, prop: string): boolean => {
      if ([ 'set', 'subscribe' ].includes(prop)) {
        return true;
      }

      if (typeof target[prop as never] === 'undefined') {
        return true;
      }

      if (protect.includes(prop)) {
        Reflect.deleteProperty(target, prop);
        return true;
      }

      Reflect.deleteProperty(target, prop);
      self.set(undefined, prop as never, 'delete');
      return true;
    },
  };

  Object.assign(reflected, { set, subscribe });
  Object.defineProperty(reflected, 'set', { enumerable: false });
  Object.defineProperty(reflected, 'subscribe', { enumerable: false });

  if (Array.isArray(reflected)) {
    for (const method of ARRAY_MUTATIONS) {
      const fn = reflected[method as never];

      (reflected as any)[method as never] = (...args: unknown[]) => {
        const result = (fn as any).bind(reflected)(...args);
        reactAllItems(reflected as never, recursive);
        self.set(args as never, '' as keyof T, method);
        return result;
      };

      Object.defineProperty(reflected, method, { enumerable: false });
    }

    const proxy = new Proxy(reflected, handler);

    if (recursive) {
      reactAllItems(reflected as never, recursive);
    }

    self = proxy as Reactive<T> as never;
    return proxy as Reactive<T> as never;
  } else {
    const proxy = new Proxy(reflected, handler);

    if (recursive) {
      reactAllProps(reflected as never, recursive);
    }

    self = proxy as Reactive<T> as never;
    return proxy as Reactive<T> as never;
  }
}

function reactAllProps<T extends ReactAble>(proxy: Reactive<T>, recursive?: boolean) {
  for (const [ key, value ] of Object.entries(proxy)) {
    if ([ 'array', 'object' ].includes(typeOf(value))) {
      if ((value as Reactive<T>).subscribe) {
        (value as Reactive<T>).subscribe((o, p, n, a, h, t) => {
          proxy.set(n as never, p, a, h, t);
        });
      }

      if (!(value as Reactive<T>).subscribe) {
        const reacted = reactive<T>(value as never, recursive);
        reacted.subscribe((o, p, n, a, h, t) => {
          proxy.set(n as never, p, a, h, t);
        });

        proxy[key as keyof T] = reacted as never;
      }
    }
  }
}

function reactAllItems<T extends ReactAble>(proxy: Reactive<T>, recursive?: boolean) {
  if (Array.isArray(proxy)) {
    proxy.forEach((item, i) => {
      if ([ 'array', 'object' ].includes(typeOf(item))) {
        if ('subscribe' in item) {
          (item as Reactive<T>).subscribe((o, p, n, a, h, t) => {
            proxy.set(n as never, p, a, h, t);
          });
        }

        if (!('subscribe' in item)) {
          const reacted = reactive(item, recursive);
          reacted.subscribe((o, p, n, a, h, t) => {
            proxy.set(n as never, p, a, h, t);
          });

          proxy[i] = reacted;
        }
      }
    });
  }
}

function typeOf(obj: unknown): GenericType {
  return toString
    .call(obj)
    .replace(/\[object /, '')
    .replace(/]/, '')
    .toLowerCase() as GenericType;
}
