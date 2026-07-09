const db = require("../db");

// --- BRANCHES ---
const getBranches = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM branches ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBranch = async (req, res) => {
  const { name, address, contact } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO branches (name, address, contact) VALUES ($1, $2, $3) RETURNING *",
      [name, address, contact]
    );
    res.status(201).json({ success: true, branch: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ROLES ---
const getRoles = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM roles ORDER BY id ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRole = async (req, res) => {
  const { role_name, permissions_json } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO roles (role_name, permissions_json) VALUES ($1, $2) RETURNING *",
      [role_name, permissions_json || '{}']
    );
    res.status(201).json({ success: true, role: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- STAFF USERS ---
const getStaffUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.status, r.role_name, b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE r.role_name != 'Patient'
      ORDER BY u.id ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBranches,
  createBranch,
  getRoles,
  createRole,
  getStaffUsers
};
