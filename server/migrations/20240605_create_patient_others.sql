-- Create table for additional procedures
CREATE TABLE IF NOT EXISTS patient_others (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  p_procedure VARCHAR(255) NOT NULL,
  fee DECIMAL(10,2) NULL,
  payment_mode ENUM('cash', 'card', 'insurance') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);