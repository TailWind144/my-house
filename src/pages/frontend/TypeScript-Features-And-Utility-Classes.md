---
title: TypeScript 中的一些特性和工具类
date: 2025/1/6
type: frontend
meta:
  - name: description
    content: 介绍 TypeScript 中的一些相关特性和工具类，包括扩展运算符、映射类型、infer 关键字、联合类型的分配性以及 TS 中的常用工具类
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

注意，有些同学可能认为一个简单的 `push` 操作却要利用扩展运算符去做这不很影响性能吗？这里我们需要明确的是在类型系统中<u>关于类型的操作是**不会存在运行时性能问题的**</u>。TS 属于**编译型**语言，关于<u>类型的检测都是在**编译时**完成的</u>，并不会将类型的一些操作转换为最终的 JS。这就好比在建筑施工前，通过详细的设计图纸（TypeScript 代码和类型检查）确保建筑结构合理，而最终实际建造的建筑（JavaScript 代码）是按照没有这些设计标注的普通图纸（不含类型信息）来施工的。所以<u>类型操作是**不会对运行时的性能产生影响的**</u>，但是对编译时性能是会有影响的。

### 映射类型

简单来说，映射类型就是将一个类型映射成另一个类型。映射类型指的是我们可以迭代一个属性名的集合（通常是一个联合类型）来设置属性，从而创建一个新类型。

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

### 联合类型的分配性（分布条件类型）

我们要如何去遍历一个联合类型呢？巧妙的是，**当条件类型作用于泛型类型时，且该泛型是联合类型时会变得具有分配性**。

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

------

需要注意的是，`never` 是一个**特殊的联合类型**，它<u>没有任何一个成员</u>。因此会出现以下这种出乎意料的情况：

```tsx
// a is true
type a = never extends never ? true : false;

// b is never
type isNever<T> = T extends never ? true : false
type b = isNever<never>
```

因为 `never` 是联合类型，根据联合类型的分配性，当 `never` 作为泛型传入且参与条件类型时，它需要将成员分别参与计算最后合并为一个联合类型返回。但又由于它并不包含任何成员，自然也不需要参与条件类型计算了，所以此时会直接返回 `never`。

根据[官方文档](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)关于 *Distributive Conditional Types*（分布条件类型） 的描述，如果你不想联合类型具有这样的行为，可以将 `extends` 两侧的类型改用元组形式：

```tsx
// b is true
type isNever<T> = [T] extends [never] ? true : false
type b = isNever<never>
```

## 协变、逆变和不变

在类型系统中，都存在着几种针对类型关系如何在泛型类型中变化的规则，即**协变、逆变和不变**。它们是保证在类型编程中类型安全的重要机制。

### 里氏替换原则

在理解协变、逆变和不变前，我们先来明确父子类型的替换关系：如果一个类型 A 是另一个类型 B 的子类型，那么在任何使用 B 的地方都可以使用 A，而不会引起错误或异常。即<u>父类型能做到的，换成子类型也一定能做到</u>，这种行为就是我们常说的**里氏替换原则**。

```ts
type Animal = { name: string }
type Cat = Animal & { meow: () => void }

const cat: Cat = { name:'cat', meow: () => {} }
const animal: Animal = cat	// 允许赋值
```

因为 `Cat` 是 `Animal` 的子类，因此它具有 `Animal` 类的所有成员，满足里氏替换原则，具备类型安全。

但反过来便不能正常赋值。因为 `animal` 对象缺少类型 `Cat` 的部分成员，在后续的代码逻辑中可能会访问 `animal` 对象所不拥有的成员导致报错，不满足里氏替换原则。

而协变和逆变的目的就是为了满足里氏替换原则来保证类型安全。

### 协变

**协变**指**生产者类型**（仅输出 `T` 的类型）的子类型关系保留原始类型的子类型关系。即如果 `A` 是 `B` 的子类型，则 `T<A>` 也是 `T<B>` 的子类型（保持方向）。

- **数组**

```ts
type Animal = { name: string }
type Cat = Animal & { meow: () => void }

let cats: Cat[] = [{ name: "Whiskers", meow: () => {} }]
let animals: Animal[] = cats // 协变允许赋值（Cat[] 是 Animal[] 的子类型）
```

- **对象**

```ts
type Producer<T> = { get: () => T }
let catProducer: Producer<Cat> = { get: () => ({ name: "Whiskers", meow: () => {} }) }
let animalProducer: Producer<Animal> = catProducer // 协变允许赋值
```

在以上两者场景中，我们可以将泛型类型的子类型实现赋值给约束为对应泛型类型的父类型变量。因为后续针对泛型类型的父类型的逻辑处理，其泛型类型的子类型也一定能够处理。因此此时它们仍然保持原类型的父子类型关系，即发生了**协变**，满足里氏替换原则。

### 逆变

**逆变**主要出现在**消费者类型**（仅输入 `T` 的类型）的场景中，典型的场景就是函数的参数类型，它们的子类型关系是相反的。例如：

```ts
type AnimalHandler = (animal: Animal) => void
type CatHandler = (cat: Cat) => void

let animalHandler: AnimalHandler = (a) => console.log(a.name)
let catHandler: CatHandler = animalHandler // 逆变允许赋值
```

在以上代码中，函数 `animalHandler` 的参数类型为 `Animal`。`Animal` 是 `Cat` 的父类，因此在类型 `AnimalHandler` 的实现中，对函数参数的访问一定不会超出 `Cat` 的约束（因为 `Animal` 的成员一定包含于 `Cat` 中  ），所以允许赋值。此时可以认为 `AnimalHandler` 是 `CatHandler` 的子类型，即发生了**逆变**，满足里氏替换原则。

但反过来便不能正常赋值。因为 `Cat` 拥有 `Animal` 没有的成员，`CatHandler` 的实现函数中可能会访问 `Animal` 所没有的成员。因此为了保证类型安全，不会允许赋值。

> **注意**：在 TypeScript 中， [参数类型是双向协变的](https://github.com/Microsoft/TypeScript/wiki/FAQ#why-are-function-parameters-bivariant) ，也就是说既是协变又是逆变的，但这会破坏类型安全。可以通过 `--strictFunctionTypes` 或 `--strict` 标记来修复这个问题。

### 不变

若泛型类型同时涉及输入和输出 `T`，则该类型既不存在协变也不存在逆变，而是**不变**。即使 `A` 是 `B` 的子类型，`T<A>` 和 `T<B>` 之间也没有任何继承关系。例如：

```ts
interface Box<T> {
    value: T;
    set: (v: T) => void;
}

let catBox1: Box<Cat> = {
    value: { name: "Whiskers", meow: () => {} },
    set: (c: Cat) => {}
};
let animalBox1: Box<Animal> = catBox1 // 不允许赋值

let animalBox2: Box<Animal> = {
    value: { name: "Whiskers" },
    set: (c: Animal) => {}
};
let catBox2: Box<Cat> = animalBox2 // 不允许赋值
```

假设以上情况是协变的，即允许 `animalBox1 = catBox1`，当 `animalBox1` 调用其 `set` 方法并传入一个 `Animal` 类型或其他子类类型的参数时，显然是不安全的（`catBox1.set` 可能会访问传入参数没有的成员）；假设是逆变的，即允许 `catBox2 = animalBox2`，当 `catBox2` 对象访问 `value.meow` 方法时，显然是不安全的（`animalBox2.value` 没有 `meow` 方法）。

可以发现这里的协变和逆变不可能同时满足，无论选择协变还是逆变，都会破坏另一方的类型安全。因此，唯一安全的选择是**不变**。即它们之间并不存在父子类关系，也就不存在需要满足里氏替换原则。

> **注意**：TypeScript 的数组默认是**协变**的，这是 TypeScript 在实用性和类型安全性之间做出的权衡。
>
> ```ts
> const cats: Cat[] = [myCat];
> const animals: Animal[] = cats; // ✅ 允许赋值（协变）
> 
> animals.push({ name: "Dog" }); // 污染猫数组
> cats[1].meow(); // 运行时错误！
> ```

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

   这里的 `-` 可以移除属性的修饰符，因此 `-?` 表示移除可选修饰符，使得原本可选的属性变为必选。

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

   