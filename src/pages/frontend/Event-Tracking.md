---
title: 埋点监控
date: 2024/10/6
type: frontend
meta:
  - name: description
    content: 介绍了前端开发中的埋点监控方案
---

[[toc]]

## 错误信息采集

1. **try / catch**

   只能捕获代码中常规的运行错误，语法错误和异步错误不能通过该方式捕获。

   ```js
   // 示例1：常规运行时错误，可以捕获 ✅
   try {
       let a = undefined;
       if (a.length) {
           console.log('111');
       }
   } catch (e) {
       console.log('捕获到异常：', e);
   }
   
   // 示例2：语法错误，不能捕获 ❌  
   try {
       const notdefined,
   } catch(e) {
       console.log('捕获不到异常：', 'Uncaught SyntaxError');
   }
   
   // 示例3：异步错误，不能捕获 ❌
   try {
       setTimeout(() => {
           console.log(notdefined);
       }, 0)
   } catch(e) {
       console.log('捕获不到异常：', 'Uncaught ReferenceError');
   }
   ```

2. **window.onerror**

   `window.onerror` 可以捕获常规错误、异步错误，但不能捕获语法错误和资源错误。

   ```js
   window.onerror = function(message, source, lineno, colno, error) {
     console.log("捕获到的错误信息是：", message, source, lineno, colno, error);
   };
   
   // 示例1：常规运行时错误，可以捕获 ✅
   console.log(notdefined);
   
   // 示例2：语法错误，不能捕获 ❌
   const notdefined;
   
   // 示例3：异步错误，可以捕获 ✅
   setTimeout(() => {
     console.log(notdefined);
   }, 0);
   
   // 示例4：资源错误，不能捕获 ❌
   let script = document.createElement("script");
   script.type = "text/javascript";
   script.src = "https://www.test.com/index.js";
   document.body.appendChild(script);
   ```

   但如果是通过 `addEventListener` 来进行 `error` 事件回调函数的绑定的话，那么此时就可以捕获到资源错误。

3. **Promise 错误**

   Promise 中抛出的错误，通常通过 Promise 对象上的 `catch` 方法来处理。但当 Promise 对象被 reject 且没有 reject 处理器的时，这时可以通过监听 [unhandledrejection](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/unhandledrejection_event) 事件来处理。
   
4. **Vue 错误**

   在Vue项目中，不能通过 error 事件来捕获错误，需要通过 [app.config.errorHandler](https://cn.vuejs.org/api/application.html#app-config-errorhandler) 来处理。

   ```js
   app.config.errorHandler = (err, instance, info) => {
     // 处理错误，例如：报告给一个服务
   }
   ```

   它可以从下面这些来源中捕获错误：

   - 组件渲染器
   - 事件处理器
   - 生命周期钩子
   - `setup()` 函数
   - 监听器
   - 自定义指令钩子
   - 过渡 (Transition) 钩子

## 性能数据采集

性能指标主要有：

1. **FP（First Paint）首次渲染**

   又称为白屏时间，标识用户首次访问网站时，页面中任意元素首次渲染的时间。

2. **FCP（First Content Paint）首次内容渲染**

   表示页面中第一块内容完成的时间。FCP决定了用户首次感知页面加载速度的时间。

3. **FMP（First Meaningful Paint）首次有效渲染**

   表示第一个有意义的内容渲染完成的时间。这个内容应由页面预期的任务决定，反映了页面主要内容出现在页面上所需的时间。

4. **LCP（Largest Content Paint）最大内容渲染**

   表示视口内可见的最大元素的渲染时间，这个元素包括：图片、SVG、视频、文本节点、包含内联元素的块级元素。

5. **DCL（DOM ContentLoaded Event）**

   当该事件触发时，表示 DOM 已经加载完成，但图片、样式表等外部资源还没加载完毕。

6. **L（Onload Event）**

   当该事件触发时，表示页面的所有资源都已经加载完毕。

性能数据可以通过 [PerformanceObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver/PerformanceObserver) 性能监控对象来获取，该 API 会返回一个相对时间。或者使用 Chrome 开发团队提供的 [web-vitals](https://www.npmjs.com/package/web-vitals) 库，方便来计算各性能数据（注意：web-vitals 不支持 Safari 浏览器）。

### 资源加载

获取页面中加载的资源信息，通过分析这些资源是如何加载的，可以帮助我们了解究竟是什么原因拖慢了网页，从而采取对应的措施来提升网页速度。

可以通过 [Performance.getEntriesByType()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType) 方法来获取页面加载的资源列表，或者直接在开发者调式工具的网络模块中查看。

## 用户行为采集

可以通过一个自定义类来管理用户行为信息。

```js
// 创建用户行为类
class UserActionCollecter {
  // maxNum 控制上报用户行为的最大条数
  maxNum = 20;
  // stack 存储用户行为
  stack = [];
  constructor() {}
  // 添加用户行为栈
  push(data) {
    if (this.stack.length >= this.maxBreadcrumbs) {
      // 超出则删除第一条
      this.stack.shift();
    }
    this.stack.push(data);
    // 按照时间排序
    this.stack.sort((a, b) => a.time - b.time);
  }
}

let userActionCollecter = new UserActionCollecter();

// 添加一条页面跳转的行为，从home页面跳转到about页面
userActionCollecter.push({
  type: "Route",
  form: '/home',
  to: '/about'
  url: "http://localhost:3000/index.html",
  time: "1668759320435"
});

// 添加一条用户点击行为
userActionCollecter.push({
  type: "Click",
  dom: "<button id='btn'>按钮</button>",
  time: "1668759620485"
});

// 添加一条调用接口行为
userActionCollecter.push({
  type: "Xhr",
  url: "http://10.105.10.12/monitor/open/pushData",
  time: "1668760485550"
});

// 上报用户行为
reportData({
  uuid: "a6481683-6d2e-4bd8-bba1-64819d8cce8c",
  stack: userActionCollecter.getStack()
});
```

### 页面跳转

可以通过监听路由的变化来判断页面跳转，路由有 history、hash 两种模式，history 模式可以监听 `popstate` 事件，hash 模式通过监听 `hashchange` 事件。

### 用户点击

在 `document` 对象上监听 `click` 事件即可。

## 监控 SDK

以上介绍的是进行埋点监控需要知道的基础知识，现在来讲讲如何实现一个监控 SDK，以及需要注意哪些问题。

在开始实现前，先看一下 SDK 怎么使用：

```js
import StatisticSDK from 'StatisticSDK';
// 全局初始化一次
window.insSDK = new StatisticSDK('uuid-12345');


<button onClick={()=>{
  window.insSDK.event('click','confirm');
  ...// 其他业务代码
}}>确认</button>
```

首先把 SDK 实例挂载到全局，之后在业务代码中调用，这里的新建实例时需要传入一个 id，因为这个埋点监控系统往往是给多个业务去使用的，通过 id 去区分不同的数据来源。

### 数据发送

如何将收集到的数据发送给服务端，通常在前后端分离项目中都是采用 AJAX 的方式发送数据，但在埋点监控中会采用图片的方式来实现。原因主要有两点：

1. 图片没有跨域的限制，像 `srcipt` 标签、`img` 标签都可以直接发送跨域的 GET 请求，不用做特殊处理；

2. 兼容性好，一些静态页面可能会禁用脚本；

3. 一部分统计数据并不会在采集后立即发送给服务端，而是选择在用户关闭网页后再进行发送。但浏览器通常会忽略在 `unload` 事件中产生的异步 XHR 请求，而大部分浏览器会延迟卸载（unload）以加载图片；

   > 最可靠的方法是在 [`visibilitychange`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event) 事件发生时发送数据，详细请看[避免使用 unload 和 beforeunload](https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/sendBeacon#避免使用_unload_和_beforeunload)。

3. 不需要将其 `append` 到文档，只需设置 `src` 属性便能成功发起请求。

这里的图片不是为了展示，而是作为数据传输的媒介去传递数据，借助 `img` 标签的的 `src` 属性，在其 `url` 后面拼接上参数，服务端收到再去解析。

```js
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
  }
  // 数据发送
  send(baseURL,query={}){
    query.productID = this.productID;
    let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
    let img = new Image();
    img.src = `${baseURL}?${queryStr}`
  }
}
```

### Web beacon

当然现在通常会用 Web beacon（网络信标）的方式来发送这些统计数据，通过 [Navigator.sendBeacon()](https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/sendBeacon) 方法来发送数据。

```js
Navigator.sendBeacon(url,data)
```

优点：

1. 不会和主要业务代码抢占资源，而是在浏览器空闲时去做发送；
2. 在页面卸载时也能保证请求成功发送，不会延迟页面的卸载或影响下一个导航的载入性能。

现在的埋点监控工具通常会优先使用 `sendBeacon`，但由于浏览器兼容性，还是需要用图片的 `src` 作兜底。

### 用户行为监控

用户行为包括自定义事件和 PV 曝光，也可以把 PV 曝光看作是一种特殊的自定义行为事件。

```js
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
  }
  // 数据发送
  send(baseURL,query={}){
    query.productID = this.productID;
      let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      let img = new Image();
      img.src = `${baseURL}?${queryStr}`
  }
  // 自定义事件
  event(key, val={}) {
    let eventURL = 'http://demo/'
    this.send(eventURL,{event:key,...val})
  }
  // PV 曝光
  pv() {
    this.event('pv')
  }
}
```

### 页面性能监控

页面的性能数据可以通过 [Performance.timing](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance/timing) 这个 API 获取到，获取的数据是单位为毫秒的时间戳。

> 注意：该 API 已不再被推荐，该属性在 [Navigation Timing Level 2 specification](https://w3c.github.io/navigation-timing/#obsolete) 中已经被废弃，改用 [`PerformanceNavigationTiming`](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceNavigationTiming) 替代。

```js
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
    // 初始化自动调用性能上报
    this.initPerformance()
  }
  // 数据发送
  send(baseURL,query={}){
    query.productID = this.productID;
      let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      let img = new Image();
      img.src = `${baseURL}?${queryStr}`
  }
  // 性能上报
  initPerformance(){
    let performanceURL = 'http://performance/'
    this.send(performanceURL,performance.timing)
  }
}
```

### 错误警告监控

错误的采集方式之前已经介绍过，这里不再阐述。实现后开发人员可以通过调用 `StatisticSDK.error()` 方法来上报错误。

```js
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
    // 初始化错误监控
    this.initError()
  }
  // 数据发送
  send(baseURL,query={}){
    query.productID = this.productID;
      let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      let img = new Image();
      img.src = `${baseURL}?${queryStr}`
  }
  // 自定义错误上报
  error(err, etraInfo={}) {
    const errorURL = 'http://error/'
    const { message, stack } = err;
    this.send(errorURL, { message, stack, ...etraInfo})
  }
  // 初始化错误监控
  initError(){
    window.addEventListener('error', event=>{
      this.error(error);
    })
    window.addEventListener('unhandledrejection', event=>{
      this.error(new Error(event.reason), { type: 'unhandledrejection'})
    })
  }
}
```

以上便实现了一个基本的监控 SDK。

## 参考资料

https://cloud.tencent.com/developer/article/2062312