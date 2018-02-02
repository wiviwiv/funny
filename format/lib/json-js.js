/**
 * 将 JSON 转换为 js 代码
 * 配合 WebStorm eslint 可以很好的格式化为项目规范
 */
const jsjson = require('js-json')

function init(data = {}) {
  const json = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  console.log(jsjson.parse(json))
  return jsjson.parse(json)
}

module.exports = init