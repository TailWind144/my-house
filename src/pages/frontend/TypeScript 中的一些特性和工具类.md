---
title: TypeScript 中的一些特性和工具类
date: 2025/1/6
type: frontend
---

[[toc]]

最近在深入学习 TypeScript 的一些用法，这里也给大家分享一个学习和锻炼 TypeScript 的平台 [TypeRoom](https://typeroom.cn/problems/all)，以类似 LeetCode 的做题模式来学习 TS 中的一些高级特性。这里总结下这段时间我学习到的一些特性和工具类型。

## 特性

### 扩展运算符

在数组类型中我们仍然可以使用扩展运算符 `...` 来快速迭代返回这个数组类型中拥有的元素。

例如我们想要实现一个类似 JavaScript 中的 `Array.push` 方法 `Push<T, U>` ，这个类型接受两个参数，第一个参数为元组类型，第二个参数为任意类型。我们就可以利用扩展运算符来实现：

```tsx
type Push<T extends readonly any[], U> = [...T, U]
```

注意，有些同学可能认为一个简单的 `push` 操作却要利用扩展运算符去做这不很影响性能吗？这里我们需要明确的是在类型系统中<u>关于类型的操作是**不会存在性能问题**</u>。TS 属于**编译型**语言，关于<u>类型的检测都是在**编译时**完成的</u>，并不会将类型的一些操作转换为最终的 JS。这就好比在建筑施工前，通过详细的设计图纸（TypeScript 代码和类型检查）确保建筑结构合理，而最终实际建造的建筑（JavaScript 代码）是按照没有这些设计标注的普通图纸（不含类型信息）来施工的。所以<u>类型操作是**不会对运行时的性能产生影响的**</u>。

### 映射类型

映射类型指的是我们可以迭代一个属性名的集合（通常是一个联合类型）来设置属性，从而创建一个新类型。

这样子讲比较难以理解，给个例子：

假设有一个类型 `User`，它包含了三个属性 `id`、`name` 和 `age`，类型分别为 `number`、`string` 和 `number`。现在我们想要创建一个新类型 `UserString`，它具有和 `User` 一样的属性，但他们的类型都为 `string`，这时我们就可以利用映射类型来实现：

```tsx
interface User {
  id: number
  name: string
  age: number
}

type UserString = {
  [P in keyof User]: string
}
```

`keyof T` 是**索引类型查询操作符**，对于任何类型 `T`，`keyof T` 返回结果为 `T` 上已知的公共属性名的联合类型。在这个例子中，`keyof User` 会返回 `User` 上属性的一个联合类型 `'id' | 'name' | 'age'`。再通过类似 `for .. in` 的方式迭代联合类型中的每个类型值作为对象类型的属性值，这种类型定义方式就叫做映射类型。

TS 提供的许多工具类型就利用了映射类型来实现的，例如[实现 Pick](https://typeroom.cn/problem/pick)，在后面我也会给出一些常用工具类型的手写。

刚刚说到 `keyof T` 可以获取属性名的联合类型，而对于**元组和数组类型**而言还可以通过 `T[number]` 来获取它们所拥有的所有元素的一个联合类型。

### infer 关键字

`infer` 是一个用于在**条件类型**中进行类型推断的关键字。它主要用于从现有类型中提取一部分类型信息，从而构建新的类型。

直接看仍然比较抽象，我们看个例子：

假设有一个函数 `sum`，这个函数功能是接收两个 `number` 类型的参数，最终返回这两个参数的和，因此返回类型也是 `number`。现在我们想定义一个工具类，这个工具类可以获取函数的返回值，这里我们就需要利用 `infer` 来实现：

```tsx
const sum = (a: number, b: number): number => a + b

type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : T
```

以上其实就是 TS 中提供的工具类 `ReturnType<T>` 的手写实现。工具类型 `MyReturnType` 接收一个泛型 `T`，这里我们利用条件类型判断 `T` 是否是一个函数，并利用关键字 `infer` 来获取函数的返回类型。<u>需要注意，`infer` 关键字只能在条件类型中使用</u>。

同样地，在 TypeRoom 中也有相应的一些练习——[实现 Awaited](https://typeroom.cn/problem/awaited)。

`infer` 还有很多不可思议的用法，例如我们想要获取一个字符串类型中的第一个字符，这里便可以利用模板字符串并结合 `infer` 来获取：

```tsx
type GetFirstChar<S> = S extends `${infer T}${infer U}` ? T : S;
```

还有在数组类型中我们也可以利用 `infer` 关键字来获取数组元素，例如我们想获取数组中的最后一个元素类型，这里便可以利用扩展运算符并结合 `infer` 来获取：

```tsx
type Last<T extends any[]> = T extends [...infer L, infer R] ? R : never
```

### 联合类型的分配性

我们要如何去遍历一个联合类型呢？巧妙的是，**当条件类型作用于泛型类型时，当泛型是联合类型时会变得具有分配性**。

来看个例子，TS 的内置工具类 `Exclude<T, U>`，其作用是从联合类型 `T` 中排除 `U` 的类型成员，返回一个新的类型。现在我们来手写实现它：

```tsx
type MyExclude<T, U> = T extends U ? never : T

type Anis = 'dog' | 'cat' | 'pig'
type Anis2 = 'cat' | 'horse'
type Result = MyExclude<Anis, Anis2>  // type Result = 'dog' | 'pig'
```

上面执行 `MyExclude<Anis, Anis2>` 时等价于：

```tsx
type Result = ('dog' extends Anis2 ? never : 'dog') |
              ('cat' extends Anis2 ? never : 'cat') |
              ('pig' extends Anis2 ? never : 'pig')
```

这样我们就可以利用这个分配性来迭代一个联合类型，来实现  `Exclude<T, U>` 工具类。

## 常用工具类型

在[官方文档](https://www.typescriptlang.org/docs/handbook/utility-types.html)中说明了 TS 中提供的所有内置的工具类型，这里我总结下一些常用的工具类并给出它们的手写实现。

1. `Partial<T>`

   接收一个对象类型，用于将一个对象类型的所有属性变为**可选**。

   ```tsx
   type Partial<T> = {
     [P in keyof T]?: T[P]
   }
   ```

2. `Required<T>`

   接收一个对象类型，与 `Partial` 相反，它会将一个对象类型的所有属性变为**必选**。

   ```tsx
   type Required<T> = {
     [P in keyof T]-?: T[P]
   }
   ```

   这里的 `-?` 可以移除属性的可选修饰符，使得原本可选的属性变为必选。

3. `Readonly<T>`

   接收一个对象类型，将一个对象类型的所有属性变为**只读**。

   ```tsx
   type Readonly<T> = {
     readonly [P in keyof T]: T[P]
   }
   ```

4. `Record<K, T>`

   用于构建一个对象类型，其属性键为 `K` 类型，属性值为 `T` 类型。`K` 可以是一个联合类型、对象类型或者枚举类型。

   ```tsx
   type Record<K extends keyof any, T> = {
     [P in K]: T
   }
   ```

5. `Pick<T, K>`

   从类型 `T` 中**挑选出**属性 `K`，并返回一个新的类型。

   ```tsx
   type Pick<T, K extends keyof T> = {
     [P in K]: T[P]
   }
   ```

6. `Omit<T, K>`

   从类型 `T` 中**移除**属性 `K`，并返回一个新的类型。

   ```tsx
   type Omit<T, K extends keyof T> = {
     [P in keyof T as P extends K ? never : P]: T[P]
   }
   ```

   利用条件类型判断当前属性 `P` 是否在 `K` 中存在，如果存在，则该属性名的值类型为 `never` ，即该属性会被排除；如果不存在，则值类型为 `P` ，即该属性会保留，最后利用 TypeScript 中的**类型断言**将当前属性的值断言为<u>条件类型得到的值类型</u>，从而实现移除属性。

7. `Exclude<T, U>`

   从一个联合类型 `T` 中排除联合类型 `U` 的类型成员，并返回一个新的联合类型。

   ```tsx
   type Exclude<T, U> = T extends U ? never : T
   ```

   