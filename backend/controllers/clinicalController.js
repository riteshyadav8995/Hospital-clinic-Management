const db = require("../db");

// Submit a consultation (Diagnosis, Notes, Prescriptions, Lab Orders)
const submitConsultation = async (req, res) => {
  const { appointment_id, vitals, symptoms, diagnosis, notes, follow_up, prescriptions, lab_orders } = req.body;
  const user_id = req.user.id;

  try {
    // 1. Verify the doctor owns this appointment
    const docRes = await db.query("SELECT id FROM doctors WHERE user_id = $1", [user_id]);
    if (docRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Only doctors can submit consultations." });
    }
    const doctor_id = docRes.rows[0].id;

    const apptRes = await db.query("SELECT patient_id, doctor_id FROM appointments WHERE id = $1", [appointment_id]);
    if (apptRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }
    
    if (apptRes.rows[0].doctor_id !== doctor_id) {
      return res.status(403).json({ success: false, message: "You are not assigned to this appointment." });
    }

    const patient_id = apptRes.rows[0].patient_id;

    await db.query("BEGIN"); // Start transaction

    // 2. Insert Consultation
    const consultRes = await db.query(`
      INSERT INTO consultations (appointment_id, vitals, symptoms, diagnosis, notes, follow_up)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [appointment_id, vitals || '{}', symptoms, diagnosis, notes, follow_up || null]);

    const consultation_id = consultRes.rows[0].id;

    // 3. Insert Prescriptions
    if (prescriptions && prescriptions.length > 0) {
      for (let p of prescriptions) {
        // If medicine_id is not provided, we can either insert it into medicines or leave it null. 
        // For simplicity we will assume it's free-text medicine names for now if medicine_id is missing.
        // If the user wants a dropdown later, we can map it to medicine_id.
        // Wait, the schema requires medicine_id INT. We should create the medicine if it doesn't exist to get the ID.
        let medId = p.medicine_id;
        if (!medId && p.medicine_name) {
          const checkMed = await db.query("SELECT id FROM medicines WHERE name ILIKE $1", [p.medicine_name]);
          if (checkMed.rows.length > 0) {
            medId = checkMed.rows[0].id;
          } else {
            const newMed = await db.query("INSERT INTO medicines (name) VALUES ($1) RETURNING id", [p.medicine_name]);
            medId = newMed.rows[0].id;
          }
        }

        await db.query(`
          INSERT INTO prescriptions (consultation_id, medicine_id, dosage, frequency, duration, instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [consultation_id, medId, p.dosage, p.frequency, p.duration, p.instructions]);
      }
    }

    // 4. Insert Lab Orders
    if (lab_orders && lab_orders.length > 0) {
      for (let test_name of lab_orders) {
        await db.query(`
          INSERT INTO lab_orders (patient_id, doctor_id, test_name)
          VALUES ($1, $2, $3)
        `, [patient_id, doctor_id, test_name]);
      }
    }

    // 5. Update appointment status to Completed
    await db.query("UPDATE appointments SET status = 'Completed' WHERE id = $1", [appointment_id]);

    await db.query("COMMIT");

    res.status(201).json({ success: true, message: "Consultation submitted successfully.", consultation_id });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Submit Consultation Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getPatientLabs = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT l.id, l.test_name, l.status, l.created_at, 
             r.result_value, r.normal_range, d.department_name as department, u.name as doctor_name
      FROM lab_orders l
      LEFT JOIN lab_results r ON l.id = r.lab_order_id
      LEFT JOIN doctors d ON l.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE l.patient_id = $1
      ORDER BY l.created_at DESC
    `, [id]);

    res.json({
      success: true,
      labs: result.rows,
    });
  } catch (error) {
    console.error("Fetch patient labs error:", error);
    res.status(500).json({ success: false, message: "Error fetching patient lab reports" });
  }
};

module.exports = {
  submitConsultation,
  getPatientLabs
};
