# `@beerush/reactor`

> For a summary of the most recent changes, please see [changelog.md](https://github.com/beerush-id/reactor/tree/main/changelog.md).

Reactor is a Javascript Proxy helper to transform any object/array into a reactive object/array, recursively!

For example, in Svelte, instead doing `todo.done = true; todos = todos;` we can simply
do `todo.done = true` and the component will be updated, no need to call the `.set()`
method or reassigning the variable.

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

### Reactive

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

// Subscribe for "set" and "delete" property only.
obj.subscribe(() => {
  // ...
}, false, [ 'set', 'delete' ]);

// Subscribe for "set" property using alias.
obj.subscribe.for([ 'set' ], (o, prop, value) => {
  console.log(`Property ${prop} changed to ${value}`);
});

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

#### Subscription Handler

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

### Named Store

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

### Persistent Store

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

#### Upgrading Persistent Store

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

#### Removing Data From Persistent Store

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

**`featch(url: string, init: object|object[], options?: Request): ReactiveResponse;`**

Reactive Fetch will help us to do native `fetch()` but return a reactive object/array.

Reactive object returned from `fetch()` contains additional properties:

- `__status` - The request status code.
- `__statusText` - The request status text.
- `__error` - Error object if the request failed.
- `__request` - The request options.
- `__response` - The response object after request finished.
- `__finishedAt` - Date to mark when the request is finished.
- `__refresh()` - A function to manually refresh the data by re-requesting it.

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
