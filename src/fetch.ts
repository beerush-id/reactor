import { resistant } from './store';
import { ReactAble, Reactive, Reactivities } from './types';

export type ReactiveResponse<T extends ReactAble, R extends boolean = true> =
  (R extends true ? Reactivities<T> : Reactive<T>)
  & {
  __status: number;
  __statusText: number;
  __finishedAt: Date;
  __request?: ReactiveRequest;
  __response?: Response;
  __error?: Error;
  __refresh(): void;
}

export type ReactiveRequest = Request & {
  cachePeriod?: number;
  recursive?: boolean;
}

declare var global: any;

let load: (url: string | Response, options?: Request) => Promise<Response>;

if (typeof window === 'object') {
  load = window.fetch as never;
} else if (typeof global === 'object') {
  load = global.fetch as never;
}

const activeRequests: {
  [key: string]: unknown;
} = {};

export function fetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  object: T,
  options: Partial<ReactiveRequest> = {}
): ReactiveResponse<T, R> {
  if (typeof load !== 'function') {
    throw new Error('Native fetch API is not available, but required!');
  }

  const key = JSON.stringify({ url, options: { ...options, cache: null, cachePeriod: null, recursive: null } });
  const state = resistant<T, R>(key, object, options.recursive, [
    '__refresh', '__request', '__response'
  ]);

  if (!('__refresh' in state)) {
    Object.assign(state, {
      __refresh: () => {
        if (activeRequests[key]) {
          return;
        }

        Object.assign(state, {
          __status: 0,
          __statusText: '',
          __error: null,
        });

        activeRequests[key] = load(url, options as never)
          .then(res => {
            if (res.status < 300) {
              res.json()
                .then(data => {
                  if (Array.isArray(data) && Array.isArray(state)) {
                    (state as unknown[]).splice(0, (state as unknown[]).length, ...data);
                  } else {
                    for (const [ key, value ] of Object.entries(data)) {
                      if (state[key as never] !== value) {
                        state[key as never] = value as never;
                      }
                    }

                    Object.keys(state).forEach(key => {
                      if (!data.hasOwnProperty(key)) {
                        delete state[key as never];
                      }
                    });
                  }

                  Object.assign(state, {
                    __status: res.status,
                    __statusText: res.statusText,
                    __response: res,
                    __finishedAt: new Date(),
                  });
                })
                .catch(error => {
                  Object.assign(state, {
                    __status: 500,
                    __statusText: error.message,
                    __error: error,
                    __finishedAt: new Date(),
                  });
                });
            } else {
              Object.assign(state, {
                __status: res.status,
                __statusText: res.statusText,
                __response: res,
                __error: new Error(res.statusText),
                __finishedAt: new Date(),
              });
            }
          })
          .catch(error => {
            Object.assign(state, {
              __status: 500,
              __statusText: error.message,
              __error: error,
              __finishedAt: new Date(),
            });
          })
          .finally(() => {
            delete activeRequests[key];
          });
      }
    });

    Object.assign(state, {
      __status: 0,
      __statusText: '',
      __finishedAt: null,
      __request: options,
      __response: null,
      __error: null,
    });

    for (const key of
      [ '__status', '__statusText', '__error', '__finishedAt', '__request', '__response', '__refresh' ]) {
      Object.defineProperty(state, key, { enumerable: false });
    }
  }

  const { cache, cachePeriod } = options;

  if (cache === 'reload' || !(state as ReactiveResponse<T>).__finishedAt) {
    (state as ReactiveResponse<T>).__refresh();
  } else if (cachePeriod) {
    const period = (state as ReactiveResponse<T>).__finishedAt.getTime() + (cachePeriod || 60000);
    const now = new Date().getTime();

    if (now >= period) {
      (state as ReactiveResponse<T>).__refresh();
    }
  }

  return state as never;
}
