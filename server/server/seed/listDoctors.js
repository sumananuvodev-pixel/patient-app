require('dotenv').config();
const pool = require('../config/db');

(async () => {
  const [rows] = await pool.query('SELECT id, username, name FROM doctors');
  console.log('Doctors in DB:');
  rows.forEach(r => console.log(`- id:${r.id} username:${r.username} name:${r.name}`));
  process.exit(0);
})();