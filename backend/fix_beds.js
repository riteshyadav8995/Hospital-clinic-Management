const db = require("./db");

db.query("UPDATE beds SET status = 'Available'")
  .then(() => console.log("Beds updated to Available"))
  .catch(console.error)
  .finally(() => process.exit());
