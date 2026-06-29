const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const patientCtrl = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { setDoctor } = require('../middleware/doctorAuth');

// Public routes – no authentication required
router.get('/hospitals', patientCtrl.getHospitals);
router.get('/patients/export', patientCtrl.exportPatientsToExcel);
router.get('/patients/export/:id', patientCtrl.exportPatientToExcel);

// Protect remaining routes with auth middleware
router.use(authenticateToken);
router.use(setDoctor);
// Get patients with filters
router.get('/patients', patientCtrl.getPatients);

// Create patient
router.post('/patients', patientCtrl.createPatient);

module.exports = router;