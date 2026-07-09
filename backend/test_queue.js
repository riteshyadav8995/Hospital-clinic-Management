const db = require("./db");

async function run() {
  try {
    const res = await db.query(`
      SELECT a.id, a.token_no, a.time, a.status, p.name as patient_name, p.patient_code, p.dob, p.gender, p.blood_group, a.date
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.date >= $1 AND a.doctor_id = $2
      ORDER BY a.date ASC, a.token_no ASC
    `, ['2026-07-07', 1]);
    
    console.log("Queue rows:", res.rows);
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    process.exit(0);
  }
}

run();
