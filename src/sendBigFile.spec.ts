import { of, empty, Observable, throwError } from 'rxjs';
import sendBigFile from './sendBigFile';
import FileUploadStat from './UploadFileStat';

function mockApis(
  ob1: Observable<boolean>,
  ob2: Observable<ProgressEvent>,
  ob3: Observable<string>,
) {
  const mockChunkExists = jest.fn().mockReturnValue(ob1);
  const mockSendChunk = jest.fn().mockReturnValue(ob2);
  const mockMergeChunks = jest.fn().mockReturnValue(ob3);

  const apis = {
    chunkExists: mockChunkExists,
    sendChunk: mockSendChunk,
    mergeChunks: mockMergeChunks,
  };

  return apis;
}

function testSendFileSuccess(
  file: File,
  expectFn: (apis: any, lastValue: FileUploadStat) => void,
  done: () => void,
) {
  const apis = mockApis(of(false), empty(), of('1'));

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expectFn(apis, lastValue);
      done();
    },
  );
}

it('上传单个分片', (done) => {
  const file = new File(['abc'], 'abc.txt');

  testSendFileSuccess(
    file,
    (apis, lastValue) => {
      expect(lastValue.fileId).toBe('1');
      expect(apis.sendChunk).toBeCalled();
      expect(apis.mergeChunks).toBeCalledWith(file, lastValue.chunks);
      expect(lastValue.success).toBe(true);
    },
    done,
  );
});

it('上传多个分片', (done) => {
  const file = new File(['abcdefg'], 'abc.txt');

  testSendFileSuccess(
    file,
    (apis, lastValue) => {
      expect(apis.sendChunk).toBeCalledTimes(3);
      expect(apis.mergeChunks).toBeCalledWith(file, lastValue.chunks);
      expect(lastValue.fileId).toBe('1');
      expect(lastValue.success).toBe(true);
      expect(lastValue.chunks.length).toBe(3);
    },
    done,
  );
});

it('分片已经上传过，不需要再上传', (done) => {
  const file = new File(['abc'], 'abc.txt');

  const apis = mockApis(of(true), empty(), of('1'));

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expect(apis.sendChunk).not.toBeCalled();
      expect(apis.mergeChunks).toBeCalledWith(file, lastValue.chunks);
      expect(lastValue.success).toBe(true);
      done();
    },
  );
});

it('验证分片已上传失败，则上传失败', (done) => {
  const file = new File(['abc'], 'abc.txt');

  const apis = mockApis(throwError('test'), empty(), of('1'));

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expect(apis.chunkExists).toBeCalledTimes(3); // 重试2次
      expect(apis.sendChunk).not.toBeCalled();
      expect(apis.mergeChunks).not.toBeCalled();
      expect(lastValue.success).toBe(false);
      expect(lastValue.completed).toBe(true);
      expect(lastValue.error).toBe(true);
      done();
    },
  );
});

it('上传分片失败，则文件上传失败', (done) => {
  const file = new File(['abc'], 'abc.txt');

  const apis = mockApis(of(false), throwError('test'), of('1'));

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expect(apis.sendChunk).toBeCalled();
      expect(apis.mergeChunks).not.toBeCalled();
      expect(lastValue.success).toBe(false);
      expect(lastValue.completed).toBe(true);
      expect(lastValue.error).toBe(true);
      done();
    },
  );
});

it('上传进度', (done) => {
  const file = new File(['abc'], 'abc.txt');

  const apis = mockApis(
    of(false),
    of(
      {
        loaded: 0,
        total: 100,
      } as any,
      {
        loaded: 100,
        total: 100,
      } as any,
    ),
    of('1'),
  );

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expect(lastValue.success).toBe(true);
      expect(lastValue.completed).toBe(true);
      expect(lastValue.loaded).toBe(3);
      done();
    },
  );
});

it('合并文件失败，则文件上传失败', (done) => {
  const file = new File(['abc'], 'abc.txt');

  const apis = mockApis(of(false), empty(), throwError('test'));

  let lastValue: FileUploadStat;
  sendBigFile(file, {
    concurrent: 10,
    chunkSize: 3,
    ...apis,
  }).subscribe(
    (value) => {
      lastValue = value;
    },
    undefined,
    () => {
      expect(lastValue.success).toBe(false);
      expect(lastValue.completed).toBe(true);
      expect(lastValue.error).toBe(true);
      done();
    },
  );
});
