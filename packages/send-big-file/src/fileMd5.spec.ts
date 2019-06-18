import fileMd5 from './fileMd5';

it('获取文件的md5', (done) => {
  const blob = new Blob(['abc']);
  const md5$ = fileMd5(blob);

  md5$.subscribe((md5) => {
    expect(md5).toBe('900150983cd24fb0d6963f7d28e17f72');
    done();
  });
});

it('md5失败', (done) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileMd5({} as any).subscribe(undefined, () => done(), undefined);
});
