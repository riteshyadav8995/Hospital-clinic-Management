const express = require("express");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { submitConsultation, getPatientLabs } = require("../controllers/clinicalController");

const router = express.Router();

router.post("/consultations", verifyToken, requirePermission('clinical'), submitConsultation);
router.get("/patients/:id/labs", verifyToken, requirePermission('clinical'), getPatientLabs);

module.exports = router;
