const axios = require("axios");
const twilio = require("twilio");

// Email Sender Helper using Brevo REST API
const sendEmail = async (to, subject, htmlContent) => {
  try {
    let apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SENDER_EMAIL;

    if (!apiKey && process.env.BREVO_MCP_API_KEY) {
      try {
        const decoded = Buffer.from(process.env.BREVO_MCP_API_KEY, 'base64').toString();
        apiKey = JSON.parse(decoded).api_key;
      } catch (e) {
        console.error('Failed to parse BREVO_MCP_API_KEY', e);
      }
    }

    if (!apiKey) {
      console.warn("BREVO_API_KEY not configured in .env. Skipping email sending.");
      return false;
    }

    const payload = {
      sender: {
        name: process.env.EMAIL_FROM_NAME || "Ayurda Clinics",
        email: fromEmail || "ritesh.kumar@nxtwave.co.in"
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: htmlContent
    };

    console.log(`[Email Debug] Attempting to send email via Brevo...`);
    console.log(`[Email Debug] FROM: ${payload.sender.email}`);
    console.log(`[Email Debug] TO: ${payload.to[0].email}`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[Email Flow Error] Brevo API error: ${response.status} ${errorData}`);
      return false;
    }

    const data = await response.json();
    console.log(`[Email Flow] Email sent successfully to "${to}". Message ID:`, data.messageId || 'Success');
    return true;
  } catch (error) {
    console.error(`[Email Flow Error] Failed to send email to "${to}":`, error.message);
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
