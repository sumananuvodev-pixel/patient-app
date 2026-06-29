const pool = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');
const XLSX = require('xlsx');

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


    

    // Encrypt sensitive fields before storing
    const encryptedContact = contact ? encrypt(contact) : null;
    const encryptedCondition = patient_condition ? encrypt(patient_condition) : null;

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
          encryptedContact,
          appointment_date || null,
          appointment_time || null,
          fees || null,
          payment_mode || null,
          encryptedCondition,
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
 * GET /patients/export - Export all filtered patients to Excel
 * @desc   Generate an Excel file with filtered patient data
 * @route  GET /patients/export
 */
exports.exportPatientsToExcel = async (req, res) => {
  console.log('🔧 exportPatientsToExcel called – doctor ID:', req.doctor?.id, 'query:', req.query);
  try {
    const {
      hospitalId,
      name,
      dobStart,
      dobEnd,
      appointmentStart,
      appointmentEnd
    } = req.query;

    // Build base query with doctor filter
    let query = `
      SELECT
        p.id,
        p.name,
        p.dob,
        p.gender,
        p.hospital_id,
        p.appointment_date,
        p.appointment_time,
        h.name AS hospital_name
      FROM patients p
      JOIN hospitals h ON p.hospital_id = h.id
      WHERE p.doctor_id = ?
    `;
    const params = [req.doctor?.id];

    // Apply optional query filters
    if (hospitalId) { query += ' AND p.hospital_id = ?'; params.push(hospitalId); }
    if (name) { query += ' AND p.name LIKE ?'; params.push(`%${name}%`); }
    if (dobStart) { query += ' AND p.dob >= ?'; params.push(dobStart); }
    if (dobEnd) { query += ' AND p.dob <= ?'; params.push(dobEnd); }
    if (appointmentStart) { query += ' AND DATE(p.appointment_date) >= ?'; params.push(appointmentStart); }
    if (appointmentEnd) { query += ' AND DATE(p.appointment_date) <= ?'; params.push(appointmentEnd); }

    query += ' ORDER BY p.created_at DESC';

    // Retrieve patient rows
    const [patientRows] = await pool.query(query, params);

    // Gather procedures for all returned patients in a single query (if any patients exist)
    let procedures = [];
    if (patientRows.length) {
      const patientIds = patientRows.map(p => p.id);
      const placeholders = patientIds.map(() => '?').join(',');
      const [othersRows] = await pool.query(
        `SELECT patient_id, p_procedure, fee, payment_mode FROM patient_others WHERE patient_id IN (${placeholders})`,
        patientIds
      );
      procedures = othersRows;
    }

    // Transform patient data into a flat array suitable for json_to_sheet
    const patientData = patientRows.map(p => ({
      'Patient ID': p.id,
      'Full Name': p.name,
      'Date of Birth': p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
      'Gender': p.gender || '',
      'Hospital': p.hospital_name || '',
      'Appointment Date': p.appointment_date ? new Date(p.appointment_date).toISOString().split('T')[0] : '',
      'Appointment Time': p.appointment_time || ''
    }));

    // Create the workbook and primary worksheet
    const workbook = XLSX.utils.book_new();
    const patientSheet = XLSX.utils.json_to_sheet(patientData, {
      header: ['Patient ID', 'Full Name', 'Date of Birth', 'Gender', 'Hospital', 'Appointment Date', 'Appointment Time']
    });
    XLSX.utils.book_append_sheet(workbook, patientSheet, 'Patients');

    // If procedures were found, add a second sheet with a simple flat representation
    if (procedures.length) {
      const procData = procedures.map(proc => ({
        'Patient ID': proc.patient_id,
        'Procedure': proc.p_procedure,
        'Fee': proc.fee || '',
        'Payment Mode': proc.payment_mode || ''
      }));
      const procSheet = XLSX.utils.json_to_sheet(procData, {
        header: ['Patient ID', 'Procedure', 'Fee', 'Payment Mode']
      });
      XLSX.utils.book_append_sheet(workbook, procSheet, 'Procedures');
    }

    // Write workbook to a Buffer (standard xlsx, no compression)
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send with proper headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="patients_report.xlsx"');
    res.send(excelBuffer);
  } catch (err) {
    console.error('Error generating Excel report:', err);
    res.status(500).json({ error: 'Error generating Excel file' });
  }
};

/**
 * GET /patients/export/:id - Export a single patient to Excel
 * @desc   Generate an Excel file with data for one patient
 * @route  GET /patients/export/:id
 */
exports.exportPatientToExcel = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Validate patient belongs to doctor
    const [patientRows] = await pool.query(
      `SELECT p.*, h.name AS hospital_name
       FROM patients p
       JOIN hospitals h ON p.hospital_id = h.id
       WHERE p.id = ? AND p.doctor_id = ?`,
      [patientId, req.doctor?.id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({ error: 'Patient not found or not authorized' });
    }

    const patient = patientRows[0];

    // Get patient's procedures
    const [procedures] = await pool.query(
      `SELECT p_procedure, fee, payment_mode
       FROM patient_others
       WHERE patient_id = ?`, [patient.id]
    );

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Patient details data
    const patientData = [{
      'Patient ID': patient.id,
      'Full Name': patient.name,
      'Date of Birth': patient.dob || '',
      'Gender': patient.gender || '',
      'Hospital': patient.hospital_name || '',
      'Contact': patient.contact ? decrypt(patient.contact) : '',
      'Appointment Date': patient.appointment_date ? new Date(patient.appointment_date).toLocaleDateString() : '',
      'Appointment Time': patient.appointment_time || '',
      'Condition': patient.patient_condition ? decrypt(patient.patient_condition) : ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(patientData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Details');

    // Add procedures sheet if they exist
    if (procedures.length > 0) {
      const procData = procedures.map(proc => ({
        'Procedure': proc.p_procedure,
        'Fee': proc.fee || '',
        'Payment Mode': proc.payment_mode || ''
      }));
      const procWorksheet = XLSX.utils.json_to_sheet(procData);
      XLSX.utils.book_append_sheet(workbook, procWorksheet, 'Procedures');
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="patient_${patient.id}_details.xlsx"`);

    // Send the file
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error generating patient Excel report:', error);
    res.status(500).send('Error generating Excel file');
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