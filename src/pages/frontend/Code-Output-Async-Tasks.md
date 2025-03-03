---
title: 代码输出——异步任务
date: 2024/9/10
type: frontend
meta:
  - name: description
    content: 介绍了前端中一些异步任务的代码输出题
---

[[toc]]

## 第一题

```javascript
const promise1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  }, 1000)
})
const promise2 = promise1.then(() => {
  throw new Error('error!!!')
})
console.log('promise1', promise1)
console.log('promise2', promise2)
setTimeout(() => {
  console.log('promise1', promise1)
  console.log('promise2', promise2)
}, 2000)
```

<details>
<summary>结果</summary>

无论是在初始化 Promise 对象过程中还是在 `then` 方法中抛出错误都会使得 Promise 对象的状态为 rejected。

```javascript
promise1 Promise {<pending>}
promise2 Promise {<pending>}

Uncaught (in promise) Error: error!!!
promise1 Promise {<fulfilled>: "success"}
promise2 Promise {<rejected>: Error: error!!}
```

</details>

## 第二题

```javascript
Promise.resolve().then(() => {
  return new Error('error!!!')
}).then(res => {
  console.log("then: ", res)
}).catch(err => {
  console.log("catch: ", err)
})
```

<details>

<summary>结果</summary>

返回任何一个非 Promise 对象都会被包裹成一个 Promise 对象。这里只是返回了一个 Error 对象，并没有通过 `throw` 抛出错误，故 Promise 的状态仍是 fulfilled。

```javascript
"then: " "Error: error!!!"
```

</details>

## 第三题

```javascript
const promise = Promise.resolve().then(() => {
  return promise;
})
promise.catch(console.err)
```

<details>

<summary>结果</summary>

`then` 或者 `catch` 方法返回的值不能是调用该方法的 Promise 对象本身，否则会检测出死循环报错。

```javascript
Uncaught (in promise) TypeError: Chaining cycle detected for promise #<Promise>
```

</details>

## 第四题

```javascript
Promise.resolve(1)
  .then(2)
  .then(Promise.resolve(3))
  .then(console.log)
```

<details>

<summary>结果</summary>

`then` 或者 `catch` 方法的参数期望是一个函数，传入非函数值会导致**值透传**。

第一个 `then` 和第二个 `then` 中传入的都不是函数，因此发生了透传，将 `resolve(1)` 的值直接传到最后一个 `then` 里，故直接打印出 `1` 。

```javascript
Uncaught (in promise) TypeError: Chaining cycle detected for promise #<Promise>
```

</details>

## 第五题

```javascript
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
  setTimeout(() => {
    console.log('timer1')
  }, 0)
}
async function async2() {
  setTimeout(() => {
    console.log('timer2')
  }, 0)
  console.log("async2");
}
async1();
setTimeout(() => {
  console.log('timer3')
}, 0)
console.log("start")
```

<details>

<summary>结果</summary>

这里的 `async2` 不需要等待延时器执行完毕，只要返回了便会直接将 `await` 的后续代码添加进微任务队列中。

```javascript
async1 start
async2
start
async1 end
timer2
timer3
timer1
```

</details>

## 第六题

```javascript
console.log("Start");
async function asyncFunction() {
    console.log("Async 1");
    await new Promise((resolve) => {
        console.log("async await");
        setTimeout(() => {
            console.log("async timeout");
            resolve();
            Promise.resolve().then(() => {
                console.log("promise 1");
            });
        }, 0);
    });
    console.log("Async 2");
}
asyncFunction();
console.log("End");
```

`await` 关键字属于同步任务，一旦 `await` 中的 Promise 完成兑现或异常时，便会直接将 `await` 之后的代码添加进微任务队列中。

`await` 的 Promise 在延时器中完成了兑现，会先将 `await` 之后的代码先添加进微任务队列，再执行 `resolve` 之后的代码。

```javascript
Start
Async 1
async await
End
async timeout
Async2
promise 1
```

至于为什么是这样，我们再来看看后面衍生出来的几个输出结果问题。

------

在原来的基础上，此时在 `await` 的 Promise 执行一个 `then` 方法时，整个行为却与之前不同。

```javascript
console.log("Start");
asyncFunction();
async function asyncFunction() {
    console.log("Async 1");
    await new Promise((resolve) => {
        console.log("async await");
        setTimeout(() => {
            console.log("async timeout");
            resolve("resolve");
            Promise.resolve().then(() => {
                console.log("promise 1");
            });
        }, 0);
    }).then((res) => console.log(res));
    console.log("Async 2");
}
console.log("End");
```

这里输出 `resolve` 的结果后，此时发现却是先输出 `promise 1`，随后输出 `Async 2`。

```javascript
Start
Async 1
async await
End
async timeout
resolve
promise 1
Async 2
```

这是因为此时 `await` 等待的是新添加的 `then` 方法返回的 Promise 状态的转变，所以只有等到这个 `then` 方法被执行完毕后才会将 `await` 之后的代码作为微任务添加进队列中。

------

如果此时把延时器去掉，行为又发生了变化。

```javascript
console.log("Start");
asyncFunction();
async function asyncFunction() {
    console.log("Async 1");
    await new Promise((resolve) => {
        console.log("async await");
        resolve("resolve");
        Promise.resolve().then(() => {
            console.log("promise 1");
        });
    }).then((res) => console.log(res));
    console.log("Async 2");
}
console.log("End");
```

此时却是先输出 `promise 1`，然后才是输出 `resolve` 的结果，最后输出 `Async 2`。

```javascript
Start
Async 1
async await
End
promise 1
resolve
Async 2
```

为什么会有这么大的不同呢？

**关键在于**：`resolve` 被调用的时机是<u>*同步还是异步*</u>。

在这个例子中，我们可以发现外层的 Promise 和其 `resolve` 以及内层的 Promise 同属于一个执行上下文中（即属于同一宏任务中）。当初始化函数执行到 `resolve` 时，外层 Promise 状态变为 fulfilled，但其 `then` 的回调是在**之后才被注册**的。而内层的 Promise 是在初始化函数中同步执行的，其 `then` 方法的回调先被加入微任务队列。然后，外层的 `then` 方法被调用，因为此时 Promise 已经 fulfilled，所以其回调被加入到微任务队列。因此，微任务队列顺序是内层先，外层后。

而在上一个的例子中，我们可以发现外层的 Promise 和其 `resolve` 以及内层的 Promise 不同属于一个执行上下文中（即不属于一个宏任务中）。外层  Promise 的 `resolve` 和内层的 Promise 是在下一个宏任务中执行，而外层的 Promise 的初始化和 `then` 方法的注册则是在前一个宏任务中执行。因此，`resolve` 在下一个宏任务中执行完后，此时外层的 `then` 方法已经被调用，并且因为该 Promise 还是 pending，所以在上一个宏任务执行时已经将其回调保存了起来。当 `resolve` 被调用时，该回调会被立即加入到微任务队列中。所以，微任务队列顺序是外层先，内层后。

这也是为什么在第一个例子中，`Async 2` 会比 `promise 1` 先输出的本质原因。

------

此时再把 then 方法去掉，与第一个例子相比，相当于在第一个例子的基础上把延时器删除。

```javascript
console.log("Start");
asyncFunction();
async function asyncFunction() {
    console.log("Async 1");
    await new Promise((resolve) => {
        console.log("async await");
        resolve("resolve");
        Promise.resolve().then(() => {
            console.log("promise 1");
        });
    });
    console.log("Async 2");
}
console.log("End");
```

与第一个例子对照，此时是先输出 `promise 1`，后输出 `Async 2`。

```javascript
Start
Async 1
async await
End
promise 1
Async 2
```

因为 `await` 后的代码（本质就是一个 `then` 方法的回调）此时在代码执行栈中还未执行到，所以该回调还未被注册。同时，内层 Promise 与外层 Promise 同属一个宏任务中。按照代码执行的先后顺序，这就导致外层 Promise 的状态虽然发生了转变，但由于其注册的回调函数还未执行到，所以内层的微任务被先添加进队列中，而外层的微任务后添加进队列。