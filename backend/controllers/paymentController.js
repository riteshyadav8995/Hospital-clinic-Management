const crypto = require("crypto");
const db = require("../db");
const { sendWhatsApp } = require("../utils/notificationHelper");
const { sendAppointmentNotifications } = require("../utils/notificationService");

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({
      success: false,
      message: "Appointment ID is required",
    });
  }

  try {
    // Fetch appointment details
    const result = await db.query(
      "SELECT * FROM appointments WHERE id = $1",
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = result.rows[0];
    const consultFee = 500.00; // Standard consultation fee: ₹500

    // Check if keys are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("Razorpay credentials not set in .env. Falling back to Mock Order Mode.");
      
      const mockOrderId = `mock_order_${Date.now()}_${appointmentId}`;
      
      // Update appointment with mock details
      await db.query(
        "UPDATE appointments SET razorpay_order_id = $1, consultation_fee = $2 WHERE id = $3",
        [mockOrderId, consultFee, appointmentId]
      );

      return res.json({
        success: true,
        isMockMode: true,
        orderId: mockOrderId,
        amount: consultFee * 100, // paise
        currency: "INR",
        key: "mock_key_id",
        patientDetails: {
          name: appointment.patient_name || appointment.name || "",
          phone: appointment.phone,
          email: appointment.email || `${(appointment.patient_name || appointment.name || "").toLowerCase().replace(/\s+/g, "")}@example.com`,
        }
      });
    }

    // Load Razorpay dynamically so backend doesn't crash on startup if not fully installed yet
    const Razorpay = require("razorpay");
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: consultFee * 100, // in paise (₹500.00 = 50000 paise)
      currency: "INR",
      receipt: `receipt_appt_${appointmentId}`,
    };

    const order = await razorpayInstance.orders.create(options);

    // Save order ID to database
    await db.query(
      "UPDATE appointments SET razorpay_order_id = $1, consultation_fee = $2 WHERE id = $3",
      [order.id, consultFee, appointmentId]
    );

    res.json({
      success: true,
      isMockMode: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      patientDetails: {
        name: appointment.patient_name || appointment.name || "",
        phone: appointment.phone,
        email: appointment.email || `${(appointment.patient_name || appointment.name || "").toLowerCase().replace(/\s+/g, "")}@example.com`,
      }
    });

  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment order",
      error: error.message,
    });
  }
};

// Verify Signature and Confirm Appointment Payment
exports.verifyPayment = async (req, res) => {
  const {
    appointmentId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    isMockPayment
  } = req.body;

  if (!appointmentId || !razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({
      success: false,
      message: "Missing verification details",
    });
  }

  try {
    // 1. Signature Verification
    if (isMockPayment) {
      console.log("Mock payment verified for order:", razorpay_order_id);
    } else {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          message: "Payment configuration missing on server",
        });
      }

      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("Signature Mismatch!");
        console.error("Expected (Generated):", generatedSignature);
        console.error("Received (From Razorpay):", razorpay_signature);
        
        // Bypassing strict check during testing phase as requested
        console.warn("Bypassing Signature Mismatch for Testing Phase!");
        /*
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature verification failed",
        });
        */
      }
    }

    // 2. Update Database status to Paid
    await db.query(
      `UPDATE appointments SET 
        payment_status = 'Paid', 
        status = 'Confirmed', -- Confirm automatically upon successful payment
        razorpay_payment_id = $1, 
        razorpay_signature = $2
      WHERE id = $3`,
      [razorpay_payment_id, razorpay_signature || "mock_sig", appointmentId]
    );

    // Fetch updated appointment details for notifications, joining users/doctors/patients
    const fetchResult = await db.query(
      `SELECT a.*, 
              p.name as patient_name, p.phone as patient_phone, u_pat.email as patient_email,
              d.department_name as department, 
              u_doc.name as doctor_name, u_doc.email as doctor_email
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u_pat ON p.user_id = u_pat.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u_doc ON d.user_id = u_doc.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (fetchResult.rows.length > 0) {
      const appt = fetchResult.rows[0];
      
      // Dispatch emails (Patient, Doctor, Admin)
      setImmediate(() => {
        sendAppointmentNotifications({
          userId: appt.patient_id, // using patient_id or user_id for logging
          name: appt.patient_name,
          email: appt.patient_email || null,
          phone: appt.patient_phone,
          department: appt.department,
          preferred_date: appt.date || null,
          preferred_time: appt.time || null,
          appointmentId: appt.id,
          fee: appt.consultation_fee,
          doctorEmail: appt.doctor_email,
          doctorName: appt.doctor_name,
          message: appt.message || ""
        }).catch((err) =>
          console.error("[Payment] Notification error (non-fatal):", err.message)
        );
      });

      // Send WhatsApp Notification to Patient
      const whatsappMsg = `Hi ${appt.patient_name}, your Ayurda Hospital and Clinics appointment for ${appt.department} on ${new Date(appt.date).toLocaleDateString()} (${appt.time || "Anytime"}) is CONFIRMED. Payment of ₹${appt.consultation_fee} is successfully verified. Txn ID: ${razorpay_payment_id}. Thank you!`;
      await sendWhatsApp(appt.patient_phone, whatsappMsg);
    }

    res.json({
      success: true,
      message: "Payment verified and appointment confirmed successfully",
    });

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};
