// 引入需要的库
const cheerio = require('cheerio')
const request = require('superagent')
const db = require('./db')
const download = require('./download')
const public = require('./public')

// 定义常量
const URL = 'http://www.tjgpc.gov.cn/webInfo/getWebInfoListForwebInfoClass.do?fkWebInfoclassId=W001_001'
const KEYWORD = '天津市财政局'

// 定义变量，pageArr为保存公告每页链接的数组
let pageArr = []

/** 将共用方法提取成函数
 * @param  {string} res Request的返回值
 * @param  {string} selector 查找元素对应的选择器
 * @param  {Object[]} arr 保存元素的数组
 */
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
        let pageUrl = URL + `&page=${i}&pagesize=10`
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
            for (let index in annoIdxArr) {
                const element = annoIdxArr[index]
                // 访问数组中的明细页面，并获取公告信息及附件链接，获取后保存到数组中的每个对象中
                request.get(element.annoLink).end((err, res) => {
                    if (err) {
                        console.log(err.message)
                    }
                    let $ = cheerio.load(res.text)
                    let content = $('div.xx_right>center>table>tbody>tr:nth-child(3)').text()
                    // 提取链接的协议名、地址、端口号
                    let annoLinkUrlFirst = public.extractInitAdd(element.annoLink)
                    element.annoDetails = content

                    // if ($('div.xx_right>center>table>tbody>tr:nth-child(3)>td.xx').find('a').length === 0) {
                    //     element.annoAttachmentLink = ''
                    //     db.insert('procure_data', {
                    //         procure_type: element.procureType,
                    //         announce_name: element.annoName,
                    //         announce_date: element.annoDate,
                    //         announce_link: element.annoLink,
                    //         announce_details: element.annoDetails,
                    //         announce_attachment_link: element.annoAttachmentLink
                    //     }, (err, info) => {
                    //         if (err) {
                    //             console.log(err)
                    //         }
                    //         console.log(info)
                    //     })
                    // } else {
                    //     $('div.xx_right>center>table>tbody>tr:nth-child(3)>td.xx a').each((index, element) => {
                    //         if ($(element).attr('href') === undefined) {
                    //             element.annoAttachmentLink = ''
                    //             db.insert('procure_data', {
                    //                 procure_type: element.procureType,
                    //                 announce_name: element.annoName,
                    //                 announce_date: element.annoDate,
                    //                 announce_link: element.annoLink,
                    //                 announce_details: element.annoDetails,
                    //                 announce_attachment_link: element.annoAttachmentLink
                    //             }, (err, info) => {
                    //                 if (err) {
                    //                     console.log(err)
                    //                 }
                    //                 console.log(info)
                    //             })
                    //         } else {
                    //             element.annoAttachmentLink = $(element).attr('href').replace(/\\/g, '/').replace(/^\//, annoLinkUrlFirst)
                    //             db.insert('procure_data', {
                    //                 procure_type: element.procureType,
                    //                 announce_name: element.annoName,
                    //                 announce_date: element.annoDate,
                    //                 announce_link: element.annoLink,
                    //                 announce_details: element.annoDetails,
                    //                 announce_attachment_link: element.annoAttachmentLink
                    //             }, (err, info) => {
                    //                 if (err) {
                    //                     console.log(err)
                    //                 }
                    //                 console.log(info)
                    //             })
                    //         }
                    //     })
                    // }
                    // 若链接无href属性，attr方法返回undefined，如是则为空，否则为attr方法的返回值
                    let link = $('div.xx_right>center>table>tbody>tr:nth-child(3)>td.xx').find('a').attr('href') || ''
                    // 将链接中的\全局替换为/，/开头的相对URL开头增加地址，替换为绝对URL
                    element.annoAttachmentLink = link.replace(/\\/g, '/').replace(/^\//, annoLinkUrlFirst)
                    // 下载链接文件，并将下载函数返回的文件名保存在数组
                    if (element.annoAttachmentLink === '') {
                        element.announceAttachmentLocalLink = ''
                    } else {
                        element.announceAttachmentLocalLink = download.dl(element.annoAttachmentLink)
                    }
                    // 将完整的数组保存到数据库
                    db.insert('procure_data', {
                        procure_type: element.procureType,
                        announce_name: element.annoName,
                        announce_date: element.annoDate,
                        announce_link: element.annoLink,
                        announce_details: element.annoDetails,
                        announce_attachment_link: element.annoAttachmentLink,
                        announce_attachment_local_link: element.announceAttachmentLocalLink
                    }, (err, info) => {
                        if (err) {
                            console.log(err)
                        }
                        console.log(info)
                    })
                })
            }
        })
    }
})