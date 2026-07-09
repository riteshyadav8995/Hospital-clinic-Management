const db = require("../db");

// GET ALL FAQS
exports.getFaqs = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM faqs ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching FAQs"
    });
  }
};

// ADD FAQ
exports.addFaq = async (req, res) => {
  try {
    const { dept, q, a } = req.body;

    if (!dept || !q || !a) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await db.query(
      `INSERT INTO faqs (dept, q, a) VALUES ($1, $2, $3)`,
      [dept, q, a]
    );

    res.json({
      success: true,
      message: "FAQ added successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding FAQ"
    });
  }
};

// UPDATE FAQ
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept, q, a } = req.body;

    if (!dept || !q || !a) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const result = await db.query(
      `UPDATE faqs SET 
        dept = $1, 
        q = $2, 
        a = $3
      WHERE id = $4`,
      [dept, q, a, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found"
      });
    }

    res.json({
      success: true,
      message: "FAQ updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating FAQ"
    });
  }
};

// DELETE FAQ
exports.deleteFaq = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM faqs WHERE id = $1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found"
      });
    }

    res.json({
      success: true,
      message: "FAQ deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting FAQ"
    });
  }
};
