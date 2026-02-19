-- Migration number: 0001 	 2026-02-19T19:53:46.502Z
-- Add author column to existing recipes table
ALTER TABLE recipes ADD COLUMN author TEXT;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Create join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (recipe_id, tag_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Helpful indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);
