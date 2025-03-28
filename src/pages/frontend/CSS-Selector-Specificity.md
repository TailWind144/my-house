---
title: CSS 选择器权重
date: 2024/3/25
type: frontend
meta:
  - name: description
    content: 介绍 CSS 选择器的权重计算规则
---

[[toc]]

今天看到某家的一个面试题，<u>1000个类选择器叠加选择和1个 id 选择器选择同一个元素哪个样式会生效？</u>

很显然这道题涉及CSS选择器的权重问题，我们都知道类选择器的优先级是要比 id 选择器要低的，但如果1000个类选择器的权重叠加会不会比1个 id 的选择器更大呢，我们先来看看CSS中选择器的权重计算规则。

## CSS 选择器权重计算规则

一个选择器的优先级可以说是由三个不同的值（或分量）相加，可以认为是**百（ID）十（类）个（元素）**——三位数的三个位数：

- **ID**：选择器中包含 ID 选择器则百位得一分。
- **类**：选择器中包含类选择器、属性选择器或者伪类则十位得一分。
- **元素**：选择器中包含元素、伪元素选择器则个位得一分。

> **备注：** 通用选择器（[`*`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Universal_selectors)）、组合符（`+`、`>`、`~`、'空格'）和调整优先级的选择器（[`:where()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:where)）不会影响优先级。

否定（[`:not()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:not)）和任意匹配（[`:is()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:is)）伪类本身对优先级没有影响，但**它们的参数则会带来影响**。参数中，对优先级计算有贡献的参数的优先级的**最大值**将作为该伪类选择器的优先级。（例如，`button:not(#mainBtn, .cta)`的优先级为 1-0-1）

### 内联样式

**内联样式**，即 [`style`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes#style) **属性**内的样式声明，优先于所有普通的样式，无论其优先级如何。这样的声明没有选择器，但它们的优先级可以理解为 1-0-0-0；即无论选择器中有多少个 ID，它总是比其他任何优先级的权重都要高。

### !important

`!important` 可以覆盖上面所有的优先级计算。覆盖 `!important` 唯一的办法就是另一个 `!important` 具有相同*优先级*而且顺序靠后，或者更高优先级。

## 结果

其实在上述的规则当中就可以得知，id 选择器和类选择器并不处于一个等级，在MDN上已经写得很清楚：

>  每一个选择器类编都有它自己的优先级等级，它们不会被具有较低优先级的选择器覆盖。例如，权重为*一百万*的**类**选择器不会覆盖权重为*一*的 **ID** 选择器。

评估优先级的最佳方法是对不同的优先级等级**单独**进行评分，并从最高的等级开始，必要时再计算低优先级等级的权重。即，仅当某一列的优先级权重相同时，**你才需要评估下一列**；否则，<u>你可以直接忽略低等级的选择器，因为它们无法覆盖高优先级等级的选择器</u>。