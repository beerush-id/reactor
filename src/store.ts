import { reactive } from './reactive';
import type { ReactAble, Reactive, Reactivities } from './types';

const STORE_NAME = 'reactor-persistent-data';

type PersistentData = {
  data: Reactive<unknown>;
  recursive?: boolean;
}

export let ReactiveStore: {
  [key: string]: Reactive<never>;
} = {};

export let PersistentStore: {
  version: string;
  store: {
    [key: string]: PersistentData;
  },
  clear: () => void,
  write: () => void,
} = {
  version: '1.0.0',
  store: {},
  clear: () => {
    PersistentStore.store = {};
    PersistentStore.write();
  },
  write: () => {
    try {
      localStorage.setItem(STORE_NAME, JSON.stringify(PersistentStore));
    } catch (error) {
      console.warn('localStorage is not accessible, write ignored!');
      console.error(error);
    }
  },
};

if (typeof window === 'object') {
  if (window['ReactiveStore' as never]) {
    ReactiveStore = window['ReactiveStore' as never] as never;
  } else {
    window['ReactiveStore' as never] = ReactiveStore as never;
  }

  if (window['PersistentStore' as never]) {
    PersistentStore = window['PersistentStore' as never] as never;
  } else {
    try {
      const data = localStorage.getItem(STORE_NAME);

      if (data) {
        Object.assign(PersistentStore, JSON.parse(data));

        for (const [ , value ] of Object.entries(PersistentStore.store)) {
          value.data = reactive(value.data, value.recursive);
          value.data.subscribe(() => PersistentStore.write());
        }
      } else {
        PersistentStore.write();
      }
    } catch (error) {
      console.warn('localStorage is not accessible, read ignored!');
      console.error(error);
    }

    window['PersistentStore' as never] = PersistentStore as never;
  }
}

export function upgrade(version: string) {
  if (PersistentStore.version !== version) {
    PersistentStore.version = version;
    PersistentStore.clear();
  }
}

/**
 * Register an object/array to the ReactiveStore.
 * @param {string} name - name in the store.
 * @param {T extends object} object - Object/Array to register and make it reactive.
 * @param recursive - Transform object inside an array as well.
 * @returns {Reactive<T extends object>}
 */
export function resistant<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive<T, R>(object, recursive) as Reactive<T> as never;
  }

  if (!ReactiveStore[name]) {
    ReactiveStore[name] = reactive<T>(object, recursive) as never;
  }

  return ReactiveStore[name] as Reactive<T> as never;
}

export function forget(name: string) {
  if (ReactiveStore[name]) {
    delete ReactiveStore[name];
  }
}

export function persistent<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive<T>(object, recursive) as Reactive<T> as never;
  }

  if (!PersistentStore.store[name]) {
    const data: Reactive<unknown> = reactive<T>(object, recursive) as Reactive<unknown>;
    data.subscribe(() => PersistentStore.write());
    PersistentStore.store[name] = { data, recursive };
    PersistentStore.write();
  }

  return PersistentStore.store[name].data as Reactive<T> as never;
}

export function purge(name: string): void {
  if (PersistentStore.store[name]) {
    delete PersistentStore.store[name];
    PersistentStore.write();
  }
}
