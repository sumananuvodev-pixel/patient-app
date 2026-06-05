require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/', patientRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Root route – simple health check / welcome page
app.get('/', (req, res) => {
  res.send('Patient Management API – use /auth, /patients, etc.');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});