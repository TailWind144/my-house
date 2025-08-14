---
title: Vue 3.5 Computed 的惰性订阅和自动取消订阅 
date: 2025/8/13
type: frontend
meta:
  - name: description
    content: Vue 3.5 Computed，主要介绍 Vue 3.5 对 Computed 的优化，包括惰性订阅和自动取消订阅
---

[[toc]]

我们知道在 3.5 版本之前 `computed` 就已支持**惰性计算**（仅在访问时计算）和**缓存机制**（依赖未变时返回缓存值），但其依赖订阅过程是不存在延迟的。也就是说，`computed` 一旦被访问，就会**立即建立对其所有依赖的完整订阅关系**。而且即使后续不再访问该 `computed`，订阅关系仍然存在，导致内存无法释放。

之前的两篇文章已经介绍了 Vue 3.5 响应式系统的[双向链表](https://tailwind144.github.io/my-house/page/vue3.5-reactive-system-refactor)和[版本计数](https://tailwind144.github.io/my-house/page/vue3.5-version-count)，接下来就来看看 3.5 版本针对 `computed` 存在的以上这两点进行的优化——**惰性订阅和自动取消订阅**。

## 惰性订阅

在访问响应式数据 `dep` 时，此时会进行依赖收集，在全局的 `track` 函数中进一步调用 `dep.track` 方法去创建一个 `link` 节点，并分别添加到当前响应式数据 `dep` 的 *Dep to Subs doubly-linked list* 链表和当前执行的副作用函数 `activeSub` 的 *Sub to Deps doubly-linked list* 链表中：

```ts
let link = this.activeLink;
if (link === undefined || link.sub !== activeSub) {
     // 创建新的 link 并建立链表关系
     link = this.activeLink = new Link(activeSub, this);

     // 将 link 添加到当前 activeSub 的 Sub to Deps doubly-linked list 链表尾部
     if (!activeSub.deps) {
         activeSub.deps = activeSub.depsTail = link;
     } else {
         link.prevDep = activeSub.depsTail;
         activeSub.depsTail!.nextDep = link;
         activeSub.depsTail = link;
     }
	 // 将 link 添加到当前依赖 dep 的 Dep to Subs doubly-linked list 链表尾部
     addSub(link);
 }
```

这里来进一步看看 `addSub` 函数：

```ts
function addSub(link: Link) {
  link.dep.sc++
  if (link.sub.flags & EffectFlags.TRACKING) {
    const computed = link.dep.computed
    // 如果此时的响应式数据 dep 是一个 computed 且首次被副作用函数订阅时
    if (computed && !link.dep.subs) {
      // 此时收集 computed 依赖的 deps，将其添加到对应 dep 的 Dep to Subs doubly-linked list 链表中
      computed.flags |= EffectFlags.TRACKING | EffectFlags.DIRTY
      for (let l = computed.deps; l; l = l.nextDep) {
        addSub(l)
      }
    }

    const currentTail = link.dep.subs
    if (currentTail !== link) {
      link.prevSub = currentTail
      if (currentTail) currentTail.nextSub = link
    }

    if (__DEV__ && link.dep.subsHead === undefined) {
      link.dep.subsHead = link
    }

    link.dep.subs = link
  }
}
```

从以上函数中可以发现，如果访问的响应式数据 `dep` 是一个 `computed`，且**首次被副作用函数订阅时**（`!link.dep.subs` 指的就是该 `computed` 的 *Dep to Subs doubly-linked list* 链表是否为空，为空即意味着没有任何的副作用函数订阅它），那么此时才会把该 `computed` 所依赖的响应式数据 `deps` 收集起来，将其添加到对应 `dep` 的 *Dep to Subs doubly-linked list* 链表中，这样便完成了 `computed` 的订阅。后续 `computed` 依赖的响应式数据发生变化时，就能在其对应的 *Dep to Subs doubly-linked list* 链表中找到并通知该 `computed`。

这就是 Vue 3.5 版本为 `computed` 带来的**惰性订阅**。`computed` 仅在自身作为响应式数据被其他订阅者 `sub` **首次**订阅时（如被 `effect` 或模板引用），才会订阅其自身的所有依赖项。相当于延迟执行，按需订阅，减少不必要的性能和内存开销。

另一个就是说，未被使用的 `computed` 不会建立任何依赖关系，其依赖的响应式数据不会在其 *Dep to Subs doubly-linked list* 链表中找到该 `computed`，这意味着可以避免一些冗余计算。当然，这个特性在之前的版本中也是实现了的（在过去的版本中，如果 `computed` 没有被任何地方使用，那么虽然依赖变化会将 `computed` 标记为 dirty，但并不会立即重新计算，而是等到下次访问时才会计算，也就是所说的惰性计算）。

## 自动取消订阅

在之前的文章中提到，当副作用函数执行完毕后，会执行一个 `cleanupDeps` 函数。此时会遍历该副作用函数的 *Sub to Deps doubly-linked list* 链表，判断 `link` 节点的 `version` 属性是否为 `-1`，从而将不再依赖的响应式数据的节点从链表中移除：

```ts
function cleanupDeps(sub: Subscriber) {
    // 清除无用 Deps
    let head
    let tail = sub.depsTail
    let link = tail
    while (link) {
        const prev = link.prevDep
        if (link.version === -1) {	// [!code highlight]
            if (link === tail) tail = prev
            // 从 Dep to Subs doubly-linked list 链表中移除
            removeSub(link)	// [!code highlight]
            // 同时也从 Sub to Deps doubly-linked list 链表中移除
            removeDep(link)	// [!code highlight]
        } else {
            head = link
        }

        link.dep.activeLink = link.prevActiveLink
        link.prevActiveLink = undefined
        link = prev
    }
    sub.deps = head
    sub.depsTail = tail
}
```

这里我们来进一步看看把节点从 *Dep to Subs doubly-linked list* 链表中移除的函数 `removeSub`：

```ts
function removeSub(link: Link, soft = false) {
  const { dep, prevSub, nextSub } = link
  // 从链表中移除当前节点
  if (prevSub) {
    prevSub.nextSub = nextSub
    link.prevSub = undefined
  }
  if (nextSub) {
    nextSub.prevSub = prevSub
    link.nextSub = undefined
  }

  // ...

  if (dep.subs === link) {
    // 如果当前移除的节点是尾节点，则将尾指针指向前一个节点
    dep.subs = prevSub

    // 如果当前链表不存在任何节点，意味着当前的 dep 没有被任何副作用函数订阅
    // 如果这个 dep 是一个 computed，则取消订阅其所依赖的响应式数据
    if (!prevSub && dep.computed) {	// [!code highlight]
      dep.computed.flags &= ~EffectFlags.TRACKING	// [!code highlight]
      for (let l = dep.computed.deps; l; l = l.nextDep) {	// [!code highlight]
        removeSub(l, true)	// [!code highlight]
      }	// [!code highlight]
    }	// [!code highlight]
  }

  if (!soft && !--dep.sc && dep.map) {
    // #11979
    // property dep no longer has effect subscribers, delete it
    // this mostly is for the case where an object is kept in memory but only a
    // subset of its properties is tracked at one time
    dep.map.delete(dep.key)
  }
}
```

如果当前的 *Dep to Subs doubly-linked list* 链表不存在任何节点，这意味着当前的 `dep` 没有被任何副作用函数订阅。同时，如果这个 `dep` 是一个 `computed`，则取消订阅其所依赖的响应式数据，即从每个所依赖的响应式数据的 *Dep to Subs doubly-linked list* 链表中移除与这个 `computed` 相关联的节点。

需要注意的是，在移除与 `computed` 的订阅关系时调用的 `removeSub` 函数还传入了第二个参数 `soft` 为 `true`。这里是因为 `computed` 的 *Sub to Deps doubly-linked list* 链表仍然引用着这些依赖项，以便后续重新访问该 `computed` 时可以快速找到依赖的响应式数据去重新建立订阅关系，而不需要立即执行 `computed` 来重新走 `track` 逻辑来收集依赖。

因此，通过以上逻辑，`computed` 实现了自动取消订阅不需要的依赖关系。解除引用后，如果这些依赖项不再被其他代码使用，那么它们就可以被 JS 引擎自动 GC，进一步优化内存占用，避免了内存泄漏。

## 最后

当然，Vue 在未来的 3.6 版本将会引入 [*Alien Signals*](https://github.com/stackblitz/alien-signals) 来进一步优化响应式系统性能。因此关于这里的实现细节后续也可能会发生变化，未来我也会对 3.6 版本的响应式系统优化去进行详细介绍。