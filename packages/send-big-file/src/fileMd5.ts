import BMF from 'browser-md5-file';
import { Observable } from 'rxjs';

/**
 * 获取文件的md5值
 *
 * @param file 文件
 */
function fileMd5(file: Blob) {
  return new Observable<string>((subscriber) => {
    const bmf = new BMF();

    bmf.md5(file, (err: Error, md5: string) => {
      if (err) {
        subscriber.error(err);
      } else {
        subscriber.next(md5);
        subscriber.complete();
      }
    });
  });
}

export default fileMd5;
