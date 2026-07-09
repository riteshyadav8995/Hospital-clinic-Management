const db = require("../db");

// --- LAB ORDERS ---
const getLabOrders = async (req, res) => {
  try {
    const sql = `
      SELECT l.id, l.test_name, l.status, l.sample_status, l.created_at,
             pat.name as patient_name, pat.patient_code,
             u.name as doctor_name, doc.department_name as department,
             r.result_value, r.normal_range
      FROM lab_orders l
      JOIN patients pat ON l.patient_id = pat.id
      JOIN doctors doc ON l.doctor_id = doc.id
      JOIN users u ON doc.user_id = u.id
      LEFT JOIN lab_results r ON l.id = r.lab_order_id
      ORDER BY l.created_at DESC
    `;
    const result = await db.query(sql);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error("Fetch Lab Orders Error:", error);
    res.status(500).json({ success: false, message: "Error fetching lab orders" });
  }
};

const updateLabOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, sample_status } = req.body;
  try {
    await db.query(`
      UPDATE lab_orders 
      SET status = COALESCE($1, status), sample_status = COALESCE($2, sample_status)
      WHERE id = $3
    `, [status, sample_status, id]);
    res.json({ success: true, message: "Status updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

const enterLabResults = async (req, res) => {
  const { id } = req.params;
  const { result_value, normal_range } = req.body;
  
  try {
    await db.query("BEGIN");
    
    // Insert the result
    await db.query(`
      INSERT INTO lab_results (lab_order_id, result_value, normal_range)
      VALUES ($1, $2, $3)
    `, [id, result_value, normal_range]);

    // Update order status to 'Report Ready'
    await db.query(`UPDATE lab_orders SET status = 'Report Ready' WHERE id = $1`, [id]);

    await db.query("COMMIT");
    res.json({ success: true, message: "Results saved successfully." });
  } catch (error) {
    await db.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Error saving results" });
  }
};

module.exports = {
  getLabOrders,
  updateLabOrderStatus,
  enterLabResults
};
