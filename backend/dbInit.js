const db = require("./db");

const initDatabase = async () => {
  console.log("Initializing PostgreSQL database tables for Hospital ERP...");

  try {
    // 0. WIPE ALL EXISTING TABLES (in reverse dependency order to avoid foreign key conflicts)
    const tablesToDrop = [
      "audit_logs", "stock_batches", "medicines", "payments", "invoices",
      "lab_results", "lab_orders", "prescriptions", "consultations", "appointments",
      "doctors", "patients", "users", "branches", "roles",
      "admissions", "beds", "wards", "notification_logs", "faqs",
      "success_stories", "testimonials", "services", "admins"
    ];

    for (const table of tablesToDrop) {
      await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }

    console.log("Cleared existing tables.");

    // 1. ROLES
    await db.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(100) UNIQUE NOT NULL,
        permissions_json JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. BRANCHES
    await db.query(`
      CREATE TABLE branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        contact VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. USERS (Staff and Patients)
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT REFERENCES roles(id) ON DELETE SET NULL,
        branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. PATIENTS (Demographics)
    await db.query(`
      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        patient_code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        dob DATE NULL,
        gender VARCHAR(50) NULL,
        address TEXT NULL,
        blood_group VARCHAR(10) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. DOCTORS (Linked to users)
    await db.query(`
      CREATE TABLE doctors (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        department_name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        qualification VARCHAR(255) NULL,
        experience VARCHAR(255) NULL,
        available_time VARCHAR(255) NULL,
        image_url VARCHAR(500) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        availability VARCHAR(50) DEFAULT 'Available',
        fee DECIMAL(10,2) DEFAULT 0.00,
        license_no VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. APPOINTMENTS
    await db.query(`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time VARCHAR(50) NOT NULL,
        token_no VARCHAR(50) NULL,
        status VARCHAR(50) DEFAULT 'Booked', -- Booked, Confirmed, Waiting, In-Consultation, Completed, Cancelled, No-Show
        razorpay_order_id VARCHAR(255) NULL,
        consultation_fee DECIMAL(10,2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'Unpaid',
        razorpay_payment_id VARCHAR(255) NULL,
        razorpay_signature VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. CONSULTATIONS (EMR)
    await db.query(`
      CREATE TABLE consultations (
        id SERIAL PRIMARY KEY,
        appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
        vitals JSONB DEFAULT '{}', -- { BP, pulse, temp, weight, height, SpO2 }
        symptoms TEXT NULL,
        diagnosis TEXT NULL,
        notes TEXT NULL,
        follow_up DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. MEDICINES (Pharmacy Master)
    await db.query(`
      CREATE TABLE medicines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255) NULL,
        reorder_level INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. PRESCRIPTIONS
    await db.query(`
      CREATE TABLE prescriptions (
        id SERIAL PRIMARY KEY,
        consultation_id INT REFERENCES consultations(id) ON DELETE CASCADE,
        medicine_id INT REFERENCES medicines(id) ON DELETE SET NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        duration VARCHAR(100) NOT NULL,
        instructions VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. STOCK BATCHES
    await db.query(`
      CREATE TABLE stock_batches (
        id SERIAL PRIMARY KEY,
        medicine_id INT REFERENCES medicines(id) ON DELETE CASCADE,
        batch_no VARCHAR(100) NOT NULL,
        expiry DATE NOT NULL,
        qty INT NOT NULL DEFAULT 0,
        rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. LAB ORDERS
    // Assuming test_id maps to a catalog table, for now we can use test_name or string.
    await db.query(`
      CREATE TABLE lab_orders (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
        test_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Ordered', -- Ordered, Sample Collected, Processing, Report Ready, Delivered
        sample_status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. LAB RESULTS
    await db.query(`
      CREATE TABLE lab_results (
        id SERIAL PRIMARY KEY,
        lab_order_id INT REFERENCES lab_orders(id) ON DELETE CASCADE,
        result_value TEXT NOT NULL,
        normal_range VARCHAR(255) NULL,
        report_file VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. INVOICES
    await db.query(`
      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        invoice_no VARCHAR(100) UNIQUE NOT NULL,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payable DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Partial, Paid, Cancelled, Refunded
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 14. PAYMENTS
    await db.query(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        mode VARCHAR(50) NOT NULL, -- Cash, UPI, Card, Online, Bank Transfer
        reference_no VARCHAR(255) NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 15. AUDIT LOGS
    await db.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) NOT NULL,
        old_value JSONB NULL,
        new_value JSONB NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // --- RETAINED MARKETING & WARD TABLES FOR BACKWARDS COMPATIBILITY ---
    // 16. SERVICES
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        icon_name VARCHAR(100) NOT NULL,
        overview TEXT NOT NULL,
        treatments TEXT NOT NULL,
        when_to_visit TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 17. TESTIMONIALS
    await db.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        treatment VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        feedback TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 18. SUCCESS STORIES
    await db.query(`
      CREATE TABLE IF NOT EXISTS success_stories (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        story TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 19. FAQS
    await db.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        dept VARCHAR(255) NOT NULL,
        q TEXT NOT NULL,
        a TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 20. WARDS
    await db.query(`
      CREATE TABLE IF NOT EXISTS wards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 21. BEDS
    await db.query(`
      CREATE TABLE IF NOT EXISTS beds (
        id SERIAL PRIMARY KEY,
        ward_id INT REFERENCES wards(id) ON DELETE CASCADE,
        bed_number VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 22. ADMISSIONS
    await db.query(`
      CREATE TABLE IF NOT EXISTS admissions (
        id SERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        bed_id INT REFERENCES beds(id) ON DELETE SET NULL,
        doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
        admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discharge_date TIMESTAMP NULL,
        status VARCHAR(50) DEFAULT 'Admitted',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 23. NOTIFICATION LOGS
    await db.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        user_id INT NULL,
        notification_type VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Created all new tables successfully!");

    // SEEDING ESSENTIAL DATA
    // Insert base roles
    await db.query(`
      INSERT INTO roles (role_name, permissions_json) VALUES 
      ('Super Admin', '{"all": true}'),
      ('Owner', '{"strategic": true}'),
      ('Branch Admin', '{"branch_admin": true, "appointments": true, "front_desk": true, "finance": true, "pharmacy": true, "laboratory": true}'),
      ('Doctor', '{"clinical": true}'),
      ('Nurse', '{"clinical_support": true, "clinical": true}'),
      ('Receptionist', '{"front_desk": true, "appointments": true, "finance": true}'),
      ('Lab Technician', '{"laboratory": true}'),
      ('Pharmacist', '{"pharmacy": true}'),
      ('Accountant', '{"finance": true}'),
      ('Patient', '{"patient": true}')
      ON CONFLICT (role_name) DO UPDATE SET permissions_json = EXCLUDED.permissions_json
    `);

    // Insert base branch
    await db.query(`
      INSERT INTO branches (name, address, contact) VALUES 
      ('Main Hospital', '123 Health Ave, City Center', '1800-123-4567')
    `);

    // Insert Super Admin
    // Using bcrypt hash for 'admin123' -> $2b$10$rVDm6KHKTyFR60CLnTdFqeYuLLkhqGpOqii.jW7pfR5PYXDQVjzwS
    const superAdminRole = await db.query("SELECT id FROM roles WHERE role_name = 'Super Admin'");
    const mainBranch = await db.query("SELECT id FROM branches WHERE name = 'Main Hospital'");
    
    await db.query(`
      INSERT INTO users (name, email, phone, password_hash, role_id, branch_id) VALUES 
      ('System Administrator', 'admin@ayurda.com', '0000000000', '$2b$10$rVDm6KHKTyFR60CLnTdFqeYuLLkhqGpOqii.jW7pfR5PYXDQVjzwS', $1, $2)
      ON CONFLICT (email) DO NOTHING
    `, [superAdminRole.rows[0].id, mainBranch.rows[0].id]);

    console.log("Seeded default Super Admin and Master Data!");

  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

module.exports = initDatabase;
