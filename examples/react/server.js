/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const multipart = require("connect-multiparty");
const md5File = require("md5-file");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const concatFiles = require("concat-files");
const util = require("util");

const multipartMiddleware = multipart();

const PATH = "E:\\temp\\";
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 设置分块路径
const chunkPath = md5 =>
  path.join(PATH, md5.substr(0, 1), md5.substr(1, 2), md5.substr(4, 3), md5);
const getFileMd5 = filePath => {
  return new Promise((resolve, reject) => {
    md5File(filePath, (err, hash) => {
      if (err) {
        reject(err);
      } else resolve(hash);
    });
  });
};

// 校验分块的md5
const checkFileMd5 = async (filePath, md5) => {
  const fileMd5 = await getFileMd5(filePath);
  return fileMd5 === md5;
};

const md5 = content => {
  const fileMd5 = crypto.createHash("md5");
  return fileMd5.update(content).digest("hex");
};

/**
 * 合并分块
 * @param {*} filePath
 * @param {*} chunks
 */
const mergeFiles = async (filePath, chunks) => {
  await fs.ensureDir(path.dirname(filePath));
  await util.promisify(concatFiles)(chunks, filePath);
};

// 校验分块是否存在
app.get("/api/big-file/chunk/:chunkMd5/status", async (req, res) => {
  const exists = await fs.pathExists(chunkPath(req.params.chunkMd5));
  res.json({
    exists
  });
});

// 上传分块
app.post(
  "/api/big-file/chunk/:chunkMd5",
  multipartMiddleware,
  async (req, res) => {
    const { file } = req.files;
    const filePath = chunkPath(req.params.chunkMd5);
    try {
      const exists = await fs.exists(filePath);
      if (exists) {
        res.status(200).end();
        return;
      }
      await fs.ensureDir(PATH);
      const isChecked = await checkFileMd5(file.path, req.params.chunkMd5);
      if (isChecked) {
        await fs.move(file.path, filePath);
        res.status(200).end();
      } else {
        res.status(400).end();
      }
    } catch (e) {
      res.status(500).end();
    }
  }
);

// 分块合并
app.post("/api/big-file/merge", async (req, res) => {
  const chunks = req.body;
  const fileMd5 = md5(chunks.join(""));
  const filePath = chunkPath(fileMd5);
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    await mergeFiles(filePath, chunks.map(chunkPath));
  }
  res.json({
    fileId: fileMd5
  });
});

app.get("/api/big-file/:fileId", (req, res) => {
  res.sendFile(chunkPath(req.params.fileId));
});

const server = app.listen(5000, () => {
  const { address: host, port } = server.address();

  // tslint:disable-next-line:no-console
  console.log(
    "newoa-api-mock-server app listening as http://%s:%s",
    host,
    port
  );
});
