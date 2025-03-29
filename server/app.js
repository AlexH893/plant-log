require("dotenv").config({ path: "../.env" });

const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");
import { environment } from "src/environments/environment"; // Generic import
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

// Keep-alive route
app.get("/keep-alive", (req, res) => {
  res.status(200).send("Server is alive!");
});

// Function to get a timestamp
const getTimestamp = () => {
  return new Date().toLocaleString(); // Formats the date & time
};

// Self-pinging function
const pingServer = async () => {
  try {
    await axios.get(`https://plant-log.onrender.com/api/keep-alive`);
    console.log(`[${getTimestamp()}] Self keep-alive ping sent`);
  } catch (error) {
    console.error(`[${getTimestamp()}] Keep-alive error:`, error.message);
  }
};

// Set interval to call keep-alive every 8 minutes
setInterval(pingServer, 8 * 60 * 1000); // 8 minutes

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
module.exports = { app }; // Export both the app and the server
