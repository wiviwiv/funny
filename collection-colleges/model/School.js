/* Created by wivwiv on 2018/1/2 14:00 */
const { Schema, ObjectId, db } = require('./_db')

const SchoolSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
    check: [2, 32],
    remark: '学校名字',
  },
  code: {
    type: Number,
    remark: '学校编码',
  },
  level: {
    type: String,
    default: '本科',
    check: 'level',
    remark: '办学级别',
  },
  province: {
    type: String,
    index: true,
    check: [1, 20],
    default: '暂无',
    remark: '所在省份',
  },
  city: {
    type: String,
    index: true,
    check: [1, 20],
    default: '暂无',
    remark: '所在城市',
  },
  belong: {
    type: String,
    default: '教育局',
    remark: '主管单位',
  },
  leader: {
    type: ObjectId,
    ref: 'admin',
    remark: '负责人',
  },
  address: {
    type: String,
    remark: '学校地址',
  },
  desc: {
    type: String,
    check: [10, 100],
    remark: '学校描述',
  },
  tag: {
    type: [String],
    remark: '学校标签',
  },
}, {
  collection: 'school',
  timestamps: true,
})

module.exports = db.model('school', SchoolSchema)
