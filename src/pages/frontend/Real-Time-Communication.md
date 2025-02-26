---
title: 几种实时通信方案
date: 2024/12/1
type: frontend
meta:
  - name: description
    content: 介绍了几种实时通信方案，包括长轮询、WebSocket、服务器推送事件（SSE）和 WebTransport 
---

[[toc]]

对于实时的 Web 应用，将数据**主动**从服务端发送给客户端的需求是普遍存在的。在过去，**长轮询**（Long-Polling）是唯一可用的方案。后来 [WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket) 取代了长轮询的方式（现在还有一些业务场景还会使用长轮询，例如扫码），它为实时双向通信提供了更强大的解决方案。继 WebSocket 之后，当今流行的 GPT Web 应用中广泛用到的[服务端推送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events)（Server-Sent-Events）为从服务器到客户端的单向通信提供了一种更简单的方法。未来，随着 HTTP3.0 协议的规范化，[WebTransport](https://developer.mozilla.org/zh-CN/docs/Web/API/WebTransport) 有望通过提供更高效、更灵活和可扩展的方法来实现 Web 端的实时通信。

## 长轮询

在这种模式下，客户端向服务器发送请求，服务器如果没有新的数据可供返回，不会立刻响应一个空结果，而是会<u>保持这个请求处于等待（挂起）状态</u>，直到有新的数据产生或者等待一定的超时时间。

与传统轮询（短轮询）不同，在传统轮询中，客户端定期重复向服务器发送请求，询问服务器是否有新的数据。不管服务器有没有新数据，都会立即响应。这种方式会导致大量的无效请求，特别是在数据更新不频繁的情况下，会浪费网络带宽和服务器资源。

长轮询提供了更高效的数据更新，并减少不必要的网络流量和服务器负载。但是它仍然在通信中存在延迟，且长轮询本质上就是一个普通的 AJAX 请求，效率远低于后来的 WebSocket 等其他实时技术。

## WebSocket

**WebSocket** 是一种在单个 TCP 连接上进行**全双工通信**的协议。它使得客户端和服务器之间的数据交换变得更加简单和高效，允许服务器主动向客户端推送数据。这项技术使浏览器和服务器能够在<u>无需承受 HTTP 请求 - 响应周期开销</u>的情况下交换数据。

```js
// 创建一个 WebSocket 连接
const socket = new WebSocket("ws://localhost:8080");

// 监听连接建立事件
socket.addEventListener("open", function (event) {
  // 向服务端发送数据
  socket.send("Hello Server!");
});

// 监听消息传递事件
socket.addEventListener("message", function (event) {
  console.log("Message from server ", event.data);
});

// 关闭连接
socket.close()

```

虽然 WebSocket 易于使用，但在生产环境中却相当复杂。Socket 很可能会失去连接，导致必须重新建立连接。其次，检测连接是否仍然可用可能会非常棘手。在大多数情况下，我们可以添加 [ping-and-pong](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#pings_and_pongs_the_heartbeat_of_websockets) 心跳机制来检测连接，以确保打开的连接不会关闭。大多数项目还会使用如 [WebSockets Socket.IO](https://socket.io/zh-CN/) 这样的 ws 库来处理这些麻烦情况，甚至在必要时采用长轮询作兜底。

## 服务端推送事件

**服务器推送事件**（SSE）是一种轻量级的、基于 HTTP 协议的服务端推送技术，能够使服务器主动向客户端发送数据更新，而不需要客户端频繁地发起请求来检查更新。

与 WebSocket 不同，SSE 专为<u>从服务端到客户端的**单向**通信</u>而设计。数据消息只能从服务端到发送到客户端，这使得 SSE 成为不需要从客户端往服务器发送消息的情况下的最佳方案。

你可以将 SSE 视为一个 HTTP 请求。当客户端向服务器请求开启 SSE 连接后，服务器会保持这个连接打开的状态。服务器通过这个连接，以文本格式（UTF-8 编码）发送事件流。

### 客户端建立连接

使用 SSE 创建用于接收事件的连接非常简单。在客户端中，使用创建事件的服务器端脚本的 URL 来初始化 EventSource 实例。

客户端通过监听事件来接收服务端推送的数据。事件分为通用消息（`message`）事件和命名事件，从而允许进行更结构化的通信。如果服务器发送的消息中没有 [`event`](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#event) 字段，则这些消息会被视为 `message` 事件。如果服务器发送的消息中定义了 `event` 字段，就会以 `event` 中给定的名称作为事件接收。

```js
// 连接 SSE
const evtSource = new EventSource("https://example.com/events");

// 监听通用消息事件
evtSource.onmessage = event => {
    console.log('got message: ' + event.data);
};

// 监听命名事件 ping
evtSource.addEventListener("ping", (event) => {
  const newElement = document.createElement("li");
  const eventList = document.getElementById("list");
  const time = JSON.parse(event.data).time;
  newElement.textContent = `ping at ${time}`;
  eventList.appendChild(newElement);
});
```

与 WebSocket 不同，EventSource 在连接丢失时会**自动重新连接**。

### 服务端发送数据

推送事件的服务端脚本需要使用 `text/event-stream` MIME 类型响应内容。事件流中的消息由**一对换行符**（`\n\n`）分割，以冒号开头的行视为**注释行**，会被忽略。每条消息由一行或多行文字组成，列出该消息的字段，每个字段由形式如 `字段名: 值` 来表示。

> 注释行可以用来防止连接超时，服务器可以定期发送一条消息注释行，以保持连接不断。

可使用的字段包含：

- `event`：一个用于标识事件类型的字符串。
- `data`：消息的数据字段。其值可以是任何字符串数据，例如 `JSON` 字符串。
- `id`：事件 ID。
- `retry`：重新连接的时间。如果与服务器的连接丢失，浏览器将等待指定的时间，然后尝试重新连接。这必须是一个整数，以毫秒为单位指定重新连接的时间。如果指定了一个非整数值，该字段将被忽略。

所有其他的字段名都会被忽略。如果一行文本中不包含冒号，则整行文本会被解析成为字段名，其字段值为空。

```js
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/events', (req, res) => {
    // 设置 Content-Type 为 text/event-stream
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendEvent = (data) => {
        // 发送消息
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        res.write(formattedData);
    };

    // 每两秒发送一次
    const intervalId = setInterval(() => {
        const message = {
            time: new Date().toTimeString(),
            message: 'Hello from the server!',
        };
        sendEvent(message);
    }, 2000);

    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

## WebTransport 

WebTransport 基于 HTTP3.0 协议来启用各种数据传输功能，例如以可靠和不可靠的方式通过多个流发送数据，甚至允许不按顺序发送数据。目的是满足现代 Web 应用对于实时性和高性能数据传输的需求，比如云游戏、实时视频会议等复杂场景。

但是，需要注意的是，WebTransport 目前还是一个工作草案。 截至目前（2024 年 11 月），WebTransport 处于[工作草案](https://w3c.github.io/webtransport/)中，尚未得到广泛支持。即使 WebTransport 得到广泛支持，它的 API 使用起来也非常复杂，在一些高实时性需求的场景下可能才会采用该方案。