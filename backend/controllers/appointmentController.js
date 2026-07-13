const db = require("../db");
const { sendAppointmentNotifications } = require("../utils/notificationService");

const createAppointment = async (req, res) => {
  const { doctor_id, preferred_date, preferred_time, message } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please log in to book an appointment.",
    });
  }

  if (!doctor_id || !preferred_date) {
    return res.status(400).json({
      success: false,
      message: "Doctor and date are required",
    });
  }

  const user_id = req.user.id;

  try {
    // 1. Get patient_id
    const patientRes = await db.query("SELECT id, name, phone FROM patients WHERE phone = $1", [req.user.phone]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }
    const patient = patientRes.rows[0];
    const patient_id = patient.id;

    // 2. Get doctor info
    const docRes = await db.query("SELECT u.name, u.email, d.department_name as department, d.fee FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1", [doctor_id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }
    const doctor = docRes.rows[0];
    const fee = parseFloat(doctor.fee) > 0 ? parseFloat(doctor.fee) : 500.00;

    // 3. Generate token
    const dateStr = preferred_date.replace(/-/g, '');
    const countRes = await db.query("SELECT count(*) FROM appointments WHERE date = $1", [preferred_date]);
    const nextTokenNum = parseInt(countRes.rows[0].count) + 1;
    const token_no = `TKN-${dateStr}-${nextTokenNum.toString().padStart(3, '0')}`;

    // 4. Insert appointment
    const sql = `
      INSERT INTO appointments 
      (patient_id, doctor_id, date, time, token_no, status) 
      VALUES ($1, $2, $3, $4, $5, 'Booked') RETURNING id
    `;

    const result = await db.query(sql, [
      patient_id,
      doctor_id,
      preferred_date,
      preferred_time || null,
      token_no
    ]);

    const appointmentId = result.rows[0].id;

    // 5. Generate Billing Invoice for Consultation
    const invoiceNo = `INV-${Date.now()}`;
    await db.query(`
      INSERT INTO invoices (invoice_no, patient_id, total, payable, status)
      VALUES ($1, $2, $3, $4, 'Unpaid')
    `, [invoiceNo, patient_id, fee, fee]);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointmentId,
      token_no
    });

    setImmediate(() => {
      sendAppointmentNotifications({
        userId: user_id,
        name: patient.name,
        email: req.user.email || null,
        phone: patient.phone,
        department: doctor.department,
        preferred_date: preferred_date || null,
        preferred_time: preferred_time || null,
        appointmentId,
        fee,
        doctorEmail: doctor.email,
        doctorName: doctor.name
      }).catch((err) =>
        console.error("[Appointment] Notification error (non-fatal):", err.message)
      );
    });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save appointment",
      error: error.message,
    });
  }
};

const getAppointments = async (req, res) => {
  const sql = `
    SELECT a.*, p.name as patient_name, p.phone as phone, p.patient_code, d.department_name as department, u.name as doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u ON d.user_id = u.id
    ORDER BY a.created_at DESC
  `;

  try {
    const result = await db.query(sql);
    
    res.status(200).json({
      success: true,
      appointments: result.rows,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatus = ["Booked", "Confirmed", "Waiting", "In-Consultation", "Completed", "Cancelled", "No-Show"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment status",
    });
  }

  const sql = "UPDATE appointments SET status = $1 WHERE id = $2";

  try {
    const result = await db.query(sql, [status, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
};

const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM appointments WHERE id = $1";

  try {
    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message,
    });
  }
};

const updateAdminNotes = async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;

  const sql = "UPDATE appointments SET admin_notes = $1 WHERE id = $2";

  try {
    const result = await db.query(sql, [admin_notes || null, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin notes updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update admin notes",
      error: error.message,
    });
  }
};

const getQueue = async (req, res) => {
  // Get today's queue
  const today = new Date().toISOString().split('T')[0];
  const sql = `
    SELECT a.id, a.patient_id, a.token_no, a.time, a.status, p.name as patient_name, p.patient_code, u.name as doctor_name, d.department_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE a.date = $1
    ORDER BY a.token_no ASC
  `;

  try {
    const result = await db.query(sql, [today]);
    res.status(200).json({
      success: true,
      queue: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching queue" });
  }
};

const getDoctorQueue = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const user_id = req.user.id;

  try {
    const docRes = await db.query("SELECT id FROM doctors WHERE user_id = $1", [user_id]);
    if (docRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Not assigned as a doctor" });
    }
    const doctor_id = docRes.rows[0].id;

    const sql = `
      SELECT a.id, a.patient_id, a.token_no, a.date, a.time, a.status, p.name as patient_name, p.patient_code, p.dob, p.gender, p.blood_group
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
      ORDER BY a.date ASC, a.token_no ASC
    `;
    const result = await db.query(sql, [doctor_id]);
    
    res.status(200).json({
      success: true,
      queue: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching doctor queue" });
  }
};

const getBookedSlots = async (req, res) => {
  const { doctor_id, date } = req.query;

  if (!doctor_id || !date) {
    return res.status(400).json({ success: false, message: "Doctor ID and date are required" });
  }

  try {
    const sql = `
      SELECT time 
      FROM appointments 
      WHERE doctor_id = $1 AND date = $2 AND status != 'Cancelled'
    `;
    const result = await db.query(sql, [doctor_id, date]);
    
    // Return array of time strings (e.g., ["10:00 AM", "02:30 PM"])
    const bookedSlots = result.rows.map(row => row.time).filter(t => t);
    
    res.status(200).json({
      success: true,
      bookedSlots
    });
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    res.status(500).json({ success: false, message: "Failed to fetch booked slots" });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  updateAdminNotes,
  getQueue,
  getDoctorQueue,
  getBookedSlots
};