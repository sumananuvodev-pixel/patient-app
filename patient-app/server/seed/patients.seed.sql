-- ------------------------------------------------------------
--  Seed data for the `patients` table
--  • ties each patient to a doctor that was seeded earlier
--  • uses a couple of different hospitals to test the JOIN
-- ------------------------------------------------------------

INSERT INTO patients (doctor_id, hospital_id, name, dob, gender, contact, created_at)
VALUES
  (1, 1, 'Emily Johnson',   '1985-03-12', 'F', '555-123-4567', DEFAULT),
  (2, 2, 'Michael Chen',    '1972-11-23', 'M', '555-987-6543', DEFAULT),
  (1, 2, 'Sofia Martinez', '1990-07-04', 'F', '555-555-1212', DEFAULT),
  (2, 1, 'Robert Hayes',    '1982-12-19', 'M', '555-222-3333', DEFAULT);

-- Optional: add a few more patients with explicit timestamps for variety
INSERT INTO patients (doctor_id, hospital_id, name, dob, gender, contact, created_at)
VALUES
  (1, 1, 'Laura Whitaker',  '1968-09-14', 'F', '555-444-7777', '2024-01-10 09:15:00'),
  (2, 2, 'Jamal Ahmed',     '1995-05-30', 'M', '555-888-9999', '2024-02-05 14:22:00');