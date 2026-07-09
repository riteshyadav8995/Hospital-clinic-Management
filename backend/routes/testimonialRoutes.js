const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
  getTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getSuccessStories,
  addSuccessStory,
  updateSuccessStory,
  deleteSuccessStory
} = require("../controllers/testimonialController");

// Testimonials routes
router.get("/testimonials", getTestimonials);
router.post("/testimonials", verifyToken, addTestimonial);
router.put("/testimonials/:id", verifyToken, updateTestimonial);
router.delete("/testimonials/:id", verifyToken, deleteTestimonial);

// Success stories routes
router.get("/success-stories", getSuccessStories);
router.post("/success-stories", verifyToken, addSuccessStory);
router.put("/success-stories/:id", verifyToken, updateSuccessStory);
router.delete("/success-stories/:id", verifyToken, deleteSuccessStory);

module.exports = router;
