const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
  getServices,
  addService,
  updateService,
  deleteService
} = require("../controllers/serviceController");

router.get("/", getServices);
router.post("/", verifyToken, addService);
router.put("/:id", verifyToken, updateService);
router.delete("/:id", verifyToken, deleteService);

module.exports = router;
