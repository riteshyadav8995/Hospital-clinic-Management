const express = require("express");
const { adminLogin } = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");
const db = require("../db");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/users", verifyToken, async (req, res) => {
  try {
    const sql = `
      SELECT u.id, u.name, u.email, u.phone, u.created_at 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name = 'Patient'
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(sql);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
});

router.get("/patients", verifyToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM patients ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ success: false, message: "Failed to fetch patients", error: error.message });
  }
});

module.exports = router;
