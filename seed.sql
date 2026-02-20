-- Insert 15 new recipes
INSERT INTO recipes (slug, title, markdown, author)
VALUES
  ('v60-bright-bloom', 'V60 Bright Bloom', '# V60 Bright Bloom recipe content', 'Emma Brown'),
  ('french-press-bold', 'French Press Bold', '# French Press Bold recipe content', 'Liam Carter'),
  ('cold-brew-smooth', 'Cold Brew Smooth', '# Cold Brew Smooth recipe content', 'Olivia Davis'),
  ('espresso-intense-shot', 'Espresso Intense Shot', '# Espresso Intense Shot recipe content', 'Noah Wilson'),
  ('pour-over-balanced', 'Pour Over Balanced', '# Pour Over Balanced recipe content', 'Ava Martinez'),
  ('iced-latte-refresh', 'Iced Latte Refresh', '# Iced Latte Refresh recipe content', 'Sophia Anderson'),
  ('weekend-brunch-brew', 'Weekend Brunch Brew', '# Weekend Brunch Brew recipe content', 'Mason Thomas'),
  ('dark-roast-power', 'Dark Roast Power', '# Dark Roast Power recipe content', 'Isabella Moore'),
  ('light-roast-floral', 'Light Roast Floral', '# Light Roast Floral recipe content', 'Ethan Taylor'),
  ('travel-mug-fast', 'Travel Mug Fast Brew', '# Travel Mug Fast Brew recipe content', 'Charlotte Jackson'),
  ('single-origin-highlight', 'Single Origin Highlight', '# Single Origin Highlight recipe content', 'James White'),
  ('honey-oat-latte', 'Honey Oat Latte', '# Honey Oat Latte recipe content', 'Amelia Harris'),
  ('manual-espresso-pro', 'Manual Espresso Pro', '# Manual Espresso Pro recipe content', 'Benjamin Martin'),
  ('afternoon-pick-me-up', 'Afternoon Pick Me Up', '# Afternoon Pick Me Up recipe content', 'Mia Thompson'),
  ('decaf-evening-cup', 'Decaf Evening Cup', '# Decaf Evening Cup recipe content', 'Lucas Garcia');

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