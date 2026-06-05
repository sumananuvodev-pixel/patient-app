-- Adjust the gender column to accept the new enum values used by the UI
ALTER TABLE patients
  MODIFY COLUMN gender ENUM('male','female','prefer_not_to_say')
    NOT NULL
    DEFAULT 'prefer_not_to_say';