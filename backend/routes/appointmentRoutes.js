const express = require("express");
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  updateAdminNotes,
  getQueue,
  getDoctorQueue,
  getBookedSlots
} = require("../controllers/appointmentController");

const { verifyToken, requirePermission } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyToken, createAppointment);

// Public route for fetching booked slots to lock them on the frontend
router.get("/booked-slots", getBookedSlots);

router.get("/", verifyToken, requirePermission('appointments'), getAppointments);
router.get("/queue", verifyToken, requirePermission('front_desk'), getQueue);
router.get("/doctor-queue", verifyToken, requirePermission('clinical'), getDoctorQueue);
router.patch("/:id/status", verifyToken, requirePermission('front_desk'), updateAppointmentStatus);
router.patch("/:id/notes", verifyToken, requirePermission('appointments'), updateAdminNotes);
router.delete("/:id", verifyToken, requirePermission('all'), deleteAppointment);

module.exports = router;
