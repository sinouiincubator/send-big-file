import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import http from '@sinoui/http';
import sendFile from '@sinoui/http-send-file';

/**
 * 创建默认的APIs
 *
 * @param baseUrl 基础url
 */
export default function createDeafultApis(baseUrl: string) {
  /**
   * 判断分片是否已经上传
   *
   * @param md5 分片md5
   */
  function chunkExists(md5: string): Observable<boolean> {
    return from(
      http.get<{ exists: boolean }>(`${baseUrl}/chunk/${md5}/status`),
    ).pipe(map((result) => result.exists));
  }

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

  /**
   * 上传分片
   * @param file 整个文件
   * @param md5 文件的md5
   */
  function sendChunk(file: Blob, md5: string) {
    return new Observable<ProgressEvent>((observer) => {
      sendFile(`${baseUrl}/chunk/${md5}`, file as File, 'file', {
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

  return {
    chunkExists,
    sendChunk,
    mergeChunks,
  };
}
