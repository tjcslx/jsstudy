const fs = require('fs')
const path = require('path')
const request = require('superagent')
const public = require('./public')

let download = {
    /**下载指定URL的文件，保存到files文件夹，以当前时间+原文件扩展名命名
     * @param  {string} fileUrl 输入参数为文件URL
     */
    dl: (fileUrl) => {
        request.get(fileUrl).pipe(fs.createWriteStream(path.join(__dirname, 'files', download.genFileName() + '.' + public.extractFileExt(fileUrl))))
        return download.genFileName() + '.' + public.extractFileExt(fileUrl)
    },
    /**
     * 根据系统时间生成文件名，至毫秒
     */
    genFileName: () => {
        let date = new Date()
        let result = ''
        let o = {
            yyyy: date.getFullYear().toString(),
            MM: (date.getMonth() + 1).toString(),
            dd: date.getDate().toString(),
            hh: date.getHours().toString(),
            mm: date.getMinutes().toString(),
            ss: date.getSeconds().toString(),
            S: date.getMilliseconds().toString()
        }
        // 遍历对象中的每个值，当值的长度只有1位时，在左侧加0，并将结果累加到result变量
        for (let index in o) {
            o[index] = (o[index].length === 1) ? ('0' + o[index]) : o[index]
            result = result + o[index]
        }
        return result
    }
}

module.exports = download