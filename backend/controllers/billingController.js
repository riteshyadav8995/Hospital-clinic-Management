const db = require("../db");

// --- INVOICES ---
const getInvoices = async (req, res) => {
  try {
    const sql = `
      SELECT i.*, 
             pat.name as patient_name, pat.patient_code
      FROM invoices i
      JOIN patients pat ON i.patient_id = pat.id
      ORDER BY i.created_at DESC
    `;
    const result = await db.query(sql);
    res.json({ success: true, invoices: result.rows });
  } catch (error) {
    console.error("Fetch Invoices Error:", error);
    res.status(500).json({ success: false, message: "Error fetching invoices" });
  }
};

// --- PAYMENTS ---
const recordPayment = async (req, res) => {
  console.log("RECORD PAYMENT CALLED. Body:", req.body);
  const { invoice_id, amount, mode, reference_no } = req.body;

  if (!invoice_id || !amount || !mode) {
    console.log("Missing fields:", { invoice_id, amount, mode });
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Insert payment record
    await client.query(`
      INSERT INTO payments (invoice_id, amount, mode, reference_no)
      VALUES ($1, $2, $3, $4)
    `, [invoice_id, amount, mode, reference_no || null]);

    // Recalculate invoice status
    const paymentSumRes = await client.query(`SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = $1`, [invoice_id]);
    const totalPaid = parseFloat(paymentSumRes.rows[0].total_paid || 0);

    const invoiceRes = await client.query(`SELECT payable FROM invoices WHERE id = $1`, [invoice_id]);
    const payable = parseFloat(invoiceRes.rows[0].payable);

    let newStatus = 'Unpaid';
    if (totalPaid >= payable) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partial';
    }

    await client.query(`UPDATE invoices SET status = $1 WHERE id = $2`, [newStatus, invoice_id]);

    await client.query("COMMIT");

    res.json({ success: true, message: "Payment recorded successfully", newStatus, totalPaid });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Record Payment Error:", error);
    require("fs").writeFileSync("error_log.txt", error.stack || error.message);
    res.status(500).json({ success: false, message: "Error recording payment", error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getInvoices,
  recordPayment
};
