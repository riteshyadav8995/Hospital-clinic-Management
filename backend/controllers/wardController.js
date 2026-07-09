const db = require("../db");

// GET ALL WARDS
exports.getWards = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM wards ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching wards" });
  }
};

// ADD WARD
exports.addWard = async (req, res) => {
  try {
    const { name, type, capacity } = req.body;
    if (!name || !type || !capacity) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    await db.query("INSERT INTO wards (name, type, capacity) VALUES ($1, $2, $3)", [name, type, capacity]);
    res.json({ success: true, message: "Ward added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding ward" });
  }
};

// GET ALL BEDS
exports.getBeds = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, w.name as ward_name, w.type as ward_type 
      FROM beds b 
      JOIN wards w ON b.ward_id = w.id 
      ORDER BY b.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching beds" });
  }
};

// ADD BED
exports.addBed = async (req, res) => {
  try {
    const { ward_id, bed_number, status } = req.body;
    if (!ward_id || !bed_number) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    await db.query("INSERT INTO beds (ward_id, bed_number, status) VALUES ($1, $2, $3)", [ward_id, bed_number, status || 'Available']);
    res.json({ success: true, message: "Bed added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding bed" });
  }
};
