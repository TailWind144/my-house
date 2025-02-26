---
title: View Transitions
date: 2024/8/12
type: frontend
meta:
  - name: description
    content: 介绍 View Transitions 的用法并给出了一个简单 demo
---

[[toc]]

这个 API 很有意思，利用这个 API 可以很好很方便地实现一些动画效果。

先说明下，这个 API 还在<u>实验阶段</u>，也就是说存在兼容性问题，在用于生产环境时请注意兼容性处理。

看下 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) 里给的基本示例：

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

在这个基本示例中，我们将 DOM 元素的操作封装在 `displayNewImage` 这个函数中，去进行图片的一个切换。然后去调用 View Transition API 去执行 DOM 的操作。那么当这个事件被调用时，在默认情况下，浏览器会以淡入淡出的效果来进行视图的转换。

## 视图转换的工作过程

这个 API 的工作原理本质上就是通过截取旧页面的屏幕截图，然后执行传入函数的 DOM 操作。当执行完毕后，API 会捕获页面的新状态，同时会创建如下结构的伪元素树。

```
::view-transition
└─ ::view-transition-group(root)
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)
      └─ ::view-transition-new(root)
```

其中[`::view-transition-old`](https://developer.mozilla.org/en-US/docs/Web/CSS/::view-transition-old)为旧页面视图的屏幕截图，[`::view-transition-new`](https://developer.mozilla.org/en-US/docs/Web/CSS/::view-transition-new)则为新页面视图的屏幕截图。在默认情况下旧页面视图从opacity:1到0，而新页面视图则从opacity:0到1，从而实现淡入淡出的动画效果。

## 不同元素不同过渡

在默认情况下，所有的 DOM 元素都会参与到淡入淡出的动画效果中。如果希望页面中某个元素不参与到该动画效果中，或者说希望某个元素去使用不同的动画效果来进行视图转换，我们可以通过设置 CSS 属性 [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) 来实现。例如：

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

可以发现生成了另外一组伪元素组，我们可以单独为 figure-caption 的伪元素组设置视图转换的样式，从而进行不同的过渡效果。

动画效果的样式直接通过 CSS 为相应的伪元素设置即可。

## Container transform

现在我们要利用这个 API 来实现[Material Design‘s container transform transition](https://m2.material.io/design/motion/the-motion-system.html#container-transform)的动画效果。

首先，我们可以发现在 Container transform 过渡中，最直观的特点就是过渡前后页面存在相同的元素，而且这个元素是过渡的主体部分。这里说的相同元素并不指的是 DOM 元素，我们要实现这种效果一般需要进行路由的跳转，所以 DOM 元素并不相同，这里说的相同指的是元素意义上或者说展示的内容相同。

也就是说其实这里的实际 DOM 元素并不是相同的。对于不相同的 DOM 元素但意义上相同，我们可以通过在执行路由跳转前（ DOM 操作前）去设置该 DOM 元素的 `view-transition-name` 与跳转后对应 DOM 元素的 `view-transition-name` 相同即可实现上述动画效果。

现在我们有一个图片列表全局视图 `HomeView.vue`，当用户点击图片时会跳转到图片细节视图 `ImgDetailView.vue`。那么我们在这个点击事件中更改点击图片的 `view-transition-name` 与图片细节视图中图片的 `view-transition-name` 相同：

```vue
// HomeView.vue
// ……
<script setup>
// 点击事件函数
const checkImgDetail = (e, name) => {
  if (lastImg.value) lastImg.value.style.viewTransitionName = "";
  e.target.style.viewTransitionName = "full-embed";
  const routeChange = () => {
    router.push({
      path: "/imgDetail",
      query: { name },
    });
  };
  document.startViewTransition(() => routeChange());
};
</script>

// ImgDetailView.vue
<template>
  <div class="wrapper">
    <div class="top-img">
      <img :src="imgSrc" />
    </div>
  </div>
</template>

<script setup>
// ……
</script>

<style scoped>
.wrapper {
  padding: 0 20vw;
  display: flex;
  justify-content: center;
}
.top-img img {
  width: 100%;
  view-transition-name: full-embed;
}
</style>
```

但此时从 `ImgDetailView.vue` 切换回 `HomeView.vue` 时并没有缩放回去的动画，因为我们并没有实现这一部分的代码。与之前一样，只需要将跳转回 `HomeView.vue` 视图时将对应图片的 `view-transition-name` 与列表视图中图片的 `view-transition-name` 相同即可。

但如何确定当前细节视图下的图片在列表视图中对应的是哪一张呢？我们发现在刚刚的代码中 `HomeView.vue` 在进行路由跳转时将一个 name 作为参数传递了过去，这个 name 你可以认为是图片链接中的某一个特征。那么在跳转回 `HomeView.vue` 时在 `OnMounted` 生命周期中便可根据该特征去查找该图片的DOM元素。

```vue
// HomeView.vue
// ……
<script setup>
const backTransition = () => {
  if (route.query.name) {
    const { name } = route.query;
    const imgs = Array.from(document.getElementsByTagName("img"));
    lastImg.value = imgs.find((item) => item.src.includes(name));
    lastImg.value.style.viewTransitionName = "full-embed";
  }
};
onMounted(() => {
  backTransition();
});
</script>
```

现在我们就成功实现了一个流畅的 Container transform 过渡动画：

![20240812150135](./20240812150135.gif)

## 总结

View Transitions 是一个很强大的API，利用 View Transitions 可以很好地实现美观又流畅的动画。但 View Transitions 还在实验阶段，同时在现在流行的 MVVM 框架下开发时，面对一些复杂场景想通过 View Transitions 来实现会非常麻烦。现在许多框架（如 Nuxt.js ）也在进一步地去集成该 API 以便更好地去使用 View Transitions。