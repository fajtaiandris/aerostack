-- Migration number: 0003 	 2026-02-25T22:10:00.000Z
ALTER TABLE recipes
ADD COLUMN edit_pin TEXT NOT NULL DEFAULT '000000'
CHECK (edit_pin GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]');

UPDATE recipes
SET edit_pin = printf('%06d', ABS(RANDOM()) % 1000000)
WHERE edit_pin IS NULL OR edit_pin = '000000';
