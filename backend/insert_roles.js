const db = require("./db");

const run = async () => {
  try {
    await db.query(`
      INSERT INTO roles (role_name, permissions_json) VALUES 
      ('Pharmacist', '{"pharmacy": true}'),
      ('Lab Technician', '{"laboratory": true}')
      ON CONFLICT (role_name) DO NOTHING
    `);
    console.log("Roles Created");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

run();
