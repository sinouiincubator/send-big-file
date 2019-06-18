/**
 * 文件上传状态
 */
export default interface FileUploadStat {
  /**
   * 文件id
   */
  fileId?: string;
  /**
   * 是否结束完成
   */
  completed: boolean;

  /**
   * 总大小
   */
  total: number;

  /**
   * 已上传大小
   */
  loaded: number;

  /**
   * 所有准备好MD5的分片
   */
  chunks: string[];

  /**
   * 上传失败。
   *
   * @type {boolean}
   * @memberof FileUploadStat
   */
  error: boolean;

  /**
   * 开始时间
   *
   * @type {number}
   * @memberof FileUploadStat
   */
  beginTime: number;

  /**
   * 结束时间
   *
   * @type {number}
   * @memberof FileUploadStat
   */
  endTime?: number;

  /**
   * 是否上传成功
   *
   * @type {boolean}
   * @memberof FileUploadStat
   */
  success: boolean;
}
