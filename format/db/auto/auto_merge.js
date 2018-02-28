const zh = require('./account_zh')
const en = require('./account_en')

function getKeys(object) {
  return Object.keys(object)
}
const d = {}
getKeys(en).forEach((key) => {
  d[key] = {}
  let data = getKeys(zh[key])
  data.forEach((item) => {
    d[key][item] = en[key][item]
  })
})
console.log(d)