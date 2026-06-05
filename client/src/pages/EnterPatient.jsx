import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, FormControl, InputLabel, Select, MenuItem, IconButton, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material/';
import { apiFetch } from '../services/api.jsx';
import { useNavigate } from 'react-router-dom';

export default function EnterPatient() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    hospital_id: '',
    dob: '',
    contact: '',
    patient_condition: '',
    appointment_date: '',
    /** new field – time part (HH:MM) */
    appointment_time: '',
    fees: '',
    payment_mode: '',
    others: [], // extra procedures array
  });
  const [hospitals, setHospitals] = useState([]);

  // State for extra procedures (others)
  const [otherProcedures, setOtherProcedures] = useState([]);

  // Add a new empty other-procedure row
  const addOtherProcedure = () => {
    setOtherProcedures(prev => [...prev, { id: Date.now(), p_procedure: '', fee: '', paymentMode: '' }]);
  };

  // Remove an other-procedure row
  const removeOtherProcedure = (id) => {
    setOtherProcedures(prev => prev.filter(item => item.id !== id));
  };

  // Update a field inside an other-procedure row
  const handleOtherProcedureChange = (id, field, value) => {
    setOtherProcedures(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Load hospitals for dropdown
  useEffect(() => {
    apiFetch('/hospitals')
      .then(data => setHospitals(data))
      .catch(err => console.error('Failed to load hospitals', err));
  }, []);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const renderOtherProcedure = (proc) => (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        size="small"
        label="other"
        value={proc.p_procedure}
        onChange={(e) => handleOtherProcedureChange(proc.id, 'p_procedure', e.target.value)}
        required
      />
      <TextField
        size="small"
        label="Fee"
        type="number"
        value={proc.fee}
        onChange={(e) => handleOtherProcedureChange(proc.id, 'fee', e.target.value)}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Payment</InputLabel>
        <Select
          value={proc.paymentMode}
          onChange={(e) => handleOtherProcedureChange(proc.id, 'paymentMode', e.target.value)}
          label="Payment"
        >
          <MenuItem value="cash">Cash</MenuItem>
          <MenuItem value="card">Card</MenuItem>
          <MenuItem value="insurance">Insurance</MenuItem>
        </Select>
      </FormControl>
      <IconButton
        size="small"
        sx={{ p: 0 }}
        onClick={() => removeOtherProcedure(proc.id)}
        title="Remove"
      >
        <RemoveIcon />
      </IconButton>
    </Box>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/patients', {
        method: 'POST',
        body: {
          ...form,
          others: otherProcedures.map(p => ({
            p_procedure: p.p_procedure,
            fee: Number(p.fee) || null,
            paymentMode: p.paymentMode,
          })),
        }
      });
      setSuccess(true);
      // Redirect back to patients list after a short delay
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to add patient');
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Add New Patient
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Patient added successfully!</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField label="Name" name="name" fullWidth margin="normal" value={form.name} onChange={handleChange} required />
        <TextField label="Age" name="age" type="number" fullWidth margin="normal" value={form.age} onChange={handleChange} required />
       <TextField
    label="Date of Birth"
    name="dob"
    type="date"
    fullWidth
    margin="normal"
    InputLabelProps={{ shrink: true }}
    value={form.dob}
    onChange={handleChange}
    required
  />
        <FormControl component="fieldset" margin="normal" required>
  <Typography variant="subtitle2" gutterBottom>Gender</Typography>
  <RadioGroup
    row
    name="gender"
    value={form.gender}
    onChange={handleChange}
  >
    <FormControlLabel value="M" control={<Radio />} label="Male" />
    <FormControlLabel value="F" control={<Radio />} label="Female" />
    <FormControlLabel value="prefer_not_to_say" control={<Radio />} label="Prefer not to say" />
  </RadioGroup>
</FormControl>
        <FormControl fullWidth margin="normal" required>
                <InputLabel id="hospital-select-label">Hospital</InputLabel>
                <Select
                  labelId="hospital-select-label"
                  label="Hospital"
                  name="hospital_id"
                  value={form.hospital_id}
                  onChange={handleChange}
                >
                  {hospitals.map((h) => (
                    <MenuItem key={h.id} value={h.id}>
                      {h.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
        <TextField label="Condition" name="patient_condition" fullWidth margin="normal" value={form.patient_condition} onChange={handleChange} />
            <TextField label="Contact" name="contact" fullWidth margin="normal" value={form.contact || ''} onChange={handleChange} />
       {/* Appointment Date */}
<TextField
  label="Appointment Date"
  name="appointment_date"
  type="date"
  fullWidth
  margin="normal"
  InputLabelProps={{ shrink: true }}
  value={form.appointment_date}
  onChange={handleChange}
  required
/>

{/* Appointment Time */}
<TextField
  label="Appointment Time"
  name="appointment_time"
  type="time"
  fullWidth
  margin="normal"
  InputLabelProps={{ shrink: true }}
  value={form.appointment_time}
  onChange={handleChange}
  required
/>
            <TextField label="Fees" name="fees" type="number" fullWidth margin="normal" value={form.fees} onChange={handleChange} />
            <FormControl fullWidth margin="normal">
              <InputLabel id="payment-mode-label">Payment Mode</InputLabel>
              <Select
                labelId="payment-mode-label"
                label="Payment Mode"
                name="payment_mode"
                value={form.payment_mode}
                onChange={handleChange}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
              </Select>
            </FormControl>

            {/* ==== NEW: Other Procedures ==== */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Other Treatment/Procedures
                <IconButton size="small" onClick={addOtherProcedure} title="Add treatment/procedure" sx={{ ml: 1 }}>
                  <AddIcon />
                </IconButton>
              </Typography>
              {otherProcedures.map(renderOtherProcedure)}
            </Box>

        

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Save
        </Button>
      </form>
    </Box>
  );
}
