require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Password used for demo accounts – you can change it later
const demoPassword = 'password123';

async function seedDoctors() {
  const hash = await bcrypt.hash(demoPassword, 10);
  const doctors = [
    { username: 'dr_smith', name: 'Dr. John Smith', password_hash: hash },
    { username: 'dr_jones', name: 'Dr. Alice Jones', password_hash: hash }
  ];

  for (const d of doctors) {
    // INSERT IGNORE prevents duplicate‑key errors if you run the script again
    await pool.query(
      'INSERT IGNORE INTO doctors (username, password_hash, name) VALUES (?, ?, ?)',
      [d.username, d.password_hash, d.name]
    );
    console.log(`✅ Seeded doctor: ${d.username}`);
  }
  console.log('All doctors seeded');
  process.exit(0);
}

seedDoctors().catch(err => {
  console.error('❌ Doctor seed failed', err);
  process.exit(1);
});