const fs = require('fs')
const path = require('path')

/**
 * 创建文件夹并创建文件
 */
function writeFileSync(file, content) {
  let _path = file.split('/')
  _path.pop()
  _path = _path.join('/')
  mkdirsSync(_path)
  content = typeof content === 'object' ? JSON.stringify(content, null ,2) : content
  return fs.writeFileSync(file, content)
}

/**
 * 递归创建文件夹
 * @param dirname
 * @returns {boolean}
 */
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

function readFileListSync(entry, data, filter) {
  const list = fs.readdirSync(entry)
  list.forEach((dir) => {
    dir = path.resolve(entry, dir)
    const isDir = fs.statSync(dir).isDirectory()
    if (isDir) {
      readFileListSync(dir, data, filter)
      return
    }
    if (filter && !filter(dir)) {
      return
    }
    data.push(dir)
  })
}

module.exports = {
  readFileListSync,
  writeFileSync,
  mkdirsSync,
}
