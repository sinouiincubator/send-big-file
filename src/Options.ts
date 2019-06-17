import { Observable } from 'rxjs';

export default interface Options {
  /**
   * 并发数目。默认为10。
   */
  concurrent: number;
  /**
   * 分片大小，以b为单位。默认为2MB。
   */
  chunkSize: number;
  /**
   * 检查分片是否已经上传
   * @param chunkMd5 分片的md5
   */
  chunkExists(chunkMd5: string): Observable<boolean>;

  /**
   * 上传分片
   *
   * @param chunk 分片内容
   * @param chunkMd5 分片的md5
   */
  sendChunk(chunk: Blob, chunkMd5: string): Observable<ProgressEvent>;

  /**
   * 合并文件
   *
   * @param file 文件
   * @param chunks 文件所有分片的md5
   *
   * @returns 返回包含fileId的可观察对象
   */
  mergeChunks(file: File, chunks: string[]): Observable<string>;
}
