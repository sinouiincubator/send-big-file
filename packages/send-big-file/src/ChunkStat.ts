/**
 * 分片状态
 */
export default interface ChunkStat {
  /**
   * 是否完成上传
   */
  completed: boolean;
  /**
   * 分片索引位置
   */
  index: number;
  /**
   * 是否已经上传过
   */
  exists: boolean;
  /**
   * 分片大小
   */
  total: number;
  /**
   * 已经上传的大小
   */
  loaded: number;
  /**
   * 文件md5指纹
   */
  md5: string;
  /**
   * 是否出错
   *
   * @type {boolean}
   * @memberof ChunkStat
   */
  error?: boolean;
}
