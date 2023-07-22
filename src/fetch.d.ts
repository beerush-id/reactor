import type { ReactAble, Reactive, Reactivities } from './types.js';
export type ReactiveResponse<T extends ReactAble, R extends boolean = true> = (R extends true ? Reactivities<T> : Reactive<T>) & {
    __status: number;
    __statusText: number;
    __finishedAt?: Date | void;
    __request?: {
        url: string;
        options: Partial<ReactiveRequest>;
    };
    __response?: Response;
    __error?: Error;
    __refresh(opt?: Partial<ReactiveRequest>, update?: boolean): void;
    __push(opt?: Partial<ReactiveRequest>, update?: boolean): void;
};
export type ReactiveRequest = Request & {
    backendCache?: boolean;
    cachePeriod?: number;
    recursive?: boolean;
};
export declare function setBaseURL(url: string): void;
export declare function dfetch<T extends ReactAble, R extends boolean = true>(url: string, init: T, options?: Partial<ReactiveRequest>): Promise<ReactiveResponse<T, R>>;
export declare function fetch<T extends ReactAble, R extends boolean = true>(url: string, init: T, options?: Partial<ReactiveRequest>): ReactiveResponse<T, R>;
export declare function prefetch<T extends ReactAble, R extends boolean = true>(url: string, init: T, options?: Partial<ReactiveRequest>, initStatus?: {
    __status: number;
    __statusText: string;
    __error: null;
    __finishedAt: Date;
}): ReactiveResponse<T>;
