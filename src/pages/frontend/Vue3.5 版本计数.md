---
title: Vue 3.5 版本计数
date: 2025/2/13
type: frontend
---

[[toc]]

## 普通响应式数据

在上一篇文章中我们简单了解了 Vue 3.5 中关于双向链表的维护逻辑，这里接着上一篇小结里提到的 `endbatch` 函数。

```tsx
let batchDepth = 0
let batchedSub: Subscriber | undefined
let batchedComputed: Subscriber | undefined

export function startBatch(): void {
  batchDepth++
}

export function endBatch(): void {
  // 当所有的 batches 都添加到链表中时才能执行后续逻辑
  if (--batchDepth > 0) {
    return
  }
  
  if (batchedComputed) {
    let e: Subscriber | undefined = batchedComputed
    batchedComputed = undefined
    while (e) {
      const next: Subscriber | undefined = e.next
      e.next = undefined
      e.flags &= ~EffectFlags.NOTIFIED
      e = next
    }
  }

  let error: unknown
  while (batchedSub) {
    // 临时指针指向头部节点
    let e: Subscriber | undefined = batchedSub
    // 清除头部节点指针
    batchedSub = undefined
    while (e) {
      // 临时指针指向当前节点的下一个节点
      const next: Subscriber | undefined = e.next
      // 清除 next 指针
      e.next = undefined
      e.flags &= ~EffectFlags.NOTIFIED
      if (e.flags & EffectFlags.ACTIVE) {
        try {
          ;(e as ReactiveEffect).trigger()	// [!code highlight]
        } catch (err) {
          if (!error) error = err
        }
      }
      e = next
    }
  }

  if (error) throw error
}
```

我们可以发现在迭代 `batchedEffect` 链表的过程中，会将不再用的指针指向 `undefined`，以清空 `batchedEffect` 链表。

每次迭代都会调用 `sub.trigger` 方法：

```tsx
trigger(): void {
  if (this.flags & EffectFlags.PAUSED) {
    pausedQueueEffects.add(this)
  } else if (this.scheduler) {
    this.scheduler()
  } else {
    this.runIfDirty()
  }
}

runIfDirty(): void {
  if (isDirty(this)) {
    this.run()
  }
}
```

在 `runIfDirty` 方法中会执行一个 `isDirty` 函数，当该函数返回 `true` 时，此时才会调用 `run` 方法来重新执行副作用函数。在该函数中会根据节点的版本号 `link.version` 与响应式数据的版本号 `dep.version` 是否相同，来决定是返回 `true` 还是 `false`。

```tsx
function isDirty(sub: Subscriber): boolean {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (
      link.dep.version !== link.version ||	// [!code highlight]
      (link.dep.computed &&
        (refreshComputed(link.dep.computed) ||
          link.dep.version !== link.version))
    ) {
      return true
    }
  }

  if (sub._dirty) {
    return true
  }
  return false
}
```

因为 `computed` 它既可以是响应式数据（`Dep`），也可以作为副作用函数（`Sub`）。因此对于 `computed` 作为响应式数据时，还需要执行 `refreshComputed` 函数，从而进一步判断该 `computed` 是否发生变化，关于 `refreshComputed` 的具体逻辑我们后面在说。

### 何时更新版本

那版本号会在何时进行更新呢？很显然，当响应式数据发生变化时就应该对版本号进行更新。全局的 `trigger` 函数会在响应式数据触发 `set` 时调用，在该函数内会调用 `dep.trigger` 方法来更新版本号。

```tsx
trigger(debugInfo?: DebuggerEventExtraInfo): void {
  this.version++
  globalVersion++
  this.notify(debugInfo)
}
```

此时，`dep.version` 的版本号已经更新，而 `link.version` 还是旧版本，根据 `isDirty` 函数的逻辑，这意味着***副作用函数将会重新执行***。我们在上一篇文章中讲到副作用函数在执行时会调用 `prepareDeps` 函数，此时又会将 `link.version` 设置为 `-1`。在副作用函数执行时，<u>由于又访问了依赖的响应式数据，所以又会重新走 `track` 函数逻辑</u>，从而将 `link.version` 与 `dep.version` 的版本号**同步**。

到此，对于普通的响应式数据的版本更新和比对逻辑就简单介绍完毕了，接下来我们来看看 `computed`。

## computed

在刚刚的代码中我们看到除了 `dep.version` 还有另一个**全局版本号** `globalVersion`，全局版本号会在任何响应式数据发生变化时自加 `1`，它为 `computed` 提供了快速判断是否需要重新计算的方法。

现在我们再来看看 `refreshComputed` 函数：

```tsx
export function refreshComputed(computed: ComputedRefImpl): undefined {
  // ...
  if (computed.globalVersion === globalVersion) {	// [!code highlight]
    return	// [!code highlight]
  }	// [!code highlight]
  computed.globalVersion = globalVersion	// [!code highlight]
  // ...
}
```

`computed.globalVersion` 在初始化时会设置为 `globalVersion - 1`，其目的是让 `computed` 在**第一次执行时能够执行其回调函数**。

如果 `computed.globalVersion === globalVersion` 成立，意味着<u>没有任何响应式数据发生变化，则直接返回</u>。否则，更新 `computed.globalVersion` 并执行后续逻辑。

```tsx
// function: refreshComputed
// ...
// 这里的 dep 是该 computed 对应的 dep 实例对象
const dep = computed.dep
computed.flags |= EffectFlags.RUNNING
if (
  dep.version > 0 &&
  !computed.isSSR &&
  computed.deps &&
  !isDirty(computed)	// [!code highlight]
) {
  computed.flags &= ~EffectFlags.RUNNING
  return
}
const prevSub = activeSub
const prevShouldTrack = shouldTrack
activeSub = computed
shouldTrack = true

try {
  prepareDeps(computed)
  const value = computed.fn(computed._value)	// [!code highlight]
  // 初次执行时或新旧值不同时进行赋值
  if (dep.version === 0 || hasChanged(value, computed._value)) {
    computed._value = value
    dep.version++
  }
} catch (err) {
  dep.version++
  throw err
} finally {
  activeSub = prevSub
  shouldTrack = prevShouldTrack
  cleanupDeps(computed)
  computed.flags &= ~EffectFlags.RUNNING
}
```

`computed` 此时作为副作用函数，它是否需要更新要根据其依赖的响应式数据是否发生变化来决定，因此调用 `isDirty(computed)` 来进一步判断。如果返回 `false`，意味着 `computed` 不需要更新。否则，重新执行 `computed` 的回调函数。

## 总结

主要存在四种类型的版本号：

- `link.version`

  初始化：`dep.version`

  何时更新：在依赖收集函数 `track` 中（严格意义上讲是在对应的 `dep.track` 中）与 `dep.version` 进行同步。

  何时比对：在执行副作用函数前，在 `isDirty` 函数中与 `dep.version` 进行比对。

- `dep.version`

  初始化：`0`

  何时更新：在对应的响应式数据发生变化时自加 `1`。

  何时比对：在执行副作用函数前，在 `isDirty` 函数中与 `link.version` 进行比对。

- `computed.globalVersion`

  初始化：`globalVersion - 1`

  何时更新：有响应式数据发生变化时，与 `computed.globalVersion` 进行同步。

  何时比对：在判断 `computed` 是否需要重新执行时，与 `globalVersion` 进行比对。

- `globalVersion`

  初始化：`0`

  何时更新：在**任意**的响应式数据发生变化时自加 `1`。

  何时比对：在判断 `computed` 是否需要重新执行时，与 `computed.globalVersion` 进行比对。

