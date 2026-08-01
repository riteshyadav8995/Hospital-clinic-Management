const express = require("express");
const router = express.Router();
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAppointments,
  getLabReports,
  sendRegisterOtp,
  sendForgotPasswordOtp,
  resetPassword
} = require("../controllers/userController");

// Public routes
router.post("/register-otp", sendRegisterOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password-otp", sendForgotPasswordOtp);
router.post("/forgot-password-reset", resetPassword);

// Protected patient routes
router.get("/profile", patientAuthMiddleware, getProfile);
router.put("/profile", patientAuthMiddleware, updateProfile);
router.put("/password", patientAuthMiddleware, changePassword);
router.get("/appointments", patientAuthMiddleware, getAppointments);
router.get("/labs", patientAuthMiddleware, getLabReports);

module.exports = router;
