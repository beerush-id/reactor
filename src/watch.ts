import { read, write } from '@beerush/utils';
import { reactive } from './reactive.js';
import type { Action, ReactAble, Reactive } from './types.js';

export type Change = {
  /** The changed path */
  path: string;
  /** The change action (set, delete, etc) */
  action: Action;
  /** Current value */
  value: unknown;
  /** Previous value */
  before: unknown;
};

export type ChangeList = Change[];

export type History<T extends ReactAble> = {
  /** The changed properties */
  changes: Partial<T>;
  /** Function to undo the previous change */
  undo: (() => void) & { list: ChangeList };
  /** Function to redo the previous change */
  redo: (() => void) & { list: ChangeList };
  /** Function to reset to initial state */
  reset: () => void;
  /** Function to mark the history as unchanged */
  clear: () => void;
  /** Function to stop watching the changes */
  forget: () => void;

  /** Does the state is changed? */
  readonly changed: boolean;
  /** Can we call `.undo()`? */
  readonly canUndo?: boolean;
  /** Can we call `.redo()`? */
  readonly canRedo?: boolean;
};

export let HISTORY_DEBOUNCE = 500;

/**
 * Watch the changed properties of a **`State`** (Reactive object).
 *
 * @example
 * ```js
 * const form = reactive({ verified: false });
 * const history = watch(form);
 *
 * form.name = 'John';
 *
 * // Logs: { name: 'John' }
 * console.log(history.changes);
 * ```
 * Undo the changes.
 * @example
 * ```js
 * const form = reactive({ verified: false });
 * const history = watch(form);
 *
 * form.name = 'Smith';
 *
 * // Logs: { name: 'Smith' }
 * console.log(history.changes);
 *
 * history.undo();
 * // Logs: {}
 * console.log(history.changes);
 * ```
 * @param {Reactive<T>} state - Reactive object to watch.
 * @param {number} debounce - Debounce time in ms.
 * @returns {Reactive<History<T>>}
 */
export function watch<T extends ReactAble>(
  state: Reactive<T>,
  debounce?: number,
): Reactive<History<T>> {
  const timers: { [key: string]: number } = {};
  const origin = JSON.parse(JSON.stringify(state));
  const undoList: ChangeList = [];
  const redoList: ChangeList = [];

  let selfChange = false;

  const changes: Partial<T> = {};
  const forget = state.subscribe((self, prop, value, action, path) => {
    if (
      path &&
      ![
        '__status',
        '__statusText',
        '__error',
        '__finishedAt',
        '__request',
        '__response',
        '__refresh',
        '__push',
      ].includes(path as never)
    ) {
      if (path && action) {
        if (selfChange) {
          selfChange = false;
        } else {
          note(action, path, value);
        }
      }
    }
  }, false);

  const note = (action: Action, path: string, value: unknown) => {
    if (timers[path]) {
      clearTimeout(timers[path]);
    }

    (timers as any)[path] = setTimeout(
      () => {
        const prev = undoList.filter((c) => c.path === path);
        const before = prev.length ? prev[prev.length - 1].value : read(origin as never, path as never);

        undoList.push({ action, path, value, before });
        write(history.changes, path as any, value as any);

        if (redoList.length) {
          redoList.splice(0, redoList.length);
        }

        history.set({} as never, 'changes', 'set');
      },
      typeof debounce === 'number' ? debounce : HISTORY_DEBOUNCE,
    );
  };

  const reset = () => {
    while (undoList.length) {
      undo();
    }

    for (const key of Object.keys(history.changes)) {
      delete history.changes[key as never];
    }

    history.set({} as never, 'changes', 'set');
  };

  const clear = () => {
    for (const key of Object.keys(history.changes)) {
      delete history.changes[key as never];
    }

    undoList.splice(0, undoList.length);
    redoList.splice(0, redoList.length);

    history.set({} as never, 'changes', 'set');
  };

  const undo = () => {
    if (undoList.length) {
      const change = undoList.pop();

      if (change) {
        selfChange = true;
        write(history.changes, change.path as any, change.before as any);
        write(state, change.path as any, change.before as any);
        redoList.unshift(change);

        if (!undoList.length) {
          reset();
        }
      }
    }

    history.set({} as never, 'changes', 'set');
  };
  undo.list = undoList;

  const redo = () => {
    if (redoList.length) {
      const change = redoList.shift();

      if (change) {
        selfChange = true;
        write(history.changes, change.path as any, change.value as any);
        write(state, change.path as any, change.value as any);
        undoList.push(change);
      }
    }

    history.set({} as never, 'changes', 'set');
  };
  redo.list = redoList;

  const history = reactive<History<T>, false>(
    {
      changes,
      undo,
      redo,
      reset,
      clear,
      forget,
      get changed() {
        return Object.keys(changes).length > 0;
      },
      get canUndo() {
        return undoList.length > 0;
      },
      get canRedo() {
        return redoList.length > 0;
      },
    },
    false,
  );

  return history;
}

/**
 * Set the global debounce time. You must call this function on the top level of your module before calling the
 * `.watch()` function.
 * @param {number} duration
 */
watch.debounce = (duration: number) => {
  HISTORY_DEBOUNCE = duration;
};
