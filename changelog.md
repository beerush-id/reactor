# Changelog

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
