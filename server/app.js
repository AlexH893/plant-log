require("dotenv").config();

const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");
const app = express();

const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");

// Prod
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Dev
// const db = mysql.createPool({
//   host: "127.0.0.1",
//   user: "root",
//   password: "newpassword",
//   database: "plants",
// });

// App configurations
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
// Export db connection for use in routes
module.exports = db;
const routes = require("./routes");
app.use("/api", routes);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
module.exports = { app }; // Export both the app and the server
