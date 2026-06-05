import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api.jsx';

export default function PatientsPage() {
  const [hospitals, setHospitals] = useState([]);
  // Load hospitals for filter dropdown
  useEffect(() => {
    apiFetch('/hospitals')
      .then(data => setHospitals(data))
      .catch(err => console.error('Failed to load hospitals', err));
  }, []);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ name: '', appointmentStart: '', appointmentEnd: '', hospitalId: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.name) query.append('name', filters.name);
      if (filters.appointmentStart) query.append('appointmentStart', filters.appointmentStart);
      if (filters.appointmentEnd) query.append('appointmentEnd', filters.appointmentEnd);
      if (filters.hospitalId) query.append('hospitalId', filters.hospitalId);
      const endpoint = '/patients' + (query.toString() ? `?${query.toString()}` : '');
      const data = await apiFetch(endpoint);
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const applyFilters = () => {
    fetchPatients();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Patient Name"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <TextField
          label="Appointment From"
          name="appointmentStart"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.appointmentStart || ''}
          onChange={handleFilterChange}
        />
        <TextField
          label="Appointment To"
          name="appointmentEnd"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.appointmentEnd || ''}
          onChange={handleFilterChange}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="hospital-filter-label">Hospital</InputLabel>
          <Select
            labelId="hospital-filter-label"
            label="Hospital"
            name="hospitalId"
            value={filters.hospitalId}
            onChange={handleFilterChange}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {hospitals.map((h) => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={applyFilters}>Apply</Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Patients List
        </Typography>
        <Button component={Link} to="/add-patient" variant="contained" color="primary">
          Add Patient
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Appointment Date</TableCell>
            <TableCell>Appointment Time</TableCell>
            <TableCell>Hospital</TableCell>
            <TableCell>Condition</TableCell>
            <TableCell>Others</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.id}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.appointment_date ? new Date(p.appointment_date).toLocaleDateString() : ''}</TableCell>
              <TableCell>{p.appointment_time ? p.appointment_time : ''}</TableCell>
              <TableCell>{p.hospital_name}</TableCell>
              <TableCell>{p.patient_condition}</TableCell>
              <TableCell>
                {p.others && p.others.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1em' }}>
                    {p.others.map((o, idx) => (
                      <li key={idx}>
                        {o.p_procedure}
                        {o.fee ? ` ($${o.fee})` : ''}
                        {o.paymentMode ? ` – ${o.paymentMode}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <em>—</em>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
