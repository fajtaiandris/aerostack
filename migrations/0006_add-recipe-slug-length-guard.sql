-- Migration number: 0006 	 2026-03-11T00:00:00.000Z
CREATE TRIGGER IF NOT EXISTS trg_recipes_slug_length_insert
BEFORE INSERT ON recipes
FOR EACH ROW
WHEN NEW.slug IS NULL OR length(NEW.slug) = 0 OR length(NEW.slug) > 120
BEGIN
  SELECT RAISE(ABORT, 'slug_length_out_of_range');
END;

CREATE TRIGGER IF NOT EXISTS trg_recipes_slug_length_update
BEFORE UPDATE OF slug ON recipes
FOR EACH ROW
WHEN NEW.slug IS NULL OR length(NEW.slug) = 0 OR length(NEW.slug) > 120
BEGIN
  SELECT RAISE(ABORT, 'slug_length_out_of_range');
END;
