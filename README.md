# send-big-file

分片发送大文件。

## 快速安装

```shell
yarn add send-big-file
```

或者

```shell
npm i --save send-big-file
```

## 快速使用

```typescript
import sendBigFile, { UploadFileStat } from 'send-big-file';

// 定义文件
const file: File = ...;
// 上传状态
const uploadFileStat: UploadFileStat | undefined;
sendBigFile(file).subscribe(
  (stat) => {
    uploadFileStat = stat;
    console.log(`上传进度: ${((stat.loaded / stat.total) * 100).toFixed(2)}%`);
  },
  (error) => {
    console.log('上传失败');
  },
  () => {
    console.log(uploadFileStat.success ? '上传成功' : '上传失败');
  },
);
```

## 参数说明

- `file` 要上传的文件
- `options` 上传配置，主要包括：

  - `concurrent` 并发数目，默认为 10
  - `chunkSize` 分片大小，以 b 为单位，默认为 2MB
  - `chunkExists` 检查分片是否已经上传的方法
  - `sendChunk` 上传分片的方法
  - `mergeChunks` 合并分片的方法

## 特性

- 支持分片并发上传
- 失败自动重试
- 断点续传
