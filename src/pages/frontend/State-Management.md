---
title: 全局状态管理库
date: 2024/3/6
type: frontend
meta:
  - name: description
    content: 介绍全局状态管理库，包括为什么要使用全局状态管理库，什么情况下要使用全局状态管理库，并介绍在 VueX 中的五大核心概念，以及 VueX 和 Pinina 的区别
---

[[toc]]

讲讲全局状态管理库

## 为什么使用？

使用全局状态管理库主要是解决两个问题：

1. **多个视图依赖同一个状态**
2. **不同视图之间的交互需要更改同一份状态**

对于第一个问题，我们通常会通过将这个共享状态提升到公共的祖先组件上去，然后通过 props 传递下来。对于第二个问题，我们通常会直接通过 **ref** 获取父子实例来修改状态，或者通过事件机制来同步多个状态。但对于深层次的组件结构而言，这么做的话很容易导致代码变得冗长。问题一还会导致另一个问题：[Prop 逐级透传问题](https://cn.vuejs.org/guide/components/provide-inject.html#prop-drilling)。 

因此，就想到可以把这些共享的状态抽离出来，以一个全局单例的模式来管理。

## 什么情况要使用？

通常而言，我们可以在全局状态管理库中存储用户信息、系统（网站）的全局设置（主题、语言设置等等）、多个组件的共享数据等。

使用全局管理库并不意味着你需要将**所有的**状态放入其中。虽然将所有的状态放到管理库中会使状态变化更显式和易调试，但同样也会使代码变得冗长和不直观。如果有些状态严格属于单个组件，最好还是作为组件的局部状态。

## 核心概念

这里我们介绍下 Vuex 的五大核心概念：

- **State**

即状态，存储在 Vuex 当中统一管理的数据。

- **Getter**

类似于计算属性，用于计算 state 中派生出来的状态。

- **Mutation**

要对 state 中的状态进行修改，需要调用 mutation 函数来执行（通过 `store.commit` 来调用），它会接受 state 作为第一个参数。

为什么需要通过 mutation 进行状态的修改是因为只有这样我们才能通过**调试工具追踪到状态的改变**。

但 **mutation 必须是同步函数**。如果 mutation 是异步执行，很显然调试工具并不知道异步函数中的回调函数什么时候被实际调用——实际上任何在回调函数中进行的状态的改变都是**不可追踪**的。

- **Action**

要执行异步操作需要通过 action 来实现（通过 `store.dispatch` 来调用）。它接受一个与 store 实例具有相同方法和属性的 **context** 对象作为第一个参数（为什么不是 store 实例本身，原因是当前实例可能是局部模块）。

**action 不会直接变更状态，而是提交 mutation 来变更状态**。我们通过在异步任务的回调函数中通过提交 mutation 来进行状态变更，这样即使是异步任务也能够追踪到状态变化。

- **Module**

通过 module 来对状态管理库进行模块的划分。

对于模块内部的 mutation 和 getter，接收的第一个参数是**模块的局部状态对象**。对于模块内部的 action，局部状态通过 `context.state` 暴露出来，根节点状态则为 `context.rootState`。

默认情况下，模块内部的 getter、action 和 mutation 仍然是注册在**全局命名空间**的——使得多个模块能够对同一个 action 或 mutation 作出响应。必须注意，不要在不同的、无命名空间的模块中定义两个相同的 getter 从而导致错误。

如果希望你的模块具有更高的封装度和复用性，你可以通过添加 `namespaced: true` 的方式使其成为**带命名空间**的模块。当模块被注册后，它的所有 getter、action 及 mutation 都会自动根据**模块注册的路径**调整命名。

## Vuex 与 Pinia 的区别

1. Pinia 舍弃了 Mutation 。在 Pinia 当中，每个 Store 在初始化时都需要传入 **id** 作为 Store 的名字，Pinia 将通过 id 来连接 **Store 和 调试工具**。因此不再需要 mutation 来追踪状态变化，可以直接通过对象属性的方式来修改状态。
2. Pinia 舍弃了 Module 。Pinia 提供的是一个扁平的结构，每个 Store 都是独一无二的，不再需要 module 进行模块的划分。但我们仍然通过导入和使用另一个 Store 来隐含地嵌套 stores 空间，**让 Stores 有循环依赖关系**。
3. Pinia 可以更好地支持 TS，不再需要创建自定义的复杂包装器来支持（声明自定义的[模块补充(module augmentation)](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)）。
4. Pinia 不再需要通过 dispatch() 调用 action，可以直接通过对象方法的方式来调用。

## 总结

总的来说，与 Vuex 相比，Pinia 不仅提供了一个更简单的 API，也提供了符合组合式 API 风格的 API，能更好地支持 TypeScript 。