-- Migration number: 0005 	 2026-03-04T00:00:00.000Z
ALTER TABLE recipes
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0);
