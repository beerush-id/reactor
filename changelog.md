# Changelog

## v0.9.1

- Added `setBaseURL()` to set the `fetch()` base url when no url given (or `url = ''`), so the request URL will
  become `BASE_URL/{location.pathname}{location.earch}`.

## v0.9.0

- Add `prefetch()` function that returns almost the same object as `fetch()`. The difference is, `prefetch()` don't
  do the request, so you need to call the `__refresh()` to run the request. The returned object also has a success
  status (`__status: 200, ...`) without a `response` object.
- The request only happens in browser or any environment where `window.fetch` exist. This could fix the unused request
  during SSR since the renders doesn't actually wait for the request because the returned object is a Reactive object (
  non-blocking), not a promise.
- When calling `fetch()` or `prefetch()` but the `url` is an empty string, it'll automatically use
  the `location.pathname` and `location.search` to prevent accessing to a wrong cache.
- The `__refresh()` function now can accept two arguments, `opt` and `update`. The `opt` is a request options to
  override the initial options, and the `update` argument is to tell the function to update the data or not (default
  is `true`).
- Added `__push()` function to the `ReactiveResponse` object to do a write request. This function also can take two
  arguments like `__refresh()`. If no options defined or no `body` in the options, the function will use the initial
  data as the request `body`. By default, this function will do a `post` request. You can set the `method` options
  to `put` or `patch` if you don't want to do a `post` request.
- Added `watch()` function to record the changed properties of an object/array.
- The `__request` object now held the url and request options (`{ url, options }`) for detailed reference.

## v0.8.0

- Important fixes for the subscription to specific actions or properties.

## v0.7.0

- Improved typings.
- Mark as minor version.

## v0.6.9

- Updated `.subscribe.for()`, now takes 3 arguments. `(actions: string[], handler: fn, props?: string[])`.
- Added `.subscribe.actions(actions: string[], handler: fn)` to subscribe to specific actions.
- Added `.subscribe.props(props: string[], handler: fn)` to subscribe to specific properties.

## v0.6.8

- Allow to subscribe to specific property changes, so will get notified only when the changed property is the one that
  listed. E.g, `.subscribe(() => {}, false, ['set'], ['name'])`, it'll get notified when the property `name` is changed.

## v0.6.7

- Improve `ReactiveResponse` type.

## v0.6.5

- Add `recursive` to the `fetch()` options to mark the object as a recursively reactive or not. Default is `true`. For
  example, to mark as non-recursive you can pass `{ recursive: false }` to the `fetch()` options.

## v0.6.3

- Exclude `cache` and `cachePeriod` from the `fetch()` cache key to allow having two identical request, one just for
  subscription and one to re-fetch the data. For example, the breadcrumb component call the `fetch()` without cache
  option, and the overview component call the `fetch()` with `cache` option to re-fetch the data. By doing this, only
  one network request sent because those requests are identical.

## v0.6.2

- Fix missing `__finishedAt` when request failed.

## v0.6.0

- Added new `fetch()` helper.
- `Array` now converted to a `Proxy` object.
- `protect` option still change the original object, but does not notify the subscribers about the change.

## v0.5.0

- Allow to subscribe to specific mutations. E.g, `subscribe(() => {}, false, ['push', 'splice']`.
- Removed array `concat` mirror as it's not a mutation.
- Added `sort`, `reverse`, and `unshift` to the array mirrored methods.

## v0.4.4

- Typing improvements.
- Error handling.
