-- Add missing UI columns to the events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
