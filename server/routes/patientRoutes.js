const express = require('express');
const router = express.Router();

const patientCtrl = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { setDoctor } = require('../middleware/doctorAuth');

// PUBLIC
router.get('/hospitals', patientCtrl.getHospitals);

// PROTECTED
router.use(authenticateToken);
router.use(setDoctor);

router.get('/patients', patientCtrl.getPatients);
router.post('/patients', patientCtrl.createPatient);
router.get('/patients/export', patientCtrl.exportPatientsToExcel);
router.get('/patients/export/:id', patientCtrl.exportPatientToExcel);

module.exports = router;