---
title: Vue 常用的修饰符
date: 2023/10/4
type: frontend
meta:
  - name: description
    content: Vue 常用的修饰符，包括表单修饰符（v-model）、事件修饰符、鼠标键盘修饰符
---

[[toc]]

## 表单修饰符（v-model）

- **lazy**：输入时当光标离开元素时，才将值赋予给绑定值。
- **trim**：去除输入值两端的空格。
- **number**：自动将输入值转换为 Number 类型。

## 事件修饰符

- **stop**：阻止事件冒泡。
- **prevent**：阻止默认行为。
- **self**：只当在 event.target 是**当前元素**自身时触发处理函数。
- **once**：绑定了事件以后只能触发一次，第二次就不会触发。
- **capture**：绑定事件为**捕获事件**。
- **passive**：绑定事件为**被动事件**，不阻塞默认行为的执行。

## 鼠标键盘修饰符

- **left / right / middle**：鼠标左键 / 右键 / 中键 触发事件。
- **keyCode（对应按键的keyCode值）**：按下对应按键时触发事件。