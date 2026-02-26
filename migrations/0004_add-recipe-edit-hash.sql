-- Migration number: 0004 	 2026-02-26T08:55:00.000Z
-- edit_pin is deprecated; edit access now uses a stable hash token.
ALTER TABLE recipes
ADD COLUMN edit_hash TEXT;

UPDATE recipes
SET edit_hash = lower(hex(randomblob(16)))
WHERE edit_hash IS NULL OR trim(edit_hash) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_edit_hash
ON recipes(edit_hash)
WHERE edit_hash IS NOT NULL;
