import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import sendBigFile from "send-big-file";
import { Line } from "rc-progress";
// import "rc-progress/assets/index.css";

const UNITS = ["b", "kb", "mb", "gb"];

function FileSize({ size }: { size: number }) {
  let unit = 0;
  let result = size;
  while (result > 1024 && unit < UNITS.length) {
    unit += 1;
    result /= 1024;
  }
  return (
    <span>
      {result.toFixed(2)}
      {UNITS[unit]}
    </span>
  );
}

function App() {
  const [fileUploadStat, setFileUploadStat] = useState();
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    const file = acceptedFiles[0];
    if (file) {
      const subscription = sendBigFile(file).subscribe(event => {
        setFileUploadStat(event);
      });

      return () => subscription.unsubscribe();
    }
  }, [acceptedFiles]);

  return (
    <>
      <div {...getRootProps()}>
        <input type="file" {...getInputProps()} />
        上传
      </div>
      {fileUploadStat && (
        <div>
          <div>
            耗时：
            {(fileUploadStat.endTime - fileUploadStat.beginTime).toFixed(2)}ms
          </div>
          <div>
            已解析出md5的区块数目：
            {fileUploadStat.chunks.filter(Boolean).length}
          </div>
          <div style={{ width: 360 }}>
            MD5解析进度(
            {(fileUploadStat.chunks.filter(Boolean).length /
              Math.ceil(fileUploadStat.total / (2 * 1024 * 1024))) *
              100}
            %)
            <Line
              percent={
                (fileUploadStat.chunks.filter(Boolean).length /
                  Math.ceil(fileUploadStat.total / (2 * 1024 * 1024))) *
                100
              }
              strokeColor="#3FC7FA"
              strokeWidth={2}
            />
          </div>

          <div style={{ width: 360 }}>
            上传进度({(fileUploadStat.loaded / fileUploadStat.total) * 100}%)
            <Line
              percent={(fileUploadStat.loaded / fileUploadStat.total) * 100}
              strokeColor="#3FC7FA"
              strokeWidth={2}
            />
          </div>
          <div>
            上传状态：{fileUploadStat.completed ? "已结束上传" : "上传中"}
          </div>
          {fileUploadStat.completed && (
            <>
              <div>上传中有错误：{fileUploadStat.error ? "是" : "否"}</div>
              <div>上传成功: {fileUploadStat.success ? "是" : "否"}</div>
              {fileUploadStat.fileId && (
                <div>
                  fileID: {fileUploadStat.fileId}{" "}
                  <a
                    href={`http://localhost:5000/api/big-file/${
                      fileUploadStat.fileId
                    }`}
                    download
                  >
                    下载
                  </a>
                </div>
              )}
            </>
          )}
          <div>
            文件大小：
            <FileSize size={fileUploadStat.total} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
