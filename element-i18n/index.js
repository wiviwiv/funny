const fs = require('fs')
const path = require('path')

const { mkdirsSync, writeFileSync, readFileListSync } = require('./lib/file')
const { log } = require('./lib/util')
const json2Js = require('./lib/json-js')

// /Users/emqtt/workspace/actorcloud/src/apps/devices/views/Devices.vue
const cursor = {
  // 是否在 script 标签中
  script: false,
  // 是否有未匹配的 prop
  prop: false,
  inBody: false,
  both: false,
  start: false,
  end: false,
  bodyIndex: 0,
}
// 连续中文
const zhReg = /[\u4e00-\u9fa5，：]+/g
// prop 的 值做 key
const propReg = /\bprop="([a-zA-Z]+)"/g
// deviceDetails => device Details
const descReg = /([A-Z](?=[a-z]))/g
// deviceDetails => DeviceDetails
const titleCase = /\b[a-z]/g

function state(row) {
  if (!row) {
    return
  }
  cursor.both = false
  cursor.inBody = false

  if (row.includes('<script>')) cursor.script = true
  if (cursor.script) return

  const [tableStart, tableEnd, formStart, formEnd] = [
    row.includes('<el-table-column'),
    row.includes('</el-table-column>'),
    row.includes('<el-form-item'),
    row.includes('</el-form-item>'),
  ]

  cursor.both = (tableStart && tableEnd) || (formStart && formEnd)
  if (cursor.both) {
    cursor.inBody = true
    return
  }
  // 有开头 看结尾
  cursor.start = cursor.start ? !(tableEnd || formEnd) : (tableStart || formStart)
  // 新的开头 新的 body
  if (cursor.start) {
    cursor.bodyIndex += 1
  }
  // 有结尾 看开头
  cursor.end = cursor.end ? !(tableStart || formStart) : (tableEnd || formEnd)
  // 销毁 prop
  if (cursor.end) cursor.prop = false
  cursor.inBody = cursor.start && !cursor.end
}

function loadRows(file, dbPath = './db/migrate') {
  const migrate = {
    // 文件路径
    file: path.resolve(file),
    // 文件名
    fileName: file.split('/').pop(),
    // 前缀 $t('namespace.key')
    namespace: file.split('/').pop().split('.')[0].replace(/[A-Z]/, $ => $.toLowerCase()),
    // 有效行, 行号索引
    rows: {
      // 0: {
      //   /**
      //    * 附近行有 prop 等就取其值为 key, 否则以汉字本身为 key
      //    * 多语言翻译 key 必须为修正后的 key
      //    */
      //   key: '',
      //   // 提取到的汉字值
      //   value: '',
      //   // 该行替换的RegExp
      //   template: '',
      //   script: false,
      // },
    },
    key: {},
  }
  migrate.zhCode = {}
  migrate.enCode = {}
  let inScript = false
  const dict = require('./db/dict/reset_all')
  const code = fs.readFileSync(file)
                 .toString()
                 .split('\n')

  code.forEach((item, index) => {
    if (!item) {
      return
    }
    if (item.includes('<script>')) {
      inScript = true
    }
    if (inScript && item.includes('//')) {
      return
    }
    let zh = item.match(/[\u4e00-\u9fa5，：！]+/g)
    if (!zh || zh.length > 1) return
    zh = zh.join('')
    // 是否已经有翻译
    const dictKey = dict[zh] && dict[zh].key
    // key
    if (!dictKey) {
      migrate.key[`__${index}`] = zh
    }
    let template = null
    if (!inScript) {
      template = dictKey ? [`label="${zh}"`, `:label="$t('${migrate.namespace}.${dictKey}')"`]
        : [zh, `{{ $t('${migrate.namespace}.__${index}') }}`]
    } else {
      template = dictKey ? [`'${zh}'`, `this.$t('${migrate.namespace}.${dictKey}')`]
        : [`'${zh}'`, `this.$t('${migrate.namespace}.__${index}')`, `__${index}`]
    }
    const row = {
      key: dictKey || `__${index}`,
      value: zh,
      template: template,
      script: inScript,
    }
    migrate.rows[index] = row
    migrate.zhCode[row.key] = row.value
    migrate.enCode[row.key] = dictKey ? dict[zh].en : zh
  })
  writeFileSync(
    path.join(dbPath, `${migrate.namespace}.json`),
    migrate,
  )
}

// 修改代码
function writeCode(migrate) {
  const code = fs.readFileSync(migrate.file).toString()
                 .split('\n')
  Object.keys(migrate.rows).forEach((row) => {
    const oper = migrate.rows[row]
    oper.template[1] = oper.template[1].replace(/(__\d+)/g, $ => migrate.key[$])
    // row 行号
    code[row] = code[row].replace(oper.template[0], oper.template[1])
  })
  writeFileSync(migrate.file, code.join('\n'))
  // 输出控制台
  let langCode = {}
  Object.keys(migrate.enCode).forEach((item) => {
    if (item.startsWith('__')) {
      langCode[migrate.key[item]] = migrate.enCode[item]
    } else {
      langCode[item] = migrate.enCode[item]
    }
  })
  langCode = {
    [migrate.namespace] : langCode
  }
  log(langCode)
  langCode = {}
  Object.keys(migrate.zhCode).forEach((item) => {
    if (item.startsWith('__')) {
      langCode[migrate.key[item]] = migrate.zhCode[item]
    } else {
      langCode[item] = migrate.zhCode[item]
    }
  })
  langCode = {
    [migrate.namespace] : langCode
  }
  log(langCode)
}

// prop="deviceName" => deviceName
function loadKeys(file, data = {}) {
  const code = fs.readFileSync(file).toString()
                 .split('\n')
  code.forEach((item) => {
    if (!item) {
      return
    }
    state(item)
    const prop = propReg.exec(item)
    if (!prop) {
      return
    }
    const zh = item.match(zhReg)
    if (!data[prop[1]]) {
      data[prop[1]] = {
        zh: zh && zh.join(''),
        en: prop[1] && key2Value(prop[1]),
      }
    }
    return data
  })
}

// deviceDetails => Device Details
function key2Value(value) {
  return value && value.replace(descReg, ' $1')
                       .replace(titleCase, $ => $.toUpperCase())
}

// loadKeys => all
function loadDict(entry, dbPath = './db/dict/dict.json') {
  const list = []
  readFileListSync(entry, list, dir => dir && dir.endsWith('.vue'))
  let data = {}
  list.forEach((file, index) => {
    data[`$_${file.replace(entry, '')}`] = file
    loadKeys(file, data)
  })
  if (fs.existsSync(dbPath)) {
    data = Object.assign(require(dbPath), data)
  }
  writeFileSync(dbPath, JSON.stringify(data, null, 2))
  log('load dict done')
}

// 初步处理
function loadAllDict() {
  loadDict('/Users/emqtt/workspace/actorcloud/src/', './db/dict/all.json')
  loadDict('/Users/emqtt/workspace/actorcloud/src/apps/devices', './db/dict/devices.json')
  loadDict('/Users/emqtt/workspace/actorcloud/src/apps/accounts', './db/dict/accounts.json')
  loadDict('/Users/emqtt/workspace/actorcloud/src/apps/base', './db/dict/base.json')
}

// 反向引用 旧密码: { zh: '旧密码', en: 'Old Password', key: 'oldPassword' }
function resetDictCode() {
  const data = require('./db/dict/all')
  Object.keys(data).forEach((item) => {
    if (!data[item].zh) {
      return
    }
    data[data[item].zh] = {
      ...data[item],
      key: item,
    }
  })
  writeFileSync('./db/dict/reset_all.json', data)
}

// loadRows => all
function migrateAllVue(entry, dbPath) {
  let list = []
  readFileListSync(entry, list, dir => dir && dir.endsWith('.vue'))
  list.forEach((file) => {
    loadRows(file, dbPath)
  })
}

// loadDict('/Users/emqtt/workspace/actorcloud/src/')
loadRows('/Users/emqtt/workspace/actorcloud/src/apps/accounts/views/')
// migrateAllVue('/Users/emqtt/workspace/actorcloud/src/apps/base/views/', './db/migrate/base')

// writeCode(require('./db/migrate/accounts/userDetails'))
// log(require('./db/migrate/accounts/loginlogs').enCode)