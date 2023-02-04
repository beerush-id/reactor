# `@beerush/reactor`

Reactor is a Javascript Proxy helper to transform any object/array into a reactive object/array, recursively!

For example, in Svelte, instead doing `todo.done = true; todos = todos;` we can simply
do `todo.done = true` and the component will be updated, no need to call the `.set()`
method or reassigning the variable.

### Getting Started

- [Usage](#usage)
- [Reactive](#reactive)
- [Subscription](#subscription)
    - [Handler](#subscription-handler)
- [Named Store](#named-store)
- [Persistent Store](#persistent-store)
    - [Remove Persistent Store](#removing-persistent-store)
- [Reactive Fetch](#reactive-fetch)
    - [Prefetch](#prefetch)
- [History](#history)

> For a summary of the most recent changes, please
> see [changelog.md](https://github.com/beerush-id/reactor/tree/main/changelog.md).

With reactor, we can subscribe to the data changes, and will get notified
when the data changes. Changing the data simply assigning value.

Reactive object is a Proxy object with additional property `.subcribe()`, and optional `.set()` function.

Let's take a look at the sample below:

**Without Reactor**

```svelte

<script>

  let todos = [];

  const add = () => {
    todos.push({ text: 'Todo', checked: false });

    // Without this, it won't be re-rendered.
    todos = todos;
  };
  const toggle = (todo) => {
    todo.checked = !todo.checked;

    // Without this, it won't be re-rendered.
    todos = todos;
  };
</script>
<ul>
  {#each todos as todo}
    <li style:text-decoration={todo.checked ? 'line-through' : 'none'}
        on:click={() => toggle(todo)}>{todo.text}</li>
  {/each}
</ul>
<form action="">
  {#each todos as todo,i}
    <label for="{i}">{todo.text}</label>
    <input type="checkbox" id={i} bind:checked={todo.checked}><br>
  {/each}
</form>
<button on:click={add}>Add</button>

```

**With Reactor**

```svelte

<script>
  import { reactive } from '@beerush/reactor';

  let todos = reactive([]);

  const add = () => {
    todos.push({ text: 'Todo', checked: false });
  };
  const toggle = (todo) => {
    todo.checked = !todo.checked;
  };
</script>
<ul>
  {#each $todos as todo}
    <li style:text-decoration={todo.checked ? 'line-through' : 'none'}
        on:click={() => toggle(todo)}>{todo.text}</li>
  {/each}
</ul>
<form action="">
  {#each $todos as todo,i}
    <label for="{i}">{todo.text}</label>
    <input type="checkbox" id={i} bind:checked={todo.checked}><br>
  {/each}
</form>
<button on:click={add}>Add</button>

```

As you can see from the sample above, without reactor we need
to tell Svelte to update the View by re-assign the variable.

With Reactor, we can simply do what we need (set property, push item, etc.), and
Svelte will re-render the View without manually tells Svelte to do it.

## Usage

```shell
yarn add @beerush/reactor
```

```ts
import { reactive } from '@beerush/reactor';

type Todo = {
  name: string;
}

// Non recursive.
const data = reactive<Todo>({ name: 'Todo' });

// Recursive
const todos = reactive<Todo[], true>([], true);

```

## Reactive

**`reactive(object: object | object[], recursive: boolean = false): Reactive;`**

Reactive function will transform an object into a reactive object. If we
set the `recursive` to `true`, all object/array inside it will be reactive as well,
and will emit an event when the data changed, from bottom to top.

This function will return a reactive object with additional `.subscribe()` function
to subscribe for data changes.

### Subscription

**`.subscribe(handler: Function, init = true, actions?: Action[]): () => Unsubscribe`**

- **`handler`** - Function to handle the change notification.
- **`init`** - Indicate to call the handler at the first subscribe call.
- **`actions`** - Array of mutation type to listen to specific mutations.

The subscription function will return a function to unsubscribe from it. When the unsubscribe function called, you will
not get notified for a data changes anymore.

**Example**

```js
// Make a reactive object.
const obj = reactive({
  a: 1,
  b: 2,
  c: {
    a: 1,
    b: 2,
    c: [ 1, 2, 3 ]
  }
}, true);

// Make a reactive array.
const arr = reactive([]);

// Subscribe for data changes.
const unsub = obj.subscribe(() => {
  console.log('Data changed!');
});

obj.c.c.push([ 4 ]);

// Stop getting notified for data chagnes.
unsub();

// Subscribe for "set" and "delete" action only.
obj.subscribe(() => {
  // ...
}, false, [ 'set', 'delete' ]);

// Susbcribe for specific actions and properties. Only triggered when
// the "name" and "email" property is changed.
obj.subscribe(() => {
  // ...
}, false, [ 'set' ], [ 'name', 'email' ]);

// Subscribe for "set" action and "name" property using alias.
obj.subscribe.for([ 'set' ], (o, prop, value) => {
  console.log(`Property ${prop} changed to ${value}`);
}, [ 'name' ]);

// Subscribe for "set" action using alias.
obj.subscribe.actions([ 'set' ], () => {});

// Susbcribe for "name" change using alias.
obj.subscribe.props([ 'name' ], () => {});

// Subscribe for "array mutations" only.
import { ARRAY_MUTATIONS } from '@beerush/reactor';

obj.subscribe(() => {
  // ...
}, false, ARRAY_MUTATIONS);

// Subscribe for ".push()" method only.
obj.subscribe(() => {
  // ...
}, false, [ 'push' ]);

```

### Subscription Handler

**`(self: object | object[], prop: string, value: unknown, action: Action, path: string) => void`**

A function to handle the data changes notification.

- **`self`** - The object itself.
- **`prop`** - The changed property, empty string on array methods (`push`, `splice`, etc).
- **`value`** - New value added to the property.
- **`action`** - The data change type. (`set`|`delete` or array mutable methods `push`|`splice` etc).
- **`path`** - The full path of the changed object (e.g, `children.0.name`).

**Example**

```js
obj.subscribe((o, prop, value, action) => {
  console.log(`Object changes: ${action} ${prop} with ${value}`);
});

```

## Named Store

Sometimes we need a reactive object that shares data anywhere.
With named reactive (`resistant()`), we can create a reactive object that only created once.

> Named Store is recursive by default.

**Example**

```svelte

<script>
  // ComponentA.svelte
  import { resistant } from '@beerush/rector';

  const settings = resistant('settings', {}, true);
  settings.theme = 'dark';
</script>
<h3>{$settings.theme}</h3>

<script>
  // ComponentB.svelte
  import { resistant } from '@beerush/rector';

  const settings = resistant('settings', {}, true);
</script>
<h3>{$settings.theme}</h3>

```

From the sample above, the settings object will be created once, so it
shares the same data whenever we access it. Though, reloading the browser will
reset the data.

## Persistent Store

If we need a reactive object that persistent when the browser is reloaded,
we can use the `persistent()` function to create a persistent store. Like
the named store, it only created once and will share the same data whenever we access it.

> Persistent Store is recursive by default.

> Please note, Persistent Store will save the data to `localStorage` whenever it's changed. We recommend
> to use it to store data that not changed very often to
> make sure no performance cost.

**Example**

```svelte

<script>
  // ComponentA.svelte
  import { persistent } from '@beerush/rector';

  const settings = persistent('settings', {}, true);
  settings.theme = 'dark';
</script>
<h3>{$settings.theme}</h3>

<script>
  // ComponentB.svelte
  import { persistent } from '@beerush/rector';

  const settings = persistent('settings', {}, true);
</script>
<h3>{$settings.theme}</h3>

```

### Upgrading Persistent Store

Upgrading the Persistent Store only necessary if you change the data structure that can breaks the app.

> Sometimes we change the data structure, and can break the app
> if we don't update the stored data as well.
> If we change the data structure that possibly breaks the app, we need to
> upgrade the store before accessing the data. Upgrading the store with
> new version will reset all the store to the initial state. The default store version is `1.0.0`.

> Persistent Store and Named Store have different store, so the same name will
> not have a conflict between Persistent Store and Named Store.

```svelte

<script>
  // /routes/+layout.svelte
  import { upgrade } from '@beerush/reactor';

  upgrade('1.0.1');
</script>

```

### Removing Persistent Store

If for some reason we need to remove some data from the Persistent Store,
we can use `purge(NAME)` function to do it. Once removed, the data will not exist
on both memory and localStorage.

```svelte

<script>
  // /routes/+layout.svelte
  import { purge } from '@beerush/reactor';

  purge('settings');
</script>

```

## Reactive Fetch

**`featch(url: string, init: object | object[], options?: Request): ReactiveResponse;`**

Reactive Fetch will help us to do native `fetch()` but return a reactive object/array.

Reactive object returned from `fetch()` contains additional properties:

- `__status` - The request status code.
- `__statusText` - The request status text.
- `__error` - Error object if the request failed.
- `__request` - The request options.
- `__response` - The response object after request finished.
- `__finishedAt` - Date to mark when the request is finished.
- `__refresh()` - A function to manually refresh the data by re-requesting it.
- `__push()` - A function to do a write request with the current url.

> Make sure to use reactive fetch only for JSON response. This function will always convert the response to JSON.
>
> Fetching array will replace the existing data with the new response, while fetching object will merge it.
>
> Calling the `__refresh()` function will reset the `__status`, `__statusText`, and `__error` properties.

**Example**

```svelte

<script lang="ts">
  import { fetch } from '@beerush/reactor';

  type User = {
    name: string;
  }

  const users = fetch<User[]>('/users', []);
</script>
{#if users.__finishedAt}
  {#if users.__status < 300}
    <p>Success!</p>
  {:else}
    <p>Error: {users.__error.message}</p>
  {/if}
{:else}
  <p>Loading...</p>
{/if}

```

By default, the request will be cached. So if you ever request `fetch('/users', [])`,
when you call the same request it'll simply return the cache and not doing new request.

If you need to always re-request when calling the function, you can add `{ cache: 'reload' }` to the request options, or
add `{ cachePeriod: number }` to the request options, so when the cache is expired it'll re-request.

Why cache it by default? The purpose of this function is to improve user interaction time in the client side. When the
data is available in the cache, users can see it without waiting the request complete.

> `{ cache: 'reload' }` option can be useful to keep displaying the cached data while refreshing the data in the
> background.

### Prefetch

**`prefetch(url: string, init: object | object[], options?: Request)`**

Like `fetch()`, `prefetch()` also returns a reactive object. The difference is, `prefetch()` don't do the request, so
you need to call the `__refresh()` or `__push()` function to do the request. The returned object also has a success
status (`__status: 200...`) without a response object.

**Example**

```svelte

<script lang="ts">
  import { prefetch } from '@beerush/reactor';

  type User = {
    name: string;
  }

  const form = prefetch<User>('/users', { name: '' }, { method: 'post' });
</script>

<form action="">
  <input type="text" placeholder="Name" bind:value={$form.name}>

  <button on:click={() => form.__push()} disabled={!$form.status}>
    {#if $form.__status}
      <span>Submit</span>
    {:else}
      <span>Loading...</span>
    {/if}
  </button>
</form>

```

From the sample above, we're using `prefetch()` to create a user form state. The `<input>` element will update the
initial data given to the `prefetch()` function, and the `<button>` will tells the form state to push the data (by doing
a `__push()` request).

The button also will be disabled while the form state is pushing the data because
the `form.__status` will become `0` when there is an ongoing request.

### Refresh

**`.__refresh(options?: Request, update = true)`**

The returned object from `fetch()` or `prefetch()` will have a `__refresh()` function to redo the request. The function
can take two arguments, `options` to override the initial request options, and `update` (`true` by default) to tell the
function to update the previous data or not.

**Example**

```ts
import { fetch } from '@beerush/reactor';

const state = fetch('/users/1', {});
state.__refresh({
  headers: {
    Authorization: '...'
  }
});
```

**`.__push(options?: Request, update = true)`**

The returned object from `fetch()` or `prefetch()` also will have a `__push()` function to do a write request from the
current URL. If no options given or no `body` in the given request options, the function will send the initial data.

The default method is `post`. To create a `put` or `patch` request, you can pass it to the request options, whether at
the initial options or the overriding options.

**Example**

```ts
import { prefetch } from '@beerush/reactor';

const state = prefetch('/users/1', { name: 'John' }, { method: 'put' });
state.name = 'John Smith';
state.__push();

```

## Watch

**`watch(state: Reactive, debounce?: number): History`**

- `state` - A reactive object to watch.
- `debounce` - A timeout to cancel the previous change and apply new change.

A watch function can help us to record the changed properties of an object/array. This can be useful to only
push the changed data to the API.

**Example**

```ts
import { prefetch, reactive, watch } from '@beerush/reactor';

const user = reactive({ name: 'John', age: 10 });
const history = watch(user);
const form = prefetch('/users/1', history.changes, { method: 'put' });

user.name = 'John Smith';
form.__push(); // PUT { name: 'John Smith' }

```

> Watch function simply subscribe to the reactive object and then store the changed property and its value. This
> function doesn't use a periodical checking, so it won't cause any performance issue.

> Watch function is using `debouce` time to prevent storing unnecessary history of a fast changed properties. For
> example, if you type fast, the changes will be recorded after you stop typing. The default debounce time is `500ms`.
> 
> To change the global/default debounce time, you can call `watch.debounce(duration: number)`.

### History

**History** is the returned object when you call `watch()`. History will have the following properties:

- `.changes` - An object of the changed properties.
- `.changed` - A boolean that mark does the state is changed or not.
- `.canUndo` - A boolean that mark does the history has changes to undo.
- `.canRedo` - A boolean that mark does the history has changes to redo.
- `.undo()` - A function to undo the changes, one by one.
- `.redo()` - A function to redo the changes, one by one.
- `.reset()` - A function to reset to the initial state by undoing the changes.
- `.clear()` - A function to clear the changes, mark it as unchanged.
- `.forget()` - A function to stop watching the changes.
