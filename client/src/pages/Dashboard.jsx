import { Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patient Record
      </Typography>
      {/* Render nested routes such as PatientsPage or EnterPatient */}
      <Outlet />
    </Box>
  );
}
