# Changelog

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
