import { Observable, of, range, pipe } from 'rxjs';
import {
  tap,
  mergeMap,
  map,
  catchError,
  retry,
  scan,
  startWith,
} from 'rxjs/operators';
import FileUploadStat from './UploadFileStat';
import Options from './Options';
import createDeafultApis from './defaultApis';
import ChunkStat from './ChunkStat';
import fileMd5 from './fileMd5';
import endMap from './endMap';

const defaultApis = createDeafultApis('/api/big-file');
const CHUNK_UNIT_SIZE = 2 * 1024 * 1024; // 默认的分片大小, 2MB

/**
 * 分片发送大文件
 *
 * @param file 需要发送的文件
 */
function sendBigFile(
  file: File,
  options: Options = {
    concurrent: 10,
    chunkSize: CHUNK_UNIT_SIZE,
    ...defaultApis,
  },
): Observable<FileUploadStat> {
  const chunkCount = Math.ceil(file.size / options.chunkSize);
  const chunks: string[] = [];
  const beginTime = performance.now();

  /**
   * 获取分片状态
   * @param chunkIndex 分片索引
   */
  const getChunkStat = (chunkIndex: number): Observable<ChunkStat> => {
    const chunk = file.slice(
      chunkIndex * options.chunkSize,
      (chunkIndex + 1) * options.chunkSize,
    );
    const makeChunkStat = (exists: boolean, error: boolean = false) => ({
      completed: exists,
      exists,
      index: chunkIndex,
      md5: chunks[chunkIndex],
      total: chunk.size,
      loaded: exists ? chunk.size : 0,
      error,
    });

    return fileMd5(chunk).pipe(
      tap((md5) => {
        chunks[chunkIndex] = md5;
      }),
      mergeMap(options.chunkExists),
      retry(2),
      map((exists) => makeChunkStat(exists)),
      catchError(() => of(makeChunkStat(false, true))),
    );
  };

  /**
   *  上传分片
   *
   * @param chunkStat 分片状态
   */
  const uploadChunk = (chunkStat: ChunkStat) => {
    if (chunkStat.exists || chunkStat.error) {
      return of(chunkStat);
    }
    const chunk = file.slice(
      chunkStat.index * options.chunkSize,
      (chunkStat.index + 1) * options.chunkSize,
    );
    let loaded = 0;
    const getLoaded = (e: ProgressEvent) => Math.min(chunk.size, e.loaded);
    return options.sendChunk(chunk, chunkStat.md5).pipe(
      retry(2),
      tap((progressEvent) => {
        loaded = getLoaded(progressEvent);
      }),
      map((progressEvent) => ({
        ...chunkStat,
        loaded: getLoaded(progressEvent),
      })),
      catchError(() => of({ ...chunkStat, loaded, error: true })),
    );
  };

  /**
   * 分片发送文件内容
   */
  const sendChunks$: Observable<FileUploadStat> = range(0, chunkCount).pipe(
    mergeMap(getChunkStat, options.concurrent),
    mergeMap(uploadChunk, options.concurrent),
    scan(
      (acc, chunkStat) => {
        acc[chunkStat.index] = chunkStat;
        return acc;
      },
      [] as ChunkStat[],
    ),
    map((chunkStats) => {
      const loaded = chunkStats.reduce(
        (acc, chunkStat) => acc + (chunkStat.error ? 0 : chunkStat.loaded),
        0,
      );
      const error = chunkStats.some((chunk) => chunk.error);
      return {
        completed: false,
        total: file.size,
        loaded,
        chunks,
        error,
        beginTime,
        success: false,
        endTime: performance.now(),
      };
    }),
  );

  /**
   * 合并分片形成文件
   */
  const mergeFile = pipe(
    endMap((fileUploadStat: FileUploadStat) => {
      if (fileUploadStat.error) {
        return of({
          ...fileUploadStat,
          completed: true,
        });
      }

      return options.mergeChunks(file, chunks).pipe(
        map((fileId) => ({
          ...fileUploadStat,
          fileId,
          completed: true,
          success: true,
        })),
        catchError(() =>
          of({
            ...fileUploadStat,
            error: true,
            completed: true,
            success: false,
          }),
        ),
      );
    }),
  );

  return sendChunks$.pipe(
    startWith({
      completed: false,
      total: file.size,
      loaded: 0,
      chunks,
      error: false,
      beginTime,
      success: false,
      endTime: beginTime,
    }),
    mergeFile,
  );
}

export default sendBigFile;
