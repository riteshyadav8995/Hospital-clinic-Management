const db = require("../db");

// --- MEDICINES ---
const getMedicines = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM medicines ORDER BY name ASC");
    res.json({ success: true, medicines: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching medicines" });
  }
};

const addMedicine = async (req, res) => {
  const { name, generic_name, reorder_level } = req.body;
  if (!name || !generic_name) {
    return res.status(400).json({ success: false, message: "Name and Generic Name are required" });
  }
  try {
    const result = await db.query(
      "INSERT INTO medicines (name, generic_name, reorder_level) VALUES ($1, $2, $3) RETURNING *",
      [name, generic_name, reorder_level || 10]
    );
    res.json({ success: true, message: "Medicine added", medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding medicine" });
  }
};

const addStock = async (req, res) => {
  const { medicine_id, batch_no, expiry, qty, rate } = req.body;
  if (!medicine_id || !batch_no || !qty) {
    return res.status(400).json({ success: false, message: "Missing required stock fields" });
  }
  try {
    await db.query(
      "INSERT INTO stock_batches (medicine_id, batch_no, expiry, qty, rate) VALUES ($1, $2, $3, $4, $5)",
      [medicine_id, batch_no, expiry, qty, rate || 0]
    );
    res.json({ success: true, message: "Stock added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding stock" });
  }
};

// --- PRESCRIPTIONS ---
const getPrescriptions = async (req, res) => {
  try {
    const sql = `
      SELECT p.id as prescription_id, p.dosage, p.frequency, p.duration, p.instructions,
             m.name as medicine_name,
             c.id as consultation_id, c.created_at as consultation_date,
             a.id as appointment_id, a.token_no,
             pat.name as patient_name, pat.patient_code,
             doc.department_name as doctor_department,
             u.name as doctor_name
      FROM prescriptions p
      JOIN medicines m ON p.medicine_id = m.id
      JOIN consultations c ON p.consultation_id = c.id
      JOIN appointments a ON c.appointment_id = a.id
      JOIN patients pat ON a.patient_id = pat.id
      JOIN doctors doc ON a.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(sql);
    
    // Group by consultation
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.consultation_id]) {
        grouped[row.consultation_id] = {
          consultation_id: row.consultation_id,
          consultation_date: row.consultation_date,
          token_no: row.token_no,
          patient_name: row.patient_name,
          patient_code: row.patient_code,
          doctor_name: row.doctor_name,
          doctor_department: row.doctor_department,
          prescriptions: []
        };
      }
      grouped[row.consultation_id].prescriptions.push({
        prescription_id: row.prescription_id,
        medicine_name: row.medicine_name,
        dosage: row.dosage,
        frequency: row.frequency,
        duration: row.duration,
        instructions: row.instructions
      });
    });

    res.json({ success: true, orders: Object.values(grouped) });
  } catch (error) {
    console.error("Fetch Prescriptions Error:", error);
    res.status(500).json({ success: false, message: "Error fetching prescriptions" });
  }
};

// For a simple mock fulfillment
const fulfillPrescription = async (req, res) => {
  const { prescription_ids } = req.body;
  // In a real system, you would check stock_batches, deduct qty, and generate an invoice.
  // For now, we will just delete the prescriptions to mark them "fulfilled" and remove from the queue.
  try {
    if (!prescription_ids || prescription_ids.length === 0) {
      return res.status(400).json({ success: false, message: "No prescriptions selected." });
    }
    
    // Instead of deleting, let's just delete them from the queue for simplicity in this ERP module
    const placeholders = prescription_ids.map((_, i) => `$${i+1}`).join(",");
    await db.query(`DELETE FROM prescriptions WHERE id IN (${placeholders})`, prescription_ids);

    res.json({ success: true, message: "Prescriptions fulfilled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fulfilling prescriptions" });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  addStock,
  getPrescriptions,
  fulfillPrescription
};
