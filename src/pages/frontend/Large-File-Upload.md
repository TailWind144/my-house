---
title: 大文件上传
date: 2024/9/27
type: frontend
meta:
  - name: description
    content: 介绍了前端中如何进行大文件上传，包括切片上传、断点续传
---

[[toc]]

## 主要方法

大文件上传的主要方法就是通过将大文件切片，分片进行上传。具体地就是通过 `Blob.prototype.slice` 方法，该方法可以返回源文件的某个切片。

预先定义好单个切片大小，将文件切分为一个个切片，同时上传多个切片。这样从原本传一个大文件，变成了并发传多个小的文件切片，主要是可以解决<u>**上传失败**</u>或<u>**暂停上传时需要整个文件重新上传**</u>的问题。

> 注意：分片上传并不一定可以提高上传速度。上传速度主要还是受网络带宽影响，上行带宽有限，分片未必能提高上传效率，即使分片上传也无法充分利用多个分片的优势，上传速度可能不会有明显提升。

对于大文件切片上传需要关注两个问题，<u>一个就是如何切片上传，另一个就是暂停上传时如何重新上传</u>。

整个代码基于 `Vue2.js`。

## 切片上传

### 计算文件 Hash 值

为了标识上传的文件以及文件不同的分片，需要计算文件的 Hash 值。对于 Hash 值的计算可以交给 **Web Worker** 去执行。

这里通过第三方库 `spark-md5` 来实现：

```js
// /public/hash.js

// 导入 spark-md5
self.importScripts("/spark-md5.min.js");

// 生成文件 hash
self.onmessage = e => {
    const { fileChunkList } = e.data;
    const spark = new self.SparkMD5.ArrayBuffer();
    let percentage = 0;
    let count = 0;
    const loadNext = index => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(fileChunkList[index].file);
        reader.onload = e => {
            count++;
            spark.append(e.target.result);
            if (count === fileChunkList.length) {
                self.postMessage({
                    percentage: 100,
                    hash: spark.end()
                });
                self.close();
            } else {
                percentage += 100 / fileChunkList.length;
                self.postMessage({
                    percentage
                });
                // calculate recursively
                loadNext(count);
            }
        };
    };
    loadNext(0);
};
```

在 worker 线程中，接受文件切片 `fileChunkList`，利用 `FileReader` 读取每个切片的 `ArrayBuffer` 并不断传入 `spark-md5` 中，每计算完一个切片通过 `postMessage` 向主线程发送一个进度事件，全部完成后将最终的 Hash 发送给主线程。

为了描述方便，每个切片的标识则由**文件的Hash+切片下标**组成。

> 为什么不直接对整个文件计算 Hash 呢？主要原因在于为了避免**处理大文件内存溢出**以及**可能的 Hash 碰撞**的情况，所以分块进行计算。当然也有其他计算大文件 Hash 的方法，这里为简单起见，直接进行分块计算。

接着是主线程与 worker 线程通讯的逻辑：

```js
calculateHash(fileChunkList) {
    return new Promise(resolve => {
        // 添加 worker 属性
        this.container.worker = new Worker("/hash.js");
        this.container.worker.postMessage({ fileChunkList });
        this.container.worker.onmessage = e => {
            const { percentage, hash } = e.data;
            this.hashPercentage = percentage;
            if (hash) {
                resolve(hash);
            }
        };
    });
},
```

主线程使用 `postMessage` 给 worker 线程传入所有切片 fileChunkList，并监听 worker 线程发出的 postMessage 事件拿到文件 Hash。

### 分片

要实现分片上传其实就是两件事情：（1）对文件切片；（2）将切片传输给服务端。

```js
<script>
// 切片大小
const SIZE = 10 * 1024 * 1024; 

export default {
    data: () => ({
        container: {
            file: null
        }，
        data: []
	}),
    methods: {
        // 生成文件切片
        createFileChunk(file, size = SIZE) {
            const fileChunkList = [];
            let cur = 0;
            while (cur < file.size) {
                fileChunkList.push({ file: file.slice(cur, cur + size) });
                cur += size;
            }
            return fileChunkList;
        },
         // 上传切片
         async uploadChunks() {
             const requestList = this.data
             .map(({ chunk，hash }) => {
                 const formData = new FormData();
                 formData.append("chunk", chunk);
                 formData.append("hash", hash);
                 formData.append("filename", this.container.file.name);
                 return { formData };
             })
             .map(({ formData }) =>
                  this.request({
                     url: "http://localhost:3000",
                     data: formData
             	  })
             );
             // 等待所有分片上传完成
             await Promise.all(requestList); 
             // 发起合并分片请求
             await this.mergeRequest();
         },
         async handleUpload() {
             if (!this.container.file) return;
             const fileChunkList = this.createFileChunk(this.container.file);
             this.container.hash = await this.calculateHash(fileChunkList);
             this.data = fileChunkList.map(({ file }，index) => ({
                 fileHash: this.container.hash,
                 chunk: file,
                 // 文件 Hash + 数组下标
                 hash: this.container.hash + "-" + index,
                 percentage:0
             }));
             await this.uploadChunks();
         }
    }
};
</script>
```

`handleUpload` 为上传的事件函数。

1. 通过 `createFileChunk` 函数来将文件进行切片，这里设置每个切片大小为 10 MB。在函数中，通过循环将执行 `slice` 方法得到的每个切片存入数组 `fileChunkList` 当中。
2. 切片完成后，需要计算文件的 Hash 值，通过调用之前实现的函数 `calculateHash` 来进行计算。
3. 计算完 Hash 后，调用 `uploadChunks` 函数进行分片上传操作，将每个切片存入 `FormData` 对象中，随后向服务端发起请求进行分片上传。

那么如何通知服务端所有分片上传完成呢？可以发起一个合并请求来告诉服务端所有分片上传完毕，以通知服务端进行分片的合并。

```js
async mergeRequest() {
    await this.request({
        url: "http://localhost:3000/merge",
        headers: {
            "content-type": "application/json"
        },
        data: JSON.stringify({
            filename: this.container.file.name
        })
    });
},
```

## 断点续传

### 文件秒传

文件秒传，即服务端上已经存在了用户上传的资源文件，当用户再次上传时便无需重新上传资源直接提示用户上传成功。

要判断用户是否已经上传过该文件只需要比对资源的 Hash 即可，如果能在服务端找到相同的 Hash 资源，则直接返回上传成功的信息。

```js
async verifyUpload(filename, fileHash) {
    const { data } = await this.request({
        url: "http://localhost:3000/verify",
        headers: {
            "content-type": "application/json"
        },
        data: JSON.stringify({
            filename,
            fileHash
        })
    });
    return JSON.parse(data);
},
```

```js
async handleUpload() {
    if (!this.container.file) return;
    const fileChunkList = this.createFileChunk(this.container.file);
    this.container.hash = await this.calculateHash(fileChunkList);
    const { shouldUpload } = await this.verifyUpload(	// [!code ++]
        this.container.file.name,	// [!code ++]
        this.container.hash	// [!code ++]
    );	// [!code ++]
    if (!shouldUpload) {	// [!code ++]
        this.$message.success("skip upload：file upload success");	// [!code ++]
        return;	// [!code ++]
    }	// [!code ++]
    this.data = fileChunkList.map(({ file }，index) => ({
        fileHash: this.container.hash,
        chunk: file,
        // 文件 Hash + 数组下标
        hash: this.container.hash + "-" + index,
        percentage:0
    }));
    await this.uploadChunks();
}
```

### 暂停上传

要实现暂停请求，很简单直接通过 XHR 对象的 `abort` 方法就可以取消一个 XHR 请求。

要实现这一点，需要把所有上传请求的 XHR 对象暂存起来，对 `request` 函数进行修改得到：

```js
request({
    url,
    method = "post",
    data,
    headers = {},
        onProgress = e => e,
        requestList
        }) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = onProgress;
        xhr.open(method, url);
        Object.keys(headers).forEach(key =>xhr.setRequestHeader(key, headers[key]));
        xhr.send(data);
        xhr.onload = e => {
            // 将请求成功的 xhr 从列表中删除
            if (requestList) {
                const xhrIndex = requestList.findIndex(item => item === xhr);
                requestList.splice(xhrIndex, 1);
            }
            resolve({
                data: e.target.response
            });
        };
        // 暴露当前 xhr 给外部
        requestList?.push(xhr);
    });
},
```

这样在上传切片时传入 `requestList` 数组作为参数，`request` 函数就会将所有的 XHR 对象保存在该数组中了。每当一个切片上传成功时，将对应的 XHR 对象从 `requestList` 中删除，所以 `requestList` 中只保存正在上传切片的 XHR 对象。

对于暂停的事件回调函数，直接调用每个 XHR 对象 `abort` 方法并清空 `requestList` 数组。

```js
handlePause() {
    this.requestList.forEach(xhr => xhr?.abort());
    this.requestList = [];
},
```

### 恢复上传

要恢复上传，需要向服务端询问当前已上传切片的 Hash，后续上传时前端只需要跳过这些已上传的切片即可。

这里实现把验证接口与之前的秒传逻辑合并，通过调用 `verifyUpload` 函数来获取已上传的切片。

```js
async handleResume() {
    const { uploadedList } = await this.verifyUpload(
        this.container.file.name,
        this.container.hash
    );
    await this.uploadChunks(uploadedList);
},
```

给原来验证是否上传的接口返回一个新参数 `uploadedList` ，即服务端返回的切片 Hash 列表。

现更新上传事件函数 `handleUpload` 和切片上传函数 `uploadChunks` ：

```js
async handleUpload() {
    if (!this.container.file) return;
    const fileChunkList = this.createFileChunk(this.container.file);
    this.container.hash = await this.calculateHash(fileChunkList);
    const { shouldUpload, uploadedList } = await this.verifyUpload(// [!code ++]
        this.container.file.name,
        this.container.hash
    );
    if (!shouldUpload) {
        this.$message.success("skip upload：file upload success");
        return;
    }
    this.data = fileChunkList.map(({ file }, index) => ({
        fileHash: this.container.hash,
        chunk: file,
        // 文件 Hash + 数组下标
        hash: this.container.hash + "-" + index,
        percentage:0
    }));
    await this.uploadChunks(uploadedList);// [!code ++]
},
```

```js
async uploadChunks(uploadedList = []) {	// [!code ++]
    const requestList = this.data
    .filter(({ hash }) => !uploadedList.includes(hash))	// [!code ++]
    .map(({ chunk，hash }) => {
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("hash", hash);
        formData.append("filename", this.container.file.name);
        return { formData };
    })
    .map(({ formData }) =>
         this.request({
        url: "http://localhost:3000",
        data: formData
    })
        );
    // 等待所有分片上传完成
    await Promise.all(requestList); 
    // 发起合并分片请求
    // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量 时合并切片	// [!code ++]
    if (uploadedList.length + requestList.length === this.data.length) {	// [!code ++]
        await this.mergeRequest();
    }	// [!code ++]
},
```

通过 `filter` 方法来过滤掉已上传的切片。由于新增了当前已上传的部分，所以执行合并接口时需要满足一定的条件。

至此大文件分片上传的大体逻辑基本完成，当然功能上还需要进一步完善，例如切片上传失败如何处理等。

## 参考资料

https://juejin.cn/post/6844904046436843527