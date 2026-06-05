require('dotenv').config();
const pool = require('../config/db');

const hospitals = [
  { name: 'Grand General Hospital' },
  { name: 'City Medical Center' }
];

async function seedHospitals() {
  for (const h of hospitals) {
    await pool.query('INSERT IGNORE INTO hospitals (name) VALUES (?)', [h.name]);
    console.log(`✅ Hospital seeded: ${h.name}`);
  }
  console.log('All hospitals seeded');
  process.exit(0);
}

seedHospitals().catch(err => {
  console.error('❌ Hospital seed failed', err);
  process.exit(1);
});