import { ReactAble, Reactive, Store, Subscriber, typeOf, Unsubscribe } from './types';

export function reactive<T extends ReactAble, R extends boolean = false>(
  source: T,
  recursive?: boolean,
  protect: string[] = [ 'set', 'subscribe' ]
): Reactive<T, R> {
  const reflected: T & Store<T> = source as never;
  const subscribers: Subscriber<T>[] = [];
  let self: Reactive<T>;

  const subscribe = (handler: Subscriber<T>): Unsubscribe => {
    handler(self);

    subscribers.push(handler);

    const unsub: Unsubscribe = () => {
      subscribers.splice(subscribers.indexOf(handler), 1);
    };
    unsub.unsubscribe = () => unsub();

    return unsub;
  };

  const set = (value?: unknown, prop?: keyof T, action?: string, path?: string, target?: unknown) => {
    if (value === self || (!value && !action)) {
      return;
    }

    if (typeof prop as never === 'string') {
      if (Array.isArray(reflected)) {
        if (target && typeof path === 'string') {
          const i = (reflected as T[]).indexOf(target as never);

          if (i > -1) {
            path = path ? `${ i }.${ path }` : i as never;
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
        notify(self, prop, value as never, action, path, target);
      }
    }
  };

  const handler: ProxyHandler<T> = {
    set: (target: T, prop: string, newValue: ReactAble | Reactive<ReactAble>, receiver: unknown): boolean => {
      if (protect.includes(prop)) {
        return true;
      }

      if (target[prop as never] === newValue) {
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
      if (protect.includes(prop)) {
        return true;
      }

      if (typeof target[prop as never] === 'undefined') {
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
    for (const method of [ 'concat', 'copyWithin', 'fill', 'pop', 'push', 'shift', 'splice' ]) {
      const fn = reflected[method as never];

      (reflected)[method as never] = (...args: unknown[]) => {
        const result = (fn as any).bind(reflected)(...args);
        reactAllItems(reflected as never, recursive);
        self.set(args as never, '' as keyof T, method);
        return result;
      };

      Object.defineProperty(reflected, method, { enumerable: false });
    }

    if (recursive) {
      reactAllItems(reflected as never, recursive);
    }

    self = reflected as Reactive<T, R>;
    return reflected as Reactive<T, R>;
  } else {
    const proxy = new Proxy(reflected, handler);

    if (recursive) {
      reactAllProps(reflected as never, recursive);
    }

    self = proxy as Reactive<T, R>;
    return proxy as Reactive<T, R>;
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
        if (item.subscribe) {
          (item as Reactive<T>).subscribe((o, p, n, a, h, t) => {
            proxy.set(n as never, p, a, h, t);
          });
        }

        if (!item.subscribe) {
          const reacted = reactive(item, recursive);
          reacted.subscribe((o, p, n, a, h, t) => {
            proxy.set(n as never, p as keyof T, a, h, t);
          });

          proxy[i] = reacted;
        }
      }
    });
  }
}
