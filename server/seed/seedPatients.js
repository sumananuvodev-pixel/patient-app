// Run this script with: node server/seed/seedPatients.js
require('dotenv').config();
const pool = require('../config/db');

const patients = [
  { doctor_id: 1, hospital_id: 1, name: 'Emily Johnson',  dob: '1985-03-12', gender: 'F', contact: '555-123-4567' },
  { doctor_id: 2, hospital_id: 2, name: 'Michael Chen',   dob: '1972-11-23', gender: 'M', contact: '555-987-6543' },
  { doctor_id: 1, hospital_id: 2, name: 'Sofia Martinez', dob: '1990-07-04', gender: 'F', contact: '555-555-1212' },
  { doctor_id: 2, hospital_id: 1, name: 'Robert Hayes',   dob: '1982-12-19', gender: 'M', contact: '555-222-3333' },
];

async function seed() {
  for (const p of patients) {
    await pool.query(
      'INSERT INTO patients (doctor_id, hospital_id, name, dob, gender, contact) VALUES (?, ?, ?, ?, ?, ?)',
      [p.doctor_id, p.hospital_id, p.name, p.dob, p.gender, p.contact]
    );
    console.log(`✅ Seeded patient: ${p.name}`);
  }
  console.log('All patients seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});