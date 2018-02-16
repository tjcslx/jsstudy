// 引入需要的库
const cheerio = require('cheerio')
const request = require('superagent')
const mysql = require('mysql-activerecord')

// 定义常量
const URL = 'http://www.tjgpc.gov.cn/webInfo/getWebInfoListForwebInfoClass.do?fkWebInfoclassId=W001_001'
const KEYWORD = '天津市财政局'
const SERVER = 'localhost'
const USERNAME = 'root'
const PWD = ''
const DB = 'test'

// 定义变量，pageArr为保存公告每页链接的数组
let pageArr = []

// 连接到MySQL数据库
let db = new mysql.Adapter({
    server: SERVER,
    username: USERNAME,
    password: PWD,
    database: DB,
    reconnectTimeout: 2000
})

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

// 将所有关键字为“天津市财政局”的公告目录信息取出，并保存到数据库，步骤如下：
// 1、取每页的链接并保存到pageArr数组
// 2、遍历pageArr数组，并依次访问各页；
// 3、用之前定义的函数提取数据，并将提取的数据保存到数据库
request.post(URL).type('form').send('keyWord=' + encodeURIComponent(KEYWORD)).end((err, res) => {
    if (err) {
        console.log(err.message)
    }
    let $ = cheerio.load(res.text)
    // 第一步：取得“共有xx页”的页码
    let pageNum = $('div.pager>span>font:nth-child(2)').text()
    // 进行for循环，将页码写到URL中，并将URL保存到数组pageUrl
    for (let i = 1; i <= pageNum; i++) {
        let pageUrl = `http://www.tjgpc.gov.cn/webInfo/getWebInfoListForwebInfoClass.do?fkWebInfoclassId=W005_001&page=${i}&pagesize=10`
        pageArr.push(pageUrl)
    }
    // 第二步
    for (let a in pageArr) {
        request.post(pageArr[a]).type('form').send('keyWord=' + encodeURIComponent(KEYWORD)).end((err, res) => {
            // 定义局部变量，annoIdxArr为保存公告目录信息的数组
            let annoIdxArr = []
            if (err) {
                console.log(err.message)
            }
            // 第三步：提取数据并保存在作用域内的annoIdxArr数组
            getIndicesInPage(res, 'div.cur>table>tbody>tr', annoIdxArr)
            // 将annoIdxArr数组保存在数据库
            for (let index = 0; index < annoIdxArr.length; index++) {
                const element = annoIdxArr[index]
                db.insert('procure_data', {
                    procure_type: element.procureType,
                    announce_name: element.annoName,
                    announce_date: element.annoDate,
                    announce_link: element.annoLink
                }, (err, info) => {
                    if (err) {
                        console.log(err)
                    }
                    console.log(info)
                })
            }
        })
    }
})