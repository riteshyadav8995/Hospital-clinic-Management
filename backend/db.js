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

// Prevent Node.js from crashing when Neon serverless database drops idle connections
db.on('error', (err, client) => {
  console.error('Unexpected error on idle database client (Neon auto-suspend):', err.message);
});

module.exports = db;