const db = require('./db');
const sql = `
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
  ON CONFLICT (role_name) DO UPDATE SET permissions_json = EXCLUDED.permissions_json;
`;
db.query(sql).then(() => {
  console.log('Roles updated live');
  process.exit(0);
}).catch(console.error);
