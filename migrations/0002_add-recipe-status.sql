-- Migration number: 0002 	 2026-02-24T22:30:00.000Z
ALTER TABLE recipes
ADD COLUMN status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('pending_curation', 'live', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
