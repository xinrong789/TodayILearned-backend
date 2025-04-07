const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")

const app = express()
const port = 3000

// 使用 CORS 中间件
app.use(cors())

// 支持 JSON 请求体
app.use(express.json())

// 配置数据库连接池
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "studyinfo",
  waitForConnections: true, // 等待连接
  connectionLimit: 10, // 最大连接数
  queueLimit: 0 // 请求队列的最大长度
})

// 测试数据库连接
db.getConnection((err, connection) => {
  if (err) {
    console.error("数据库连接失败:", err)
  } else {
    console.log("✅ 数据库连接成功")
    connection.release() // 释放连接
  }
})

// API: 获取所有 facts
app.get("/facts", (req, res) => {
  const sql = "SELECT * FROM facts"
  db.query(sql, (err, results) => {
    if (err) {
      console.error("查询失败:", err)
      return res.status(500).send("查询失败")
    }
    res.json(results)
  })
})

// API: 添加一个 fact
app.post("/facts", (req, res) => {
  const { text, category } = req.body
  if (!text || !category) {
    return res.status(400).send("文本和类别是必填的")
  }
  const sql = "INSERT INTO facts (text, category) VALUES (?, ?)"
  db.query(sql, [text, category], (err, result) => {
    if (err) {
      console.error("插入失败:", err)
      return res.status(500).send("插入失败")
    }
    res.status(201).send("添加成功")
  })
})

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 服务器已启动：http://localhost:${port}`)
})
