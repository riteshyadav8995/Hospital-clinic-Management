# Ayurda Hospital and Clinics

A full-stack hospital and clinic management system built with React, Node.js, Express, and PostgreSQL.

## Features

### Patient Features

* User Registration & Login
* Browse Doctors
* View Services
* Book Appointments
* Receive Email & WhatsApp Notifications
* View FAQs and Testimonials

### Admin Features

* Admin Authentication
* Manage Doctors
* Manage Services
* Manage FAQs
* Manage Testimonials & Success Stories
* View Registered Patients
* Manage Appointments
* Manage Wards & Beds (Track Availability)
* Manage Patient Admissions & Discharges

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* Recharts

### Backend

* Node.js
* Express.js
* PostgreSQL (pg)
* JWT Authentication
* Nodemailer
* Twilio (WhatsApp)
* Razorpay

### Database

* PostgreSQL (Neon)

## Project Structure

```text
hospital_clinic_management/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express + PostgreSQL API
├── README.md
└── package.json       # Root package.json for running both concurrently
```

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd hospital_clinic_management
```

### Install All Dependencies

From the root directory, run:

```bash
npm run install-all
```
*(This will install dependencies in the root, frontend, and backend folders automatically).*

### Environment Variables

Create a `.env` file in the `backend` folder and configure it:

```env
PORT=5001
JWT_SECRET=your_jwt_secret

# Database Configuration (PostgreSQL)
DB_URL=postgresql://neondb_owner:...

# Mail & WhatsApp Configurations
SMTP_USER=
SMTP_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### Run the Application

You can now start both the frontend and backend simultaneously from the root directory:

```bash
npm run dev
```

## Admin Panel

Admin routes are available under:

```text
/admin/login
/admin/dashboard
```

## Author

Raja Kumar
