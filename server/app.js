const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config({ path: "../db.env" });
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");

const db = mysql.createPool({
  host: process.env.DB_HOST, //  host: "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// App configurations
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
// Export db connection for use in routes
module.exports = { db };
const routes = require("./routes");
app.use("/api", routes);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
