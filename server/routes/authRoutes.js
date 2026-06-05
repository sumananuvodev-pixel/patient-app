const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/login', (req, res) => {
  // Inform clients that POST should be used for login
  res.status(405).json({ error: 'Method not allowed. Use POST to /auth/login for authentication.' });
});

module.exports = router;