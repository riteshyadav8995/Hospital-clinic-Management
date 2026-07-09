const express = require("express");
const router = express.Router();
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");

const {
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getDepartments
} = require("../controllers/doctorController");

router.get("/", getDoctors);
router.get("/departments", getDepartments);
router.post("/", verifyToken, requirePermission('all'), addDoctor);
router.put("/:id", verifyToken, requirePermission('all'), updateDoctor);
router.delete("/:id", verifyToken, requirePermission('all'), deleteDoctor);

module.exports = router;
