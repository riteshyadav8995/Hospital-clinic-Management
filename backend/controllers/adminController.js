const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Look up user and join with roles to check if they are staff
  const sql = `
    SELECT u.id, u.email, u.password_hash, u.name, u.role_id, r.role_name, r.permissions_json 
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.email = $1 AND u.status = 'Active'
  `;

  try {
    const result = await db.query(sql, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    // Ensure the user is a staff member (not a patient)
    if (admin.role_name === 'Patient') {
      return res.status(403).json({
        success: false,
        message: "Access forbidden for this portal.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role_name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  adminLogin,
};