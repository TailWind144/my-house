---
title: View Transitions
date: 2023/8/19
type: tech
---

[[toc]]

这个API很有意思，利用这个API可以很好很方便地实现一些动画效果。

先说明下，这个API还在<u>实验阶段</u>，也就是说存在兼容性问题，在用于生产环境时请注意兼容性处理。

看下[MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)里给的基本示例：

```javascript
function updateView(event) {
  const targetIdentifier = event.target.firstChild || event.target;

  const displayNewImage = () => {
    const mainSrc = `${targetIdentifier.src.split("_th.jpg")[0]}.jpg`;
    galleryImg.src = mainSrc;
    galleryCaption.textContent = targetIdentifier.alt;
  };

  const transition = document.startViewTransition(() => displayNewImage());
}
```

在这个基本示例中，我们将DOM元素的操作封装在displayNewImage这个函数中，去进行图片的一个切换。然后去调用View Transition API去执行DOM的操作。那么当这个事件被调用时，在默认情况下，浏览器会以淡入淡出的效果来进行视图的转换。

## 视图转换的工作过程

这个API的工作原理本质上就是通过截取旧页面的屏幕截图，然后执行传入函数的DOM操作。当执行完毕后，API会捕获页面的新状态，同时会创建如下结构的伪元素树。

```
::view-transition
└─ ::view-transition-group(root)
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)
      └─ ::view-transition-new(root)
```

其中[`::view-transition-old`](https://developer.mozilla.org/en-US/docs/Web/CSS/::view-transition-old)为旧页面视图的屏幕截图，[`::view-transition-new`](https://developer.mozilla.org/en-US/docs/Web/CSS/::view-transition-new)则为新页面视图的屏幕截图。在默认情况下旧页面视图从opacity:1到0，而新页面视图则从opacity:0到1，从而实现淡入淡出的动画效果。

## 不同元素不同过渡

在默认情况下，所有的DOM元素都会参与到淡入淡出的动画效果中。如果希望页面中某个元素不参与到该动画效果中，或者说希望某个元素去使用不同的动画效果来进行视图转换，我们可以通过设置CSS属性[`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name)来实现。例如：

```css
.figcaption {
  view-transition-name: figure-caption;
}
```

此时，生成的伪元素树如下所示：

```
::view-transition
├─ ::view-transition-group(root)
│ └─ ::view-transition-image-pair(root)
│     ├─ ::view-transition-old(root)
│     └─ ::view-transition-new(root)
└─ ::view-transition-group(figure-caption)
  └─ ::view-transition-image-pair(figure-caption)
      ├─ ::view-transition-old(figure-caption)
      └─ ::view-transition-new(figure-caption)
```

可以发现生成了另外一组伪元素组，我们可以单独为figure-caption的伪元素组设置视图转换的样式，从而进行不同的过渡效果。

动画效果的样式直接通过CSS为相应的伪元素设置即可。

## Container transform

现在我们要利用这个API来实现[Material Design‘s container transform transition](https://m2.material.io/design/motion/the-motion-system.html#container-transform)的动画效果。

首先，我们可以发现在 Container transform 过渡中，最直观的特点就是过渡前后页面存在相同的元素，而且这个元素是过渡的主体部分。这里说的相同元素并不指的是DOM元素，我们要实现这种效果一般需要进行路由的跳转，所以DOM元素并不相同，这里说的相同指的是元素意义上或者说展示的内容相同。

也就是说其实这里的实际DOM元素并不是相同的。对于不相同的DOM元素但意义上相同，我们可以通过在执行路由跳转前（DOM操作前）去设置该DOM元素的 view-transition-name 与跳转后对应DOM元素的 view-transition-name 相同即可实现上述动画效果。

例如：

（未完待续……）