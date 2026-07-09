const { Pool } = require("pg");
require("dotenv").config();

const db = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
    return;
  }
  console.log("PostgreSQL connected successfully");
  release();
});

module.exports = db;