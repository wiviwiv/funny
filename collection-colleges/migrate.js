const schoolData = require('./school')
const School = require('./model/School')

function fix() {
  schoolData.forEach((school) => {
    if (!parseInt(school.code)) {
      const data = { ...school }
      school.name += school.code
      school.code = data.belong
      school.level = data.tag[0]
      school.city = data.level
      school.belong = data.city
      school.tag = []
    }
  })
  require('fs').writeFileSync('./school.json', JSON.stringify(schoolData, null, 2))
}

async function migrate() {
  console.log('学校数量:', schoolData.length)
  schoolData.forEach(async (school) => {
    if (!school.name || !school.level) {
      console.log(school)
      return
    }
    const _school = await School.findOne({ name: school.name })
    if (!_school) {
      const state = await new School(school).save()
    }
  })
  console.log(await School.count({}))
}

migrate()