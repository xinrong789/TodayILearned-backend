const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3000;

//  Express
app.use(cors());

app.use(express.json());

// connect to mysql
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "studyinfo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// check connection status
db.getConnection((err, connection) => {
  if (err) {
    console.error("connection failed:", err);
  } else {
    console.log("database connection successful");
    connection.release();
  }
});

// RESTful API get all facts

app.get("/facts", (req, res) => {
  const category = req.query.category || "all";
  console.log("Requested category:", category);

  let sql = "SELECT * FROM facts";
  let params = [];

  if (category !== "all") {
    sql += " WHERE category = ?";
    params.push(category);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Query failed:", err);
      return res.status(500).send("Query failed");
    }

    console.log(
      `Found ${results.length} results for category: ${
        category === "all" ? "all categories" : category
      }`
    );
    res.json(results);
  });
});
// Route to get facts with specific ID
app.get("/facts", (req, res) => {
  let sql = "SELECT * FROM facts";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Query failed:", err);
      return res.status(500).send("Query failed");
    }
    res.json(results);
  });
});
app.get("/facts/:id", (req, res) => {
  const { id } = req.params; // Extract the ID from the request URL
  console.log("Fetching fact with ID:", id);

  let sql = "SELECT * FROM facts WHERE id = ?"; // SQL query to get the record by ID
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Query failed:", err);
      return res.status(500).send("Query failed");
    }

    if (results.length === 0) {
      return res.status(404).send("Fact not found");
    }

    res.json(results[0]); // Return the fact data (first result)
  });
});

// add fact

app.post("/facts", (req, res) => {
  const { text, source, category } = req.body;
  console.log("Received data:", text, source, category); // 打印接收到的数据

  let sql = "INSERT INTO facts (text, source, category) VALUES (?, ?, ?)";

  db.query(sql, [text, source, category], (err, result) => {
    if (err) {
      console.error("Insert failed", err);
      return res.status(500).send("Insert failed");
    }

    // 返回插入的新记录
    const newFact = {
      id: result.insertId,
      text,
      source,
      category,
      votesInteresting: 0,
      createdIn: new Date().getFullYear(),
    };

    res.status(201).json(newFact); // 返回新插入的数据
  });
});

// DELETE fact by ID
app.delete("/facts/:id", (req, res) => {
  const { id } = req.params;
  console.log("Deleting fact with ID:", id);

  // SQL 删除语句
  let sql = "DELETE FROM facts WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete failed:", err);
      return res.status(500).send("Delete failed");
    }

    // 如果没有记录被删除，返回 404 错误
    if (result.affectedRows === 0) {
      return res.status(404).send("Fact not found");
    }

    // 返回删除成功的消息
    res.status(200).send("Fact deleted successfully");
  });
});

app.patch("/facts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  const columnName = Object.keys(updates)[0]; // 获取要更新的列名

  console.log(`更新ID为${id}的事实，字段:${columnName}`);

  // 首先获取当前值
  db.query("SELECT * FROM facts WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("查询失败:", err);
      return res.status(500).json({ error: "查询失败" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Fact not found" });
    }

    const fact = results[0];
    let newValue;

    // 检查是否是投票字段
    if (columnName.startsWith("votes")) {
      // 增加投票计数
      newValue = fact[columnName] + 1;
    } else {
      // 使用提供的值
      newValue = updates[columnName];
    }

    // 更新数据库
    db.query(
      "UPDATE facts SET ?? = ? WHERE id = ?",
      [columnName, newValue, id],
      (err, result) => {
        if (err) {
          console.error("更新失败:", err);
          return res.status(500).json({ error: "更新失败" });
        }

        // 返回更新后的完整对象
        const updatedFact = { ...fact, [columnName]: newValue };
        res.json(updatedFact);
      }
    );
  });
});
// start server
app.listen(port, () => {
  console.log(`server start:http://localhost:${port}`);
});
