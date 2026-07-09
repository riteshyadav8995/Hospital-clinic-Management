# Ayurda Hospital and Clinics

A comprehensive, full-stack hospital and clinic management system built with modern web technologies: React, Node.js, Express, and PostgreSQL. It streamlines patient care, administrative tasks, and clinic operations into a single, fully responsive platform.

## Features

### 🌟 New & Advanced Capabilities
* **Role-Based Access Control (RBAC):** Tailored dashboard experiences and permissions for Super Admins, Doctors, Nurses, Receptionists, Pharmacists, Lab Technicians, and Accountants.
* **Integrated Payments (Razorpay):** Secure, seamless payment processing for appointment fees and billing, including a built-in mock mode for developers.
* **Full Mobile Responsiveness:** The entire application (both public pages and complex admin dashboards) has been meticulously optimized for all devices (mobile, tablet, desktop) using modern CSS Grid/Flexbox and responsive data tables.
* **Real-time Queue Management:** Live tracking of patient flow for doctors and receptionists, shifting patients through statuses (Waiting, In-Consultation, Completed).

### 🏥 Patient Portal
* **User Authentication:** Secure registration, login, and password management.
* **Appointment Booking:** Dynamic date and time slot selection based on doctor availability, with automatic Razorpay checkout integration.
* **Patient Dashboard:** A dedicated space for patients to view upcoming consultations, check past histories, and download Lab Reports (PDFs).
* **AI Symptom Guide & Doctors Directory:** Interactive public pages to help patients find the right care.

### ⚙️ Admin & Staff Operations
* **Advanced Analytics Dashboard:** Real-time metrics on revenue, patient count, today's appointments, and pending dues with interactive Recharts.
* **Admissions & Wards:** Track ward availability, assign beds, and manage patient admissions/discharges efficiently.
* **Pharmacy & Inventory:** Keep track of medicine stock, dispense medicines to patients, and monitor low inventory.
* **Laboratory Management:** Request lab tests from doctor consultations, process results, and generate downloadable reports for patients.
* **Billing & Invoicing:** Centralized ledger for tracking patient expenses (consultations, pharmacy, labs) and collecting payments.
* **Content Management:** Admins can easily manage FAQs, Testimonials, Success Stories, and Service pages dynamically.

## Tech Stack

### Frontend
* **React** (via Vite)
* **Tailwind CSS** (for rapid, responsive styling)
* **Axios** (for API communication)
* **Recharts** (for data visualization)
* **Lucide React** (for modern iconography)

### Backend
* **Node.js & Express.js**
* **PostgreSQL (pg)** (Neon Serverless DB)
* **JWT Authentication** (Access & Refresh tokens)
* **Razorpay** (Payment Gateway Integration)
* **Nodemailer & Twilio** (For Email & WhatsApp notifications)

## Project Structure

```text
hospital_clinic_management/
├── frontend/          # React + Vite application (User & Admin UI)
├── backend/           # Node.js + Express + PostgreSQL API
├── README.md
└── package.json       # Root package.json for running both concurrently
```

## Installation & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd hospital_clinic_management
```

### 2. Install All Dependencies

From the root directory, run:

```bash
npm run install-all
```
*(This will install dependencies in the root, frontend, and backend folders automatically).*

### 3. Environment Variables

Create a `.env` file in the `backend` folder and configure it:

```env
PORT=5001
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Database Configuration (PostgreSQL)
DB_USER=your_db_user
DB_PASSWORD=your_db_pass
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# Mail & WhatsApp Configurations (Optional)
SMTP_USER=your_email
SMTP_PASS=your_password
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### 4. Run the Application

You can start both the frontend and backend simultaneously from the root directory:

```bash
npm run dev
```

## Admin Panel

Admin routes and staff dashboards are accessible under:
* `/admin/login`
* `/admin/dashboard`

*(Dashboard features dynamically adapt based on the assigned role of the logged-in staff member).*

## Author

**Ritesh Kumar**
