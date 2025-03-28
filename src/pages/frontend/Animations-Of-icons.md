---
title: icons 动画实现方案
date: 2025/3/28
type: frontend
meta:
  - name: description
    content: 详细介绍了几种icons的动画实现方案，包括精灵图动画、SVG动画以及GIF或APNG可动图片方式
---

[[toc]]

## 精灵图动画

我们都知道精灵图在最初是用于涉及大量图片项目中减少并发 HTTP 连接数的一种方案，现在由于 HTTP/2 版本已经大大缓解了并发连接数的问题，现在的大多数项目也不再使用精灵图了。但精灵图还有一个作用，就是可以实现动画。

现在我们有下面这个精灵图：

![twitter](./twitter.png)

这个精灵图包含了 29 张图片，即这个动画一共 29 帧。这里我们把这张图片作为 `background-image` 使用，那么通过关键帧动画设置 `background-position` 来移动图片，从而实现精灵图动画。

```html
<style>
  .wrapper {
    width: 100px;
    height: 100px;
    background-image: url("./image/twitter.png");
    background-position: 0 0;
    animation: move 1s steps(29, jump-none) infinite;  // [!code highlight]
  }
  @keyframes move {
    from {
      background-position: 0 0;
    }
    to {
      background-position: -2800px 0;
    }
  }
</style>

<body>
  <div class="wrapper"></div>
</body>
```

注意到在设置动画的 `animation-timing-function` 时，使用到了 `steps` 函数。利用 [steps(n, jumpterm)](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-timing-function#stepsn_jumpterm) 函数可以让动画按照 `n` 个定格在过渡中显示动画，每个定格等长时间显示。这里我们的精灵图一共有 29 张图片，因此设置 `n` 为 29。

这样我们就得到了一个 icons 动画：

<video src="./2025328-13335.mp4" autoplay loop muted playsinline></video>

我们还可以只通过 CSS 的方式实现用户可交互式的动画：

```html
<style>
  .wrapper {
    width: 100px;
    height: 100px;
    background-image: url("./image/twitter.png");
    background-position: 0 0;
  }
  input:checked ~ .wrapper {	// [!code ++]
    animation: move 1s steps(29, jump-none) forwards;
  }
  @keyframes move {
    from {
      background-position: 0 0;
    }
    to {
      background-position: -2800px 0;
    }
  }
</style>

<body>
  <input type="checkbox" id="love" />	// [!code ++]
  <label for="love">Love</label>	// [!code ++]
  <div class="wrapper"></div>
</body>
```

<video src="./2025328-142936.mp4" autoplay loop muted playsinline></video>

### 优势

- **高性能**：可以纯 CSS 控制，因此可以不阻塞主线程
- **控制灵活**：支持控制，可精准控制播放状态
- **交互性强**：纯 CSS 也可实现用户交互动画

### 局限

- **文件体积较大**：单张图片包含多帧，可能增加初始加载时间。
- **缩放失真**：高分辨率适配需要通过媒体查询和 `srcset` 实现，但坐标处理较复杂（可通过 CSS 变量和 `calc` 解决）

## SVG 动画

矢量图 SVG 本身就支持动画，通过 SVG 实现 icons 动画也是个不错的选择。这里分享一个开源库 [pqoqubbw/icons](https://icons.pqoqubbw.dev/)，里面提供了很多具备动画的 SVG icons。

### 优势

- **矢量无损**：分辨率无关，无限缩放不失真，无需多套资源
- **文件体积小**：简单图形的 SVG 代码量少，加载速度快
- **灵活可控**：可通过 CSS 或 JavaScript 精确控制动画的每一帧、暂停、回放等
- **交互性强**：支持与 DOM 元素结合，实现事件触发的复杂动画

### 劣势

- **实现复杂**：制作门槛高
- **复杂动画性能**：过度复杂的 SVG 动画可能导致渲染性能下降，尤其在低端设备上。

## GIF / APNG

对于一些自动播放的加载动画，我们也可以使用 GIF / APNG 格式的图片，适合加载提示等简单循环动画。

### 优势

- **简单易用**：直接嵌入图片，无需额外代码，开发成本低

### 劣势

- **色彩限制**：GIF 仅支持 256 色，APNG 虽支持真彩色但文件体积可能更大
- **性能问题**：高帧率或复杂动画会导致文件过大，影响加载速度
- **控制不灵活**：动画一旦加载即自动循环，难以通过代码精确控制（如暂停、进度）
- **无法交互**：纯图片格式，不支持与 DOM 或用户交互的动态响应