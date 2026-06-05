const pool = require('../config/db');

/**
 * GET /patients?hospitalId=&gender=&startDate=&endDate=
 * Returns patients for the logged-in doctor (doctor_id from JWT)
 */
exports.getPatients = async (req, res) => {
  // Extract filter query parameters and ensure a valid doctor id
  let doctorId;
  if (req.doctor?.id) {
    doctorId = req.doctor.id;
  } else if (req.query.doctor_id) {
    doctorId = req.query.doctor_id;
  } else {
    return res.status(400).json({ error: 'Doctor id missing – ensure you are logged in' });
  }
  const { name, hospitalId, appointmentDate, appointmentStart, appointmentEnd, gender, startDate, endDate } = req.query;

  let query = `
    SELECT p.*, h.name AS hospital_name
    FROM patients p
    JOIN hospitals h ON p.hospital_id = h.id
    WHERE p.doctor_id = ?
  `;
  const params = [doctorId];

  if (hospitalId) {
    query += ' AND p.hospital_id = ?';
    params.push(hospitalId);
  }
  if (name) {
    query += ' AND p.name LIKE ?';
    params.push(`%${name}%`);
  }
  if (gender) {
    query += ' AND p.gender = ?';
    params.push(gender);
  }
  if (startDate) {
    query += ' AND p.dob >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND p.dob <= ?';
    params.push(endDate);
  }
  if (appointmentDate) {
    query += ' AND DATE(p.appointment_date) = ?';
    params.push(appointmentDate);
  }
  // Date range filter for appointment_date
  if (appointmentStart) {
    query += ' AND DATE(p.appointment_date) >= ?';
    params.push(appointmentStart);
  }
  if (appointmentEnd) {
    query += ' AND DATE(p.appointment_date) <= ?';
    params.push(appointmentEnd);
  }

  query += ' ORDER BY p.created_at DESC';

  try {
    const [patientRows] = await pool.query(query, params);
    const patients = patientRows;

    // -----------------------------------------------------------
    // Fetch additional procedures (patient_others) for the loaded patients
    // -----------------------------------------------------------
    if (patients.length) {
      const patientIds = patients.map(p => p.id);
      const placeholders = patientIds.map(() => '?').join(',');
      const [othersRows] = await pool.query(
        `SELECT patient_id, p_procedure, fee, payment_mode
         FROM patient_others
         WHERE patient_id IN (${placeholders})`,
        patientIds
      );

      const othersMap = new Map();
      othersRows.forEach(row => {
        if (!othersMap.has(row.patient_id)) {
          othersMap.set(row.patient_id, []);
        }
        othersMap.get(row.patient_id).push({
          p_procedure: row.p_procedure,
          fee: row.fee,
          paymentMode: row.payment_mode,
        });
      });

      patients.forEach(p => {
        p.others = othersMap.get(p.id) || [];
      });
    }

    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * POST /patients
 * Body: { name, dob, gender, hospital_id, contact }
 */
exports.createPatient = async (req, res) => {
    // ----> doctor must be present (set by doctorAuth middleware)
    if (!req.doctor?.id) {
      return res
        .status(400)
        .json({ error: 'Doctor id missing – you must be logged in' });
    }
    const doctorId = req.doctor.id;

    const {
      name,
      dob,
      gender,
      hospital_id,
      contact,
      appointment_date,
      appointment_time,
      fees,
      payment_mode,
      patient_condition,
      others,
    } = req.body;

    // Validate required fields
    if (!name || !dob || !gender || !hospital_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

   

    try {
      const [result] = await pool.query(
        `INSERT INTO patients
         (doctor_id, hospital_id, name, dob, gender, contact,
          appointment_date, appointment_time, fees, payment_mode, patient_condition)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doctorId,
          hospital_id,
          name,
          dob,
          gender,
          contact || null,
          appointment_date || null,
          appointment_time || null,
          fees || null,
          payment_mode || null,
          patient_condition  || null,
        ]
      );

    const [newPatientRows] = await pool.query(
      `SELECT p.*, h.name AS hospital_name
       FROM patients p
       JOIN hospitals h ON p.hospital_id = h.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    const newPatient = newPatientRows[0];

    // Insert additional procedures if provided. Skip entries with an empty procedure name.
    if (Array.isArray(others) && others.length > 0) {
      // Filter out rows where the procedure field is empty or only whitespace
      const filtered = others.filter(o => o.p_procedure && o.p_procedure.trim() !== '');

      if (filtered.length > 0) {
        const otherValues = filtered.map(o => [
          result.insertId,
          o.p_procedure,
          o.fee || null,
          o.paymentMode || null,
        ]);

        await pool.query(
          `INSERT INTO patient_others (patient_id, p_procedure, fee, payment_mode)
           VALUES ?`,
          [otherValues]
        );
      }
    }

    res.status(201).json(newPatient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * GET /hospitals
 * Simple lookup for dropdowns
 */
exports.getHospitals = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM hospitals ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
};