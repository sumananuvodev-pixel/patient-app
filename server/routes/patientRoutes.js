const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const patientCtrl = require('../controllers/patientController');
const { authenticateToken } = require('../middleware/auth');
const { setDoctor } = require('../middleware/doctorAuth');

// Protect routes with auth middleware
router.use(authenticateToken);
router.use(setDoctor);
// Get patients with filters
router.get('/patients', patientCtrl.getPatients);

// Create patient
router.post('/patients', patientCtrl.createPatient);

// Get hospitals list (for dropdown)
router.get('/hospitals', patientCtrl.getHospitals);

module.exports = router;