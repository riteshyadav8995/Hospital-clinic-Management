const db = require("../db");

const getDashboardSummary = async (req, res) => {
  try {
    const revenueRes = await db.query(`SELECT SUM(amount) as total_revenue FROM payments`);
    const patientsRes = await db.query(`SELECT COUNT(*) as total_patients FROM patients`);
    const appointmentsRes = await db.query(`SELECT COUNT(*) as total_appointments FROM appointments WHERE date = CURRENT_DATE`);
    const dueInvoicesRes = await db.query(`SELECT COUNT(*) as pending_dues FROM invoices WHERE status != 'Paid'`);

    res.json({
      success: true,
      stats: {
        totalRevenue: revenueRes.rows[0].total_revenue || 0,
        totalPatients: patientsRes.rows[0].total_patients || 0,
        todayAppointments: appointmentsRes.rows[0].total_appointments || 0,
        pendingDues: dueInvoicesRes.rows[0].pending_dues || 0
      }
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard summary" });
  }
};

module.exports = {
  getDashboardSummary
};
