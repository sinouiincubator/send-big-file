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

    默认实现：

    ```js
    /**
     * 判断分片是否已经上传
     *
     * @param md5 分片md5
     */
    function chunkExists(md5: string): Observable<boolean> {
      return from(
        http.get < { exists: boolean } > `${url}/chunk/${md5}/status`,
      ).pipe(map((result) => result.exists));
    }
    ```

    上述示例中：

    - 默认接收一个 md5 参数，表示分片的 md5 值
    - 函数必须返回一个[Observable](https://rxjs.dev/guide/observable)形式的布尔值

  - `sendChunk` 上传分片的方法

    默认实现：

    ```typescript
    /**
     * 上传分片
     * @param file 整个文件
     * @param md5 文件的md5
     */
    function sendChunk(file: Blob, md5: string) {
      return new Observable<ProgressEvent>((observer) => {
        sendFile(`${url}/chunk/${md5}`, file as File, 'file', {
          onUploadProgress: (event) => observer.next(event),
        })
          .then(() => {
            observer.complete();
          })
          .catch((error) => {
            observer.error(error);
          });
      });
    }
    ```

    上述示例中：

    - 接收两个参数，其中`file`表示分片文件，`md5`表示分片文件对应的 md5
    - 返回一个 promise

  - `mergeChunks` 合并分片的方法

    默认实现：

    ```typescript
    /**
     * 合并分片，形成文件
     *
     * @param {string[]} chunks
     * @returns {Observable<string>}
     */
    function mergeChunks(_file: File, chunks: string[]): Observable<string> {
      return new Observable<string>((observer) => {
        http.post<{ fileId: string }>(`${baseUrl}/merge`, chunks).then(
          (result) => {
            observer.next(result.fileId);
            observer.complete();
          },
          (error) => observer.error(error),
        );
      });
    }
    ```

    上述示例：

    - 接收两个参数，`file`表示整个文件，`chunks`表示文件分片
    - 返回一个字符串，表示文件 id

## 特性

- 支持分片并发上传
- 失败自动重试
- 断点续传
