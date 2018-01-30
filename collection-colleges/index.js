const fs = require('fs')
const axios = require('axios')
const cheerio = require('cheerio')

const data = []

function load(url, isDetails = false) {
  if (!url) {
    return false
  }
  axios.get(url).then((response) => {
    if (response.status !== 200) {
      console.warn('加载失败: ', url)
      return
    }
    let $ = cheerio.load(response.data)
    if (isDetails) {
      const list = $('.jybzc_right table tr')
      let province = list.eq(0).text().includes('序号') ? list.eq(1).text() : list.eq(0).text()
      province = province.replace(/（.*）|\s/g, '')
      console.log(province)
      list.each((i, el) => {
        // 每一个 tr
        let row = $(el).text()
        row = row.replace(/\n/g, '').split(/\s/g)
        // [ '', '1', '北京大学', '4111010001', '教育部', '北京市', '本科', '', '', '' ]
        // [ '', '2', '中国人民大学', '4111010002', '教育部', '北京市', '本科', '', '', '' ]
        if (row[0] || !/\d/g.test(row[1].toString())) {
          return
        }
        const school = {
          name: row[2],
          code: row[3],
          level: row[6],
          province: province,
          city: row[5],
          belong: row[4],
          desc: '',
          tag: [row[7]],
        }
        console.log(school.name)
        data.push(school)
      })
    } else {
      let list = $('.jybzc_right .list p a')
      const size = list.length - 1
      list.each((i, el) => {
        {
          setTimeout(() => {
            load(`http://gaokao.chsi.com.cn${$(el).attr('href')}`, true)
            if (size === i) {
              console.log('完成爬取，储存中... 数据量:', data.length)
              setTimeout(() => {
                fs.writeFileSync('./school.json', JSON.stringify(data, null, 2))
                console.log('done, school.json')
                process.exit(0)
              }, 20 * 1000)
            }
          }, i * 500)
        }
      })
    }
  }).catch(handleError)
}

function handleError(error) {
  console.error('Error:', error.toString())
}

load('http://gaokao.chsi.com.cn/gkxx/zszcgd/dnzszc/201706/20170615/1611254988.html')
