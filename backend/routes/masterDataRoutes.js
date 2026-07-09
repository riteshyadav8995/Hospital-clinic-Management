const express = require("express");
const router = express.Router();
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const {
  getBranches,
  createBranch,
  getRoles,
  createRole,
  getStaffUsers
} = require("../controllers/masterDataController");

// Protect all master data routes and require 'all' (Super Admin) or specific master permissions
router.use(verifyToken);

// Branches
router.get("/branches", requirePermission('branch_admin'), getBranches);
router.post("/branches", requirePermission('all'), createBranch);

// Roles
router.get("/roles", requirePermission('all'), getRoles);
router.post("/roles", requirePermission('all'), createRole);

// Staff
router.get("/staff", requirePermission('all'), getStaffUsers);

module.exports = router;
