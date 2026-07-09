const express = require("express");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { getLabOrders, updateLabOrderStatus, enterLabResults } = require("../controllers/labController");

const router = express.Router();

router.get("/orders", verifyToken, requirePermission('laboratory'), getLabOrders);
router.patch("/orders/:id/status", verifyToken, requirePermission('laboratory'), updateLabOrderStatus);
router.post("/orders/:id/results", verifyToken, requirePermission('laboratory'), enterLabResults);

module.exports = router;
