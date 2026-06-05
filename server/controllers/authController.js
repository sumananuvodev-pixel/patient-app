const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/**
 * Register a new doctor (optional utility – usually done via seed or admin UI)
 */
exports.register = async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO doctors (username, password_hash, name) VALUES (?, ?, ?)',
      [username, hashed, name]
    );
    res.status(201).json({ id: result.insertId, username, name });
  } catch (err) {
    res.status(409).json({ error: 'Username already exists' });
  }
};

/**
 * Login: issue a JWT
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, password_hash, name FROM doctors WHERE username = ?',
      [username]
    );
    const doctor = rows[0];
    if (!doctor) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, doctor.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // No JWT is created – simply return the doctor ID and name.
    res.json({ doctorId: doctor.id, name: doctor.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
};