const fs = require("fs");
const path = require("path");
const db = require("../db");

// Helper to save base64 image
const saveBase64Image = (base64Str) => {
  if (!base64Str) return null;
  if (!base64Str.startsWith("data:image/")) {
    return base64Str;
  }
  
  try {
    const matches = base64Str.match(/^data:image\/([A-Za-z+-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    
    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, "base64");
    
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const uploadDir = path.join(__dirname, "..", "public", "uploads");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Failed to save base64 image:", error);
    return null;
  }
};

// GET ALL DOCTORS
exports.getDoctors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.name, u.email, u.phone 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error fetching doctors"
    });
  }
};

// ADD DOCTOR
exports.addDoctor = async (req, res) => {
  try {
    const {
      name,
      department,
      qualification,
      experience,
      specialization,
      available_time,
      image,
      email,
      phone,
      password,
      status,
      availability
    } = req.body;

    if (!name || !department || !qualification || !experience || !specialization || !available_time) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const image_url = saveBase64Image(image);

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Fetch Doctor role ID
    const roleRes = await db.query("SELECT id FROM roles WHERE role_name = 'Doctor'");
    const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : null;

    // Fetch Main branch ID
    const branchRes = await db.query("SELECT id FROM branches ORDER BY id ASC LIMIT 1");
    const branchId = branchRes.rows.length > 0 ? branchRes.rows[0].id : null;

    // Insert user
    const userResult = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role_id, branch_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, email, phone || '0000000000', hashedPassword, roleId, branchId, status || "Active"]
    );
    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO doctors
      (user_id, department_name, qualification, experience, specialization, available_time, image_url, status, availability)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        department,
        qualification,
        experience,
        specialization,
        available_time,
        image_url,
        status || "Active",
        availability || "Available"
      ]
    );

    res.json({
      success: true,
      message: "Doctor added successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error adding doctor"
    });
  }
};

// UPDATE DOCTOR
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      department,
      qualification,
      experience,
      specialization,
      available_time,
      image,
      image_url: existing_image_url,
      status,
      availability
    } = req.body;

    if (!name || !department || !qualification || !experience || !specialization || !available_time) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    let finalImageUrl = existing_image_url || null;
    if (image) {
      const savedUrl = saveBase64Image(image);
      if (savedUrl) finalImageUrl = savedUrl;
    }

    // First get the user_id for this doctor
    const docRes = await db.query("SELECT user_id FROM doctors WHERE id = $1", [id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const userId = docRes.rows[0].user_id;

    // Update user name
    await db.query("UPDATE users SET name = $1 WHERE id = $2", [name, userId]);

    const result = await db.query(
      `UPDATE doctors SET 
        department_name = $1, 
        qualification = $2, 
        experience = $3, 
        specialization = $4, 
        available_time = $5, 
        image_url = $6, 
        status = $7,
        availability = $8
      WHERE id = $9`,
      [
        department,
        qualification,
        experience,
        specialization,
        available_time,
        finalImageUrl,
        status || "Active",
        availability || "Available",
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      message: "Doctor updated successfully"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error updating doctor"
    });
  }
};

// DELETE DOCTOR
exports.deleteDoctor = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM doctors WHERE id=$1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      message: "Doctor deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting doctor"
    });
  }
};

// GET DEPARTMENTS (Derived from distinct departments in doctors table)
exports.getDepartments = async (req, res) => {
  try {
    const result = await db.query("SELECT DISTINCT department_name as department FROM doctors WHERE status = 'Active'");
    res.json({ success: true, departments: result.rows.map(r => r.department) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching departments" });
  }
};

module.exports = {
  getDoctors: exports.getDoctors,
  addDoctor: exports.addDoctor,
  updateDoctor: exports.updateDoctor,
  deleteDoctor: exports.deleteDoctor,
  getDepartments: exports.getDepartments
};