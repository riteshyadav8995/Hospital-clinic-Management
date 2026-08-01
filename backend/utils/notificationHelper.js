const axios = require("axios");
const twilio = require("twilio");

// Email Sender Helper using Brevo REST API
const sendEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not configured in .env. Skipping email sending.");
    return false;
  }

  try {
    const payload = {
      sender: {
        name: "Ayurda Clinics",
        email: "no-reply@ayurdaclinics.com" // You can change this to a verified sender if needed
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: htmlContent
    };

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
      }
    });

    console.log(`[Email Flow] Email sent successfully to "${to}". Message ID:`, response.data?.messageId);
    return true;
  } catch (error) {
    console.error(`[Email Flow Error] Failed to send email to "${to}":`, error.response?.data || error.message);
    return false;
  }
};

// WhatsApp Dispatcher Helper
const sendWhatsApp = async (toPhone, messageBody) => {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    console.warn("Twilio WhatsApp API credentials not configured in .env. Skipping WhatsApp message.");
    return false;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Format phone to standard E.164 (ensure country code e.g. +91)
    let formattedPhone = toPhone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`; // Default to India country code
    }

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
      body: messageBody,
    });

    console.log("WhatsApp notification sent successfully:", message.sid);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendWhatsApp,
};
