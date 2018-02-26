let public = {
    /** 提取URL的协议名、冒号、斜杠
    * @param  {string} url 要提取的URL
    */
    extractInitAdd: (url) => {
        let arr = url.split('/')
        return arr[0] + '//' + arr[2] + '/'
    },
    /** 提取URL的文件扩展名
     * @param  {string} url 要提取的URL
     */
    extractFileExt: (url) => {
        let arr = url.split('.')
        return arr[arr.length - 1]
    }
}

module.exports = public