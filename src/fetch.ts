import { replace, replaceItems } from '@beerush/utils';
import { forget, resistant } from './store';
import { ReactAble, Reactive, Reactivities } from './types';

export type ReactiveResponse<T extends ReactAble, R extends boolean = true> =
  (R extends true ? Reactivities<T> : Reactive<T>)
  & {
  __status: number;
  __statusText: number;
  __finishedAt?: Date | void;
  __request?: { url: string, options: Partial<ReactiveRequest> };
  __response?: Response;
  __error?: Error;
  __refresh(opt?: Partial<ReactiveRequest>, update?: boolean): void;
  __push(opt?: Partial<ReactiveRequest>, update?: boolean): void;
}

export type ReactiveRequest = Request & {
  backendCache?: boolean;
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

let BASE_URL = '';

export function setBaseURL(url: string) {
  BASE_URL = url;
}

export async function dfetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest> = {}
): Promise<ReactiveResponse<T, R>> {
  if (typeof window === 'undefined') {
    const state = fetch(url, init, options);
    await new Promise(resolve => state.subscribe(resolve, false));
    return state;
  } else {
    return fetch(url, init, options);
  }
}

export function fetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest> = {}
): ReactiveResponse<T, R> {
  const state = prefetch(url, init, options, {
    __status: 0,
    __statusText: '',
    __error: null,
    __finishedAt: null
  } as never);
  const { cache, cachePeriod } = options;

  if (cache === 'reload' || !(state as ReactiveResponse<T>).__finishedAt) {
    (state as ReactiveResponse<T>).__refresh();
  } else if (cachePeriod) {
    const period = ((state as ReactiveResponse<T>).__finishedAt as Date).getTime() + (cachePeriod || 60000);
    const now = new Date().getTime();

    if (now >= period) {
      (state as ReactiveResponse<T>).__refresh();
    }
  }

  return state as never;
}

export function prefetch<T extends ReactAble, R extends boolean = true>(
  url: string,
  init: T,
  options: Partial<ReactiveRequest> = {},
  initStatus = {
    __status: 200,
    __statusText: 'Ok',
    __error: null,
    __finishedAt: new Date(),
  }
): ReactiveResponse<T> {
  if (typeof load !== 'function') {
    throw new Error('Native fetch API is not available, but required!');
  }

  if (typeof window !== 'undefined' && url.replace(/\s+/g, '') === '') {
    const base = BASE_URL
      .replace(/\/+$/, '');
    const path = `${ location.pathname }${ location.search }`
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');
    url = `${ base }/${ path }`;
  }

  const key = JSON.stringify({ url, options: { ...options, cache: null, cachePeriod: null, recursive: null } });
  const state = resistant<T, R>(key, init, options.recursive, [
    '__refresh', '__request', '__response'
  ]);

  if (!('__refresh' in state)) {
    Object.assign(state, {
      __refresh: (opt?: Partial<ReactiveRequest>, update = true) => {
        if (activeRequests[key]) {
          return;
        }

        Object.assign(state, {
          __status: 0,
          __statusText: '',
          __error: null,
        });

        activeRequests[key] = load(url, (opt || options) as never)
          .then(res => {
            if (res.status < 300) {
              res.json()
                .then(data => {
                  if (update) {
                    if (Array.isArray(data) && Array.isArray(state)) {
                      replaceItems(state, data);
                    } else {
                      replace(state, data);
                    }
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

            if (typeof window !== 'undefined') {
              forget(key);
            }
          });
      },
      __push: (opt?: Partial<ReactiveRequest>, update = true) => {
        if (!opt || (opt && !opt.body)) {
          (state as ReactiveResponse<T>).__refresh({
            method: 'post',
            body: JSON.stringify(init) as never,
            ...(opt || options || {}),
          }, update);
        } else {
          (state as ReactiveResponse<T>).__refresh({
            method: 'post',
            ...(opt || options || {})
          });
        }
      }
    });

    Object.assign(state, {
      ...initStatus,
      __request: { url, options },
      __response: null,
    });

    for (const key of
      [ '__status', '__statusText', '__error', '__finishedAt', '__request', '__response', '__refresh', '__push' ]) {
      Object.defineProperty(state, key, { enumerable: false });
    }
  }

  return state as never;
}
