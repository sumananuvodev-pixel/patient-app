const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
  // Define default credentials (change after first run)
  const username = 'admin';
  const password = 'admin123'; // plain password – will be hashed
  const name = 'Administrator';

  // Check if a doctor with this username already exists
  const [{ length: exists }] = await pool.query('SELECT 1 FROM doctors WHERE username = ?', [username]);
  if (exists) {
    console.log('Default admin doctor already exists – skipping creation');
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO doctors (username, password_hash, name) VALUES (?, ?, ?)', [username, hash, name]);
  console.log(`Created default admin doctor – username: '${username}', password: '${password}'`);
  process.exit(0);
})();
