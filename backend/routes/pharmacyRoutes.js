const express = require("express");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const { getMedicines, addMedicine, addStock, getPrescriptions, fulfillPrescription } = require("../controllers/pharmacyController");

const router = express.Router();

router.get("/medicines", verifyToken, requirePermission('pharmacy'), getMedicines);
router.post("/medicines", verifyToken, requirePermission('pharmacy'), addMedicine);
router.post("/stock", verifyToken, requirePermission('pharmacy'), addStock);
router.get("/prescriptions", verifyToken, requirePermission('pharmacy'), getPrescriptions);
router.post("/prescriptions/fulfill", verifyToken, requirePermission('pharmacy'), fulfillPrescription);

module.exports = router;
