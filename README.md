# Hospital & Clinic Management System

A full-stack healthcare operations platform designed to manage patient journeys, appointments, staff workflows, billing, pharmacy, laboratory processes, admissions, and real-time queues from one system.

## What this project demonstrates

- Role-based enterprise application design
- Healthcare workflow automation
- Secure authentication and access control
- Payment and billing integration
- Real-time operational tracking
- Responsive dashboards for multiple user roles

## Key Features

### Role-Based Access Control
Dedicated permissions and dashboards for:

- Super Admins
- Doctors
- Nurses
- Receptionists
- Pharmacists
- Lab Technicians
- Accountants
- Patients

### Patient Experience
- Registration, login, and password management
- Doctor discovery and appointment booking
- Dynamic date and time-slot selection
- Razorpay-powered appointment payments
- Patient dashboard for consultations and history
- Downloadable laboratory reports
- AI symptom guide and doctor directory

### Clinical & Operational Workflows
- Real-time patient queue management
- Appointment status tracking from waiting to consultation completion
- Admissions, ward availability, and bed allocation
- Pharmacy inventory and medicine dispensing
- Laboratory test requests, processing, and report generation
- Centralized billing and payment tracking

### Administration
- Analytics dashboard with revenue, patient, appointment, and dues metrics
- Dynamic content management for FAQs, testimonials, success stories, and service pages
- Responsive layouts optimized for mobile, tablet, and desktop

### Notifications & Payments
- Razorpay integration for online payments
- Email notifications through Nodemailer
- Twilio-powered communication support

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Axios, Recharts, Lucide React  
**Backend:** Node.js, Express.js  
**Database:** PostgreSQL / Neon  
**Authentication:** JWT access and refresh tokens  
**Integrations:** Razorpay, Nodemailer, Twilio

## Project Structure

```text
hospital_clinic_management/
├── frontend/      # Patient and staff interfaces
├── backend/       # APIs, authentication, workflows and integrations
├── README.md
└── package.json
```

## Getting Started

### Clone

```bash
git clone https://github.com/riteshyadav8995/Hospital-clinic-Management.git
cd Hospital-clinic-Management
```

### Install dependencies

```bash
npm run install-all
```

### Environment Configuration

Create `backend/.env` and configure values such as:

```env
PORT=5001
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

SMTP_USER=your_email
SMTP_PASS=your_password

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

Never commit real credentials or production secrets to the repository.

### Run

```bash
npm run dev
```

## Admin Access

Administrative interfaces are available under routes such as:

```text
/admin/login
/admin/dashboard
```

The dashboard adapts to the authenticated staff member's role and permissions.

## Portfolio Highlights

This project showcases experience relevant to freelance work involving:

- Admin and staff dashboards
- Role-Based Access Control
- Appointment systems
- Payment gateway integration
- Complex database-backed workflows
- Healthcare or service-management applications
- REST API development

## Author

**Ritesh Kumar**  
Full-Stack Developer — React.js, Node.js, PostgreSQL, MongoDB and AI integrations
