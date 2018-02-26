const mysql = require('mysql-activerecord')

const SERVER = 'localhost'
const USERNAME = 'root'
const PWD = ''
const DB = 'test'

// 连接到MySQL数据库
let db = new mysql.Adapter({
    server: SERVER,
    username: USERNAME,
    password: PWD,
    database: DB,
    reconnectTimeout: 2000
})

module.exports = db