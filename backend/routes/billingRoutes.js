const express = require("express");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { getInvoices, recordPayment } = require("../controllers/billingController");

const router = express.Router();

router.get("/invoices", verifyToken, requirePermission('finance'), getInvoices);
router.post("/payments", verifyToken, requirePermission('finance'), recordPayment);

module.exports = router;
