const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
  getFaqs,
  addFaq,
  updateFaq,
  deleteFaq
} = require("../controllers/faqController");

router.get("/", getFaqs);
router.post("/", verifyToken, addFaq);
router.put("/:id", verifyToken, updateFaq);
router.delete("/:id", verifyToken, deleteFaq);

module.exports = router;
