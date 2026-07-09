const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { sendRegistrationNotifications } = require("../utils/notificationService");

// 1. REGISTER USER
exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // Check if email already exists
    const existing = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Fetch role_id for Patient
    const roleRes = await db.query("SELECT id FROM roles WHERE role_name = 'Patient'");
    const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : null;

    // Insert user into DB
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email, phone, hashedPassword, roleId]
    );

    const userId = result.rows[0].id;

    // Generate patient_code
    const patientCode = `PAT-${new Date().getFullYear()}-${userId.toString().padStart(4, '0')}`;

    // Insert into patients
    await db.query(
      `INSERT INTO patients (patient_code, name, phone) VALUES ($1, $2, $3)`,
      [patientCode, name, phone]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, phone, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Send response immediately — notifications run in background
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: userId,
        name,
        email,
        phone,
      },
    });

    // Fire-and-forget: send welcome email + WhatsApp (does NOT block the response)
    setImmediate(() => {
      sendRegistrationNotifications({ userId, name, email, phone }).catch((err) =>
        console.error("[Register] Notification error (non-fatal):", err.message)
      );
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // Find user by email
    const result = await db.query(
      "SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    
    // Ensure the user is a Patient
    if (user.role_name !== "Patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only patients can login here. Please use the staff login portal.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// 3. GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at, p.patient_code 
       FROM users u 
       LEFT JOIN patients p ON u.phone = p.phone 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// 4. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // Check if new email conflicts with another user
    const existing = await db.query(
      "SELECT * FROM users WHERE email = $1 AND id != $2",
      [email, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }

    await db.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4",
      [name, email, phone, req.user.id]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: req.user.id,
        name,
        email,
        phone,
      },
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// 5. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required",
    });
  }

  try {
    // Fetch user password
    const result = await db.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// 6. GET USER APPOINTMENTS
exports.getAppointments = async (req, res) => {
  try {
    // Find patient_id based on user's phone/name
    const patientRes = await db.query("SELECT id FROM patients WHERE phone = $1", [req.user.phone]);
    if (patientRes.rows.length === 0) {
      return res.json({ success: true, appointments: [] });
    }
    const patientId = patientRes.rows[0].id;

    const result = await db.query(`
      SELECT a.*, d.department_name as department, u.name as doctor_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = $1 
      ORDER BY a.date DESC, a.created_at DESC
    `, [patientId]);

    // Map database properties for backwards compatibility with name/patient_name
    const mapped = result.rows.map((appt) => ({
      ...appt,
      name: appt.patient_name || appt.name || "",
      patient_name: appt.patient_name || appt.name || "",
    }));

    res.json({
      success: true,
      appointments: mapped,
    });
  } catch (error) {
    console.error("Fetch appointments error:", error);
    res.status(500).json({ success: false, message: "Error fetching appointments" });
  }
};

// 7. GET USER LAB REPORTS
exports.getLabReports = async (req, res) => {
  try {
    // Find patient_id based on user's phone
    const patientRes = await db.query("SELECT id FROM patients WHERE phone = $1", [req.user.phone]);
    if (patientRes.rows.length === 0) {
      return res.json({ success: true, labs: [] });
    }
    const patientId = patientRes.rows[0].id;

    const result = await db.query(`
      SELECT l.id, l.test_name, l.status, l.created_at, 
             r.result_value, r.normal_range, d.department_name as department, u.name as doctor_name
      FROM lab_orders l
      LEFT JOIN lab_results r ON l.id = r.lab_order_id
      LEFT JOIN doctors d ON l.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE l.patient_id = $1
      ORDER BY l.created_at DESC
    `, [patientId]);

    res.json({
      success: true,
      labs: result.rows,
    });
  } catch (error) {
    console.error("Fetch lab reports error:", error);
    res.status(500).json({ success: false, message: "Error fetching lab reports" });
  }
};
