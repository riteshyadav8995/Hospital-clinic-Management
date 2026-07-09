const express = require("express");
const { getWards, addWard, getBeds, addBed } = require("../controllers/wardController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/wards", verifyToken, getWards);
router.post("/wards", verifyToken, addWard);
router.get("/beds", verifyToken, getBeds);
router.post("/beds", verifyToken, addBed);

module.exports = router;
