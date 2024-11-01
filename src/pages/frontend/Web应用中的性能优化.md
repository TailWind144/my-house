---
title: Web应用中的性能优化
date: 2023/9/26
type: frontend
---

[[toc]]

老生常谈的问题。

## 一、编码

1. 减少回流重绘。
2. 防抖节流。
3. 注意内存泄漏。
4. 路由懒加载。避免一次性加载过多资源，提高首次渲染的速度。
5. 事件委托。

对于 <u>Vue</u> 项目而言还有：

1. 注意 **v-if** 和 **v-show** 的使用场景。
2. 避免 **v-for** 和 **v-if** 同时使用。v-for 的优先级比 v-if 判断的优先级要高，会先渲染完所有数据再判断是否要显示该元素。
3. **keep-alive** 缓存组件。

## 二、具体场景优化

1. 对于长列表数据渲染：分页 或 **滚动加载** 或 **虚拟列表。**
2. 一些复杂的密集型计算型任务可以交给 **Web Worker** 执行。Web Worker 开启的子线程**不会阻塞事件循环**，故可以将一些复杂的计算任务交给其执行，避免阻塞主线程。
2. 被动事件。
2. 对于一些长任务的执行，考虑分解为多个子任务并利用事件循环来执行，避免任务过长导致阻塞主线程。

## 三、图片

1. **雪碧图（精灵图）**。将多张图标图片放在一张图片中。既能减少请求次数，还可以进一步减小图片体积。
2. **图片懒加载**（`loading="lazy"` 或  [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)）。不一次性加载所有图片，加快首屏渲染速度。
3. 对于小体积图片可以采用 **base64** 格式（Webpack可通过 **asset/inline** 或 **url-loader**）。
3. 根据实际情况，优先采用 **WebP** 的图片编码格式（但仍需要 PNG 或其他编码格式做兜底）。
3. 对于 GIF 类型的图片，尽可能选择**视频**来替代（GIF 图片体积太大）。

## 四、打包压缩

1. 通过打包构建工具对整个项目进行压缩。
2. **Tree Shaking** 清除无用代码。
3. **Code Split** 来提取公共模块。

## 五、浏览器层面

1. 减少 http 请求。
2. 利用好**浏览器缓存策略**（强缓存和协商缓存）。
3. 使用 **http2.0 **/ 3.0 或者说 **https。**

## 六、资源传输

1. 静态资源做 **CDN** 缓存。

2. **gzip** 或 Brotli 压缩传输。

3. **SSR** 服务端渲染。

4. 通过设置 `<link>` 标签的 `ref=preconnect` 以尽早地与**重要的第三方**来源建立连接。

5. 通过设置 `<link>` 标签的 `rel=dns-prefetch` 尽早解析**重要的第三方**的域名。

   注意在同一 `<link>` 标签中设置 `preconnect` 和 `dns-prefetch` 会导致 Safari 中的 `preconnect` 被取消的错误，所以尽可能在不同的 `<link>` 标签中设置。

   ```html
   <link rel="preconnect" href="http://example.com">
   <link rel="dns-prefetch" href="http://example.com">
   ```



