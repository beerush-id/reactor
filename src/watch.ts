import { reactive } from './reactive';
import { ReactAble, Reactive, Reactivities } from './types';

export type History<T extends ReactAble> = {
  changes: Partial<T>;
  changed: boolean;
  reset: () => void;
  forget: () => void;
}

export function watch<T extends ReactAble>(state: Reactive<T>): Reactivities<History<T>> {
  const changes: Partial<T> = {};
  const forget = state.subscribe((self, prop, value, action, path, target) => {
    if (path && ![
      '__status',
      '__statusText',
      '__error',
      '__finishedAt',
      '__request',
      '__response',
      '__refresh',
      '__push'
    ].includes(path as never)) {
      history.changes[path as keyof T] = value;

      const changed = Object.keys(history.changes).length > 0;
      if (history.changed !== changed) {
        history.changed = changed;
      }
    }
  }, false);

  const reset = () => {
    for (const key of Object.keys(changes)) {
      delete changes[key as never];
    }

    history.changed = false;
  };

  const history = reactive<History<T>, true>({ changes, forget, reset, changed: false }, true);
  return history;
}
