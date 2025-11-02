---
title: 什么是“跨域隔离”状态？
date: 2025/11/1
type: frontend
meta:
  - name: description
    content: 介绍了什么是“跨域隔离”状态，并进一步介绍四种控制跨域资源的标头——跨域嵌入策略（COEP）、跨域资源共享（CORS）、跨域资源策略（CORP）、跨域开放者策略（COOP），且对涉及到的两种安全攻击——Spectre 攻击和 window.opener 漏洞做了简单介绍
---

[[toc]]

众所周知，浏览器中为了安全性考虑，存在**同源策略**，该策略限制了网站访问跨域资源的方式。但以下这些资源是不受同源策略限制的：

- 跨域 `iframe`
- 图片或 `script` 脚本
- 使用 DOM 引用打开的跨域弹出窗口

因此，浏览器后续又引入了两种方式来修补这些缺陷：一种就是引入了一种名为 [跨源资源共享 (CORS)](https://developer.mozilla.org/docs/Web/HTTP/CORS) 的新协议，该协议旨在确保服务器只与给定的来源共享资源。另一种方法是隐式移除了对跨域资源可以直接通过 `JS` 脚本访问的权限，并保持向后兼容性，这类跨域资源被称为 “不透明” 资源。这就是为什么除非对跨域图片应用 CORS，否则通过 `CanvasRenderingContext2D` 操作该跨域图片的像素会失败的原因。

## Spectre 攻击

在过去的很长一段时间，CORS 和不透明资源足以确保浏览器的安全，但这种情况随着 [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability)) 攻击的出现而发生了变化。

Spectre 攻击是一种**侧信道攻击**方式，本质是利用了 CPU “预测执行” 机制来实行的攻击。CPU 在进行分支逻辑计算时，会预测一个最可能的结果，并沿着预测的路径提前执行后面的指令。这些被提前执行的指令可能会访问内存、进行运算等。如果预测正确，这些提前执行的结果就会被正式提交，从而节省了大量时间。如果预测错误，CPU会简单地丢弃所有提前执行的结果。

而攻击者就是通过测量不同操作的**执行时间**，来判断某些数据是否被 CPU 缓存过，从而推断出敏感信息。这类攻击可以通过浏览器中存在的低粒度计时器实现，也可以通过高粒度计时器（如 `performance.now()`）和共享内存（如 `SharedArrayBuffer`）来提高攻击的成功率。

## 跨域隔离状态

因此为了降低被 Spectre 等测信道攻击的风险，浏览器直接限制了部分相关 API 在常规环境下的使用。但浏览器提供了一种用户可选择的隔离环境，称为 “跨域隔离” 状态。只有在该状态下才能够使用这些被限制的 Web API：

| API                                                          | 说明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`SharedArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) | 适用于 WebAssembly 线程。此功能从 Android Chrome 88 开始提供。桌面版目前默认启用，但需要跨源隔离状态，并且在 Chrome 92 中默认处于停用状态。 |
| [`performance.measureUserAgentSpecificMemory()`](https://web.developers.google.cn/articles/monitor-total-page-memory-usage?hl=zh-cn) | 从 Chrome 89 开始提供。                                      |
| [`performance.now()`，`performance.timeOrigin`](https://crbug.com/1180178) | 目前，许多浏览器都支持此功能，但精度限制为 100 微秒或更高。启用跨源隔离后，精度可以达到 5 微秒或更高。 |

跨域隔离状态还会阻止修改 `document.domain`。（过去，通过设置相同的 `document.domain`，子域之间可以相互通信，但这被认为是一个安全风险，因此现在已被废弃。）

如果要启用跨域隔离状态，需要在主文档中携带以下 HTTP 标头：

```http
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

开发者可以通过检查 [`self.crossOriginIsolated`](https://developer.mozilla.org/docs/Web/API/WindowOrWorkerGlobalScope/crossOriginIsolated) 来确定网页是否处于跨域隔离状态。

## 跨域嵌入策略（COEP）

跨域嵌入策略（Cross-Origin-Embedder-Policy，COEP），可以防止文档加载任何**未明确**授予该文档权限（使用 CORP 或 CORS）的跨源资源。

COEP 采用值 `require-corp`，这会强制执行以下策略：文档只能加载来自同一来源的资源，或**明确标记**为可从其他来源加载的资源（即其他资源明确通过 CORP 或 CORS 说明当前源可以加载）。也就是说，如果跨域资源没有通过 CORP 或 CORS 标记其可以被哪些来源加载就会被 COEP 阻止，即使这个跨域资源是不受同源策略限制的。

这种限制非常严格，我们通常很难要求这些第三方提供的跨域资源会添加这个标头。但事实上我们可以认为，只有使用凭据请求的资源才可能会有风险，因为凭证中包含着攻击者无法自行加载的敏感信息。这意味着，无需凭据即可请求的资源是公开的，是可以被安全加载的。

因此，COEP 还存在另一个值 `credentialless`，同样该值也可以启用跨域隔离状态，且无需要求跨源请求提供 CORP 或 CORS 标头，但这些请求不会在发送时携带凭证（如 Cookie）。

## 跨域资源共享（CORS）

跨域资源共享（Cross-Origin-Resoure-Share，CORS），使得服务器可以通过设置相关标头来告知客户端浏览器允许其他[源](https://developer.mozilla.org/zh-CN/docs/Glossary/Origin)（域、协议或端口）访问自己的资源。开启 CORS 后，对于非简单请求（可能对服务器数据产生副作用的 HTTP 请求方法）要求浏览器必须先使用 [`OPTIONS`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Methods/OPTIONS) 方法发起一个**预检请求**到服务器，以获知服务器是否允许该实际请求。“预检请求” 的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响。

相关请求响应头部字段请在该[文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS#http_%E5%93%8D%E5%BA%94%E6%A0%87%E5%A4%B4%E5%AD%97%E6%AE%B5)中查看。

如果跨域资源支持 CORS，可以使用 [`crossorigin`](https://developer.mozilla.org/docs/Web/HTML/Attributes/crossorigin) 属性将其加载到网页中，而不会被 COEP 阻止，例如：

```html
<img src="https://third-party.example.com/image.jpg" crossorigin>
```

同样，也可以通过 `fetch()` 方法提取跨域数据，只要服务器以[正确的 HTTP 标头](https://developer.mozilla.org/docs/Web/HTTP/CORS#The_HTTP_response_headers)做出响应，就不需要特殊处理。

## 跨域资源策略（CORP）

跨域资源策略（Cross-Origin-Resource-Policy，CORP），用于指定该资源可以被哪些来源加载的策略。

`Cross-Origin-Resource-Policy` 标头可采用以下三个可能的值：

```http
Cross-Origin-Resource-Policy: same-site
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Resource-Policy: cross-origin
```

- 标记为 `same-site` 的资源只能从同一站点加载
- 标记为 `same-origin` 的资源只能从同一源加载
- 标记为 `cross-origin` 的资源可被任何来源加载

## 跨域开放者策略（COOP）

在介绍这个标头之前，我们先来了解 `window.opener` 中存在的漏洞。

### window.opener 漏洞

当你的网站 A 使用 `window.open("https://B.com")` 打开一个新标签页 B 时，网站 A 的 JavaScript 会获得一个对新窗口 B 的引用。同时，新打开的窗口 B 可以通过 [`window.opener`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/opener) 属性回溯访问到打开它的窗口 A。

这种 `opener` 关系带来了安全风险，恶意页面可以通过 `window.opener` 直接访问父页面的上下文。例如，**Tabnabbing**（标签页劫持）就是恶意页面通过 `window.opener` 将原标签页的 URL 修改为钓鱼页面从而实现的攻击。

显然，`window.opener` 攻击本身是一种衍生的攻击方式。想要利用这种漏洞，攻击者必须先攻破受信任网站（如 XSS 攻击）之后才能够进行。

### COOP

跨域开放者策略（Cross-Origin-Opener-Policy，COOP），可以限制不同源的窗口对当前窗口的访问，防止它们通过 `window.opener` 属性直接访问父页面的上下文。开启了 COOP 的文档打开一个弹出式窗口，该窗口内的 `window.opener` 属性将为 `null`。

`Cross-Origin-Opener-Policy` 标头可采用以下三个可能的值：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Opener-Policy: unsafe-none
```

- 标记为 `same-origin` 的文档可以与同样标记为 `same-origin` 的同源窗口共享 `opener`
- 标记为 `same-origin-allow-popups` 表示允许与同源窗口共享 `opener`。这些弹出式窗口要么未设置 COOP，要么将 COOP 设置为 `unsafe-none` 选择不进行隔离
- `unsafe-none` 为默认值，表示允许与任何跨域窗口共享 `opener`，除非打开的文档本身的 COOP 为 `same-origin`

> **注意：** [`noopener`](https://developer.mozilla.org/docs/Web/API/Window/open#Window_features) 属性具有与 COOP 类似的效果，但它仅在 opener 端起作用。可以通过 `window.open(url, '_blank', 'noopener')` 或 `<a target="_blank" rel="noopener">`  来添加 `noopener`。
