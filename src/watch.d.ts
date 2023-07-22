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
    undo: (() => void) & {
        list: ChangeList;
    };
    /** Function to redo the previous change */
    redo: (() => void) & {
        list: ChangeList;
    };
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
export declare let HISTORY_DEBOUNCE: number;
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
export declare function watch<T extends ReactAble>(state: Reactive<T>, debounce?: number): Reactive<History<T>>;
export declare namespace watch {
    var debounce: (duration: number) => void;
}
