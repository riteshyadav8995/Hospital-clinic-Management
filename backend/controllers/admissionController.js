const db = require("../db");

// GET ALL ADMISSIONS
exports.getAdmissions = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, b.bed_number, w.name as ward_name, u.name as doctor_name
      FROM admissions a
      LEFT JOIN beds b ON a.bed_id = b.id
      LEFT JOIN wards w ON b.ward_id = w.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY a.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching admissions" });
  }
};

// ADD ADMISSION
exports.addAdmission = async (req, res) => {
  try {
    const { patient_name, phone, bed_id, doctor_id, notes } = req.body;
    if (!patient_name || !phone || !bed_id) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    
    // Update bed status
    await db.query("UPDATE beds SET status = 'Occupied' WHERE id = $1", [bed_id]);
    
    // Insert admission
    await db.query(
      "INSERT INTO admissions (patient_name, phone, bed_id, doctor_id, notes) VALUES ($1, $2, $3, $4, $5)",
      [patient_name, phone, bed_id, doctor_id || null, notes || null]
    );
    
    res.json({ success: true, message: "Patient admitted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding admission" });
  }
};

// DISCHARGE PATIENT
exports.dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get admission details
    const result = await db.query("SELECT bed_id FROM admissions WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Admission not found" });
    }
    
    const bedId = result.rows[0].bed_id;
    
    // Update admission
    await db.query("UPDATE admissions SET status = 'Discharged', discharge_date = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    
    // Free the bed
    if (bedId) {
      await db.query("UPDATE beds SET status = 'Available' WHERE id = $1", [bedId]);
    }
    
    res.json({ success: true, message: "Patient discharged" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error discharging patient" });
  }
};
