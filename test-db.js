const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });
(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const [rows] = await pool.query('SELECT DATABASE() AS db');
    console.log('Connected! Current DB:', rows[0].db);
    await pool.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
})();