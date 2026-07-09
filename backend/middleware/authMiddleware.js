const jwt = require("jsonwebtoken");
const db = require("../db");

// Verify Token and attach user details
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data and permissions
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role_id, u.branch_id, r.role_name, r.permissions_json 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.status = 'Active'
    `, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found or inactive." });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Check if user has specific permission OR is Super Admin
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const perms = req.user.permissions_json || {};
    
    // Super Admin has 'all' permission
    if (perms.all === true || perms[requiredPermission] === true) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Insufficient permissions.",
      });
    }
  };
};

module.exports = { verifyToken, requirePermission };