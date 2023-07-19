import { read, write } from '@beerush/utils';
import { ARRAY_MUTATIONS, OBJECT_MUTATIONS, reactive } from './reactive.js';
import type { ArrayAction, ObjectAction, ReactAble, Reactive, Reactivities, StateChangeMessage } from './types.js';

const STORE_NAME = 'reactor-persistent-data';

type PersistentData = {
  data: Reactive<unknown>;
  recursive?: boolean;
};

export let ReactiveStore: {
  [key: string]: Reactive<never>;
} = {};

export let PersistentStore: {
  version: string;
  store: {
    [key: string]: PersistentData;
  };
  claims: string[];
  reflects?: string[];
  channel?: BroadcastChannel;
  clear: () => void;
  write: () => void;
} = {
  version: '1.0.0',
  store: {},
  claims: [],
  clear: () => {
    PersistentStore.store = {};
    PersistentStore.write();
  },
  write: () => {
    try {
      const { version, store } = PersistentStore;
      localStorage.setItem(STORE_NAME, JSON.stringify({ version, store }));
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

        for (const [ name ] of Object.entries(PersistentStore.store)) {
          PersistentStore.claims.push(name);
        }
        //
        // for (const [ , value ] of Object.entries(PersistentStore.store)) {
        //   value.data = reactive(value.data, value.recursive);
        //   value.data.subscribe(() => PersistentStore.write());
        // }
      } else {
        PersistentStore.write();
      }
    } catch (error) {
      console.warn('localStorage is not accessible, read ignored!');
      console.error(error);
    }

    window['PersistentStore' as never] = PersistentStore as never;
  }

  if (!PersistentStore.channel) {
    const channel = new BroadcastChannel(STORE_NAME);

    channel.addEventListener('message', ({ data }: MessageEvent<string>) => {
      try {
        reflect(JSON.parse(data));
      } catch (error) {
        console.warn('Unable to reflect Changes!');
        console.error(error);
      }
    });

    PersistentStore.channel = channel;
  }
}

export function reflect({ store, path, action, value }: StateChangeMessage) {
  if (!store || !path) {
    return;
  }

  const state = PersistentStore.store[store]?.data;

  if (!state) {
    return;
  }

  PersistentStore.reflects?.push(`${ store }:${ path }:${ action }`);

  if (OBJECT_MUTATIONS.includes(action as ObjectAction)) {
    if (action === 'set') {
      write(state, path, value);
    } else {
      const pathParts = path.split('.');

      if (pathParts.length > 1) {
        const key = pathParts.pop();
        const target = read(state, pathParts.join('.'));

        if (target && typeof target === 'object') {
          delete target[key as never];
        }
      } else {
        delete state[path as never];
      }
    }
  } else if (ARRAY_MUTATIONS.includes(action as ArrayAction)) {
    const target = read(state, path);

    if (Array.isArray(target)) {
      try {
        target[action as never](...(Array.isArray(value) ? value : [ value ]));
      } catch (error) {
        console.warn('Unable to reflect Changes!');
        console.error(error);
      }
    }
  }
}

export function publish(message: StateChangeMessage) {
  if (PersistentStore.channel) {
    try {
      PersistentStore.channel.postMessage(JSON.stringify(message));
    } catch (error) {
      console.warn('Unable to publish Changes!');
      console.error(error);
    }
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
 * @param protect
 * @returns {Reactive<T extends object>}
 */
export function resistant<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true,
  protect?: string[]
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive<T, R>(object, recursive) as Reactive<T> as never;
  }

  if (!ReactiveStore[name]) {
    ReactiveStore[name] = reactive<T>(object, recursive, protect) as never;
  }

  return ReactiveStore[name] as Reactive<T> as never;
}

export function forget(name: string) {
  if (ReactiveStore[name]) {
    delete ReactiveStore[name];
  }
}

/**
 * Register an object/array to the Persistent Store.
 * @param {string} name
 * @param {T} object
 * @param {boolean} recursive
 * @param {string[]} protect
 * @returns {R extends true ? Reactivities<T> : Reactive<T>}
 */
export function persistent<T extends ReactAble, R extends boolean = true>(
  name: string,
  object: T,
  recursive = true,
  protect?: string[]
): R extends true ? Reactivities<T> : Reactive<T> {
  if (typeof window === 'undefined') {
    return reactive<T>(object, recursive) as Reactive<T> as never;
  }

  if (PersistentStore.claims?.includes(name)) {
    const data = PersistentStore.store[name]?.data;

    Object.assign(object, data || {});

    const state = reactive(object, recursive, protect) as Reactive<unknown>;
    state.subscribe((self, prop, value, action, path) => {
      const key = `${ name }:${ path }:${ action }`;
      const index = PersistentStore.reflects?.indexOf(key);

      if (index !== undefined && index > -1) {
        PersistentStore.reflects?.splice(index, 1);
        return;
      } else {
        publish({ store: name, path, value, action } as never);
        PersistentStore.write();
      }
    }, false);

    PersistentStore.store[name] = { data: state, recursive };
    PersistentStore.claims.splice(PersistentStore.claims.indexOf(name), 1);
  }

  if (!PersistentStore.store[name]) {
    const data: Reactive<unknown> = reactive<T>(object, recursive, protect) as Reactive<unknown>;
    data.subscribe((self, prop, value, action, path) => {
      const key = `${ name }:${ path }:${ action }`;
      const index = PersistentStore.reflects?.indexOf(key);

      if (index !== undefined && index > -1) {
        PersistentStore.reflects?.splice(index, 1);
        return;
      } else {
        publish({ store: name, path, value, action } as never);
        PersistentStore.write();
      }
    }, false);

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
