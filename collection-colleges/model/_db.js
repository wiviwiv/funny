/* Created by wivwiv on 2018/1/2 13:00 */
const mongoose = require('mongoose')

const db = mongoose.createConnection('mongodb://127.0.0.1/book')

db.on('open', err => {
  console.log(err || '连接成功')
})

db.on('error', err => {
  console.log(err || '连接失败')
})

const ObjectId = mongoose.Schema.Types.ObjectId

const Schema = mongoose.Schema
module.exports = {
  mongoose,
  ObjectId,
  db,
  Schema,
}
