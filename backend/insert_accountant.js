const db = require("./db");

const run = async () => {
  try {
    await db.query(`
      INSERT INTO roles (role_name, permissions_json) VALUES 
      ('Accountant', '{"finance": true}')
      ON CONFLICT (role_name) DO NOTHING
    `);
    console.log("Accountant Role Created");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

run();
