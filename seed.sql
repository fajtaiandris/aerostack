-- Insert 15 new recipes
INSERT INTO recipes (slug, title, markdown, author, edit_hash)
VALUES
  ('v60-bright-bloom', 'V60 Bright Bloom', '# V60 Bright Bloom recipe content', 'Emma Brown', lower(hex(randomblob(16)))),
  ('french-press-bold', 'French Press Bold', '# French Press Bold recipe content', 'Liam Carter', lower(hex(randomblob(16)))),
  ('cold-brew-smooth', 'Cold Brew Smooth', '# Cold Brew Smooth recipe content', 'Olivia Davis', lower(hex(randomblob(16)))),
  ('espresso-intense-shot', 'Espresso Intense Shot', '# Espresso Intense Shot recipe content', 'Noah Wilson', lower(hex(randomblob(16)))),
  ('pour-over-balanced', 'Pour Over Balanced', '# Pour Over Balanced recipe content', 'Ava Martinez', lower(hex(randomblob(16)))),
  ('iced-latte-refresh', 'Iced Latte Refresh', '# Iced Latte Refresh recipe content', 'Sophia Anderson', lower(hex(randomblob(16)))),
  ('weekend-brunch-brew', 'Weekend Brunch Brew', '# Weekend Brunch Brew recipe content', 'Mason Thomas', lower(hex(randomblob(16)))),
  ('dark-roast-power', 'Dark Roast Power', '# Dark Roast Power recipe content', 'Isabella Moore', lower(hex(randomblob(16)))),
  ('light-roast-floral', 'Light Roast Floral', '# Light Roast Floral recipe content', 'Ethan Taylor', lower(hex(randomblob(16)))),
  ('travel-mug-fast', 'Travel Mug Fast Brew', '# Travel Mug Fast Brew recipe content', 'Charlotte Jackson', lower(hex(randomblob(16)))),
  ('single-origin-highlight', 'Single Origin Highlight', '# Single Origin Highlight recipe content', 'James White', lower(hex(randomblob(16)))),
  ('honey-oat-latte', 'Honey Oat Latte', '# Honey Oat Latte recipe content', 'Amelia Harris', lower(hex(randomblob(16)))),
  ('manual-espresso-pro', 'Manual Espresso Pro', '# Manual Espresso Pro recipe content', 'Benjamin Martin', lower(hex(randomblob(16)))),
  ('afternoon-pick-me-up', 'Afternoon Pick Me Up', '# Afternoon Pick Me Up recipe content', 'Mia Thompson', lower(hex(randomblob(16)))),
  ('decaf-evening-cup', 'Decaf Evening Cup', '# Decaf Evening Cup recipe content', 'Lucas Garcia', lower(hex(randomblob(16))));

-- Insert additional tags (new ones)
INSERT INTO tags (name)
VALUES
  ('espresso'),
  ('cold'),
  ('iced'),
  ('dark-roast'),
  ('light-roast'),
  ('single-origin'),
  ('sweet'),
  ('decaf'),
  ('manual'),
  ('brunch'),
  ('balanced'),
  ('floral'),
  ('travel'),
  ('afternoon'),
  ('smooth');

-- Link recipes to tags

-- V60 Bright Bloom → light-roast, floral, balanced
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='v60-bright-bloom'), (SELECT id FROM tags WHERE name='light-roast')),
  ((SELECT id FROM recipes WHERE slug='v60-bright-bloom'), (SELECT id FROM tags WHERE name='floral')),
  ((SELECT id FROM recipes WHERE slug='v60-bright-bloom'), (SELECT id FROM tags WHERE name='balanced'));

-- French Press Bold → dark-roast, strong
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='french-press-bold'), (SELECT id FROM tags WHERE name='dark-roast')),
  ((SELECT id FROM recipes WHERE slug='french-press-bold'), (SELECT id FROM tags WHERE name='strong'));

-- Cold Brew Smooth → cold, smooth
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='cold-brew-smooth'), (SELECT id FROM tags WHERE name='cold')),
  ((SELECT id FROM recipes WHERE slug='cold-brew-smooth'), (SELECT id FROM tags WHERE name='smooth'));

-- Espresso Intense Shot → espresso, strong
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='espresso-intense-shot'), (SELECT id FROM tags WHERE name='espresso')),
  ((SELECT id FROM recipes WHERE slug='espresso-intense-shot'), (SELECT id FROM tags WHERE name='strong'));

-- Pour Over Balanced → balanced, classic
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='pour-over-balanced'), (SELECT id FROM tags WHERE name='balanced')),
  ((SELECT id FROM recipes WHERE slug='pour-over-balanced'), (SELECT id FROM tags WHERE name='classic'));

-- Iced Latte Refresh → iced, sweet
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='iced-latte-refresh'), (SELECT id FROM tags WHERE name='iced')),
  ((SELECT id FROM recipes WHERE slug='iced-latte-refresh'), (SELECT id FROM tags WHERE name='sweet'));

-- Weekend Brunch Brew → brunch, morning
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='weekend-brunch-brew'), (SELECT id FROM tags WHERE name='brunch')),
  ((SELECT id FROM recipes WHERE slug='weekend-brunch-brew'), (SELECT id FROM tags WHERE name='morning'));

-- Dark Roast Power → dark-roast, strong
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='dark-roast-power'), (SELECT id FROM tags WHERE name='dark-roast')),
  ((SELECT id FROM recipes WHERE slug='dark-roast-power'), (SELECT id FROM tags WHERE name='strong'));

-- Light Roast Floral → light-roast, floral
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='light-roast-floral'), (SELECT id FROM tags WHERE name='light-roast')),
  ((SELECT id FROM recipes WHERE slug='light-roast-floral'), (SELECT id FROM tags WHERE name='floral'));

-- Travel Mug Fast Brew → travel, quick
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='travel-mug-fast'), (SELECT id FROM tags WHERE name='travel')),
  ((SELECT id FROM recipes WHERE slug='travel-mug-fast'), (SELECT id FROM tags WHERE name='quick'));

-- Single Origin Highlight → single-origin, balanced
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='single-origin-highlight'), (SELECT id FROM tags WHERE name='single-origin')),
  ((SELECT id FROM recipes WHERE slug='single-origin-highlight'), (SELECT id FROM tags WHERE name='balanced'));

-- Honey Oat Latte → sweet, iced
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='honey-oat-latte'), (SELECT id FROM tags WHERE name='sweet')),
  ((SELECT id FROM recipes WHERE slug='honey-oat-latte'), (SELECT id FROM tags WHERE name='iced'));

-- Manual Espresso Pro → manual, espresso
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='manual-espresso-pro'), (SELECT id FROM tags WHERE name='manual')),
  ((SELECT id FROM recipes WHERE slug='manual-espresso-pro'), (SELECT id FROM tags WHERE name='espresso'));

-- Afternoon Pick Me Up → afternoon, strong
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='afternoon-pick-me-up'), (SELECT id FROM tags WHERE name='afternoon')),
  ((SELECT id FROM recipes WHERE slug='afternoon-pick-me-up'), (SELECT id FROM tags WHERE name='strong'));

-- Decaf Evening Cup → decaf, classic
INSERT INTO recipe_tags (recipe_id, tag_id)
VALUES
  ((SELECT id FROM recipes WHERE slug='decaf-evening-cup'), (SELECT id FROM tags WHERE name='decaf')),
  ((SELECT id FROM recipes WHERE slug='decaf-evening-cup'), (SELECT id FROM tags WHERE name='classic'));
