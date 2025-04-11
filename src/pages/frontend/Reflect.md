---
title: Reflect 对象
date: 2023/11/14
type: frontend
meta:
  - name: description
    content: 介绍 Reflect 对象，为什么要通过 Reflect 对象执行默认行为
---

[[toc]]

Proxy 对象的捕获函数或 Reflect 对象上的静态方法中包含了<u>对象所有的基本行为</u>，主要可以分为<u>六大类</u>：

1. **最基本的行为**：`get`、`set`、删除属性的 `deleteProperty`
2. **原型对象**的 `get` 和 `set`：`getPrototypeOf`、`setPrototypeOf`
3. **对象描述符**的 `get` 和 `set`：`getOwnPropertyDescriptor`、`definedProperty`
4. **对象可扩展性**的 `get` 和 `set` ：`isExtensible`、`preventExtensions`
5. **对象的迭代行为**：`for……in` 迭代方式的 `has`、`Object.getOwnPropertyNames` 方法和 `Object.getOwnPropertySymbols` 方法的`ownKeys`
6. **函数对象的行为**：普通形式调用的 `apply`、以构造函数形式调用（实例化对象）的 `construct`

**Reflect** 对象的主要目的是替代一些原本存在于 JS 中的全局对象上的方法。这些方法与 **Proxy** 对象中提供的捕获函数相同，所以通常这两者会结合使用。Proxy 对象拦截底层对象的操作，Reflect 对象来执行默认行为或其他自定义行为。

## 为什么要通过 Reflect 对象执行默认行为

JavaScript 中一些默认行为的实现可以通过其他全局对象上一些静态方法来完成。然而，这种方式在某些情况下存在一些限制，并不能完全替代 Reflect 对象。使用 Reflect 对象的原因在于它不仅提供了与其他全局对象相同的功能，还提供了更强大和更完整的API。

例如，`Reflect.has()` 是一个与 **in** 运算符行为相同的方法，能够判断一个对象是否包含某个属性。而 **Object.hasOwnProperty()** 只能判断对象自身是否具有指定的属性，无法判断原型链上是否有该属性。

另外，使用 Reflect 对象还能使代码更加具有<u>可读性和可维护性</u>。因为 Reflect 对象的 API 方法非常严格，它们的返回值类型和参数要求都非常明确。使得我们开发人员能够更好地理解代码的逻辑和目的，从而避免出现一些难以诊断的错误。

还有一个重要原因在于 `Reflect.get` 和 `Reflect.set` 可以接受第三个参数 `receiver`，而 Proxy 中对应这两个行为的捕获函数也有这第三个参数以表明当前执行该行为的对象，这个参数使得代理对象在执行默认行为 `getter` 和 `setter` 时它的 `this` 可以指向当前访问的对象（在过去执行 `getter` 和 `setter` 时是没有办法去更改 `this` 的指向的），使得对象的行为能够正确执行。

考虑如下一个场景：

```js
let animal = {
  _name: "动物",
  get name() {
    return this._name;
  }
};

let animalProxy = new Proxy(animal, {
  get(target, prop) {
    return target[prop]; // target = animal
  }
});

let cat = {
  __proto__: animalProxy,
  _name: "猫"
};

// 期望输出：猫
console.log(cat.name); // 输出：动物
```

如果 `cat` 继承的是原始对象 `animal`，那么控制台输出的结果应该是”猫“，因为此时 `getter` 的 `this` 会指向 `cat`。

此时 `cat` 继承的是 `animal` 的代理对象，该代理对象的 `get` 捕获函数的返回结果是通过字面量的方式来返回的，而主要的原因就在于<u>此时的 `target` 指向的是当前的代理对象即 `animal`</u>，所以此时通过字面量访问的是 `animal` 上的 `name`，即返回“动物”。

要解决这个问题，就可以利用 `Reflect.get` 方法来执行 `get` 行为，通过传入第三个参数 `receiver`，就可以<u>使得 `target` 中定义的 `getter` 的 `this` 指向当前执行行为的对象 `receiver`</u>，从而正确执行行为。

```js
let animal = {
  _name: "动物",
  get name() {
    return this._name;
  }
};

let animalProxy = new Proxy(animal, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver); 
  }
});

let cat = {
  __proto__: animalProxy,
  _name: "猫"
};

// 期望输出：猫
console.log(cat.name); // 输出：猫
```

