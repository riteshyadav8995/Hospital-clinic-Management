const express = require("express");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { getDashboardSummary } = require("../controllers/reportsController");

const router = express.Router();

// Both 'finance' and 'all' (Super Admin) might want to view reports
router.get("/summary", verifyToken, getDashboardSummary);

module.exports = router;
