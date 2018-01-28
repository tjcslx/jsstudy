// 引入需要的库
const cheerio = require('cheerio')
const request = require('superagent')

// 定义常量
const URL = 'http://www.tjgpc.gov.cn/webInfo/getWebInfoListForwebInfoClass.do?fkWebInfoclassId=W001_001'
const KEYWORD = '天津市财政局'

// 定义变量，annoIdxArr为保存公告目录信息的数组，pageArr为保存公告每页链接的数组
let annoIdxArr = [], pageArr = []

// 将共用方法提取成函数
function getIndicesInPage(res, selector, arr) {
    // 装载返回的HTML文档，赋值给$
    let $ = cheerio.load(res.text)
    // 通过selector选择器查找元素，将获取的值保存到对象，并增加到数组arr
    // jQuery中针对选择器的each方法
    $(selector).each((index, element) => {
        // 将获取的值保存到对象，并增加到数组annoIdxArr
        arr.push({
            annoIdxId: index + 1,
            // find(选择器)方法寻找符合条件的DOM节点；值中的[]用replace方法匹配后删除
            procureType: $(element).find('td:nth-child(2)>a:first-child').text().replace(/\[/, '').replace(/\]/, ''),
            annoName: $(element).find('td:nth-child(2)>a.xianshiwenti').attr('title'),
            annoLink: $(element).find('td:nth-child(2)>a.xianshiwenti').attr('href'),
            annoDate: $(element).find('td:last-child').text().replace(/\[/, '').replace(/\]/, '')
        })
    })
}

// 取默认公告页面第一页的目录信息
request.get(URL).end((err, res) => {
    // 如失败则返回错误信息
    if (err) {
        console.log(err.message)
    }
    getIndicesInPage(res, 'div.cur>table>tbody>tr', annoIdxArr)
    // 增加完成后打印数组annoIdxArr
    console.log(annoIdxArr)
})

// 取关键字为“天津市财政局”公告页面第一页的目录信息
request.post(URL).type('form').send('keyWord=' + encodeURIComponent(KEYWORD)).end((err, res) => {
    // 如失败则返回错误信息
    if (err) {
        console.log(err.message)
    }
    getIndicesInPage(res, 'div.cur>table>tbody>tr', annoIdxArr)
    // 增加完成后打印数组annoIdxArr
    console.log(annoIdxArr)
})

// 取每页的链接并保存到pageArr数组
request.post(URL).type('form').send('keyWord=' + encodeURIComponent(KEYWORD)).end((err, res) => {
    if (err) {
        console.log(err.message)
    }
    let $ = cheerio.load(res.text)
    // 取得“共有xx页”的页码
    let pageNum = $('div.pager>span>font:nth-child(2)').text()
    // 进行for循环，将页码写到URL中，并将URL保存到数组pageUrl
    for (let i = 1; i <= pageNum; i++) {
        let pageUrl = `http://www.tjgpc.gov.cn/webInfo/getWebInfoListForwebInfoClass.do?fkWebInfoclassId=W005_001&page=${i}&pagesize=10`
        pageArr.push(pageUrl)
    }
    console.log(pageArr)
})