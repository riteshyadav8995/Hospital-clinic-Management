const express = require("express");
const { getAdmissions, addAdmission, dischargePatient } = require("../controllers/admissionController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyToken, getAdmissions);
router.post("/", verifyToken, addAdmission);
router.put("/:id/discharge", verifyToken, dischargePatient);

module.exports = router;
