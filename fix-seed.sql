-- Update markdown field to EditorJS-style JSON string
-- SQLite compatible

UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "V60 Bright Bloom", "level": 2 }},
    { "type": "paragraph", "data": { "text": "A bright and balanced <b>light roast</b> V60 highlighting floral clarity." }},
    { "type": "list", "data": {
      "style": "unordered",
      "items": [
        "Coffee: <b>15 g</b>",
        "Water: <b>250 ml</b> at <b>96 C</b>",
        "Grind: <b>Medium</b>",
        "Brew time: <b>2:45</b>"
      ]
    }}
  ]
}
'
WHERE slug = "v60-bright-bloom";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "French Press Bold", "level": 2 }},
    { "type": "paragraph", "data": { "text": "A full-bodied <b>dark roast</b> brew with strong character." }},
    { "type": "list", "data": {
      "style": "unordered",
      "items": [
        "Coffee: <b>30 g</b>",
        "Water: <b>500 ml</b>",
        "Grind: <b>Coarse</b>",
        "Brew: <b>4 minutes</b>"
      ]
    }}
  ]
}
'
WHERE slug = "french-press-bold";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Cold Brew Smooth", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Low acidity and chocolate sweetness with a smooth finish." }},
    { "type": "list", "data": {
      "style": "ordered",
      "items": [
        "Combine <b>100 g</b> coarse coffee with <b>1 L</b> cold water.",
        "Steep for <b>12 to 16 hours</b>.",
        "Filter and serve over ice."
      ]
    }}
  ]
}
'
WHERE slug = "cold-brew-smooth";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Espresso Intense Shot", "level": 2 }},
    { "type": "paragraph", "data": { "text": "A concentrated <b>espresso</b> shot with bold crema." }},
    { "type": "list", "data": {
      "style": "unordered",
      "items": [
        "Dose: <b>18 g</b>",
        "Yield: <b>36 g</b>",
        "Time: <b>28 to 30 seconds</b>"
      ]
    }}
  ]
}
'
WHERE slug = "espresso-intense-shot";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Pour Over Balanced", "level": 2 }},
    { "type": "paragraph", "data": { "text": "A classic balanced profile suitable for everyday brewing." }}
  ]
}
'
WHERE slug = "pour-over-balanced";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Iced Latte Refresh", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Sweet and refreshing iced latte with creamy texture." }}
  ]
}
'
WHERE slug = "iced-latte-refresh";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Weekend Brunch Brew", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Perfect slow morning brew with mellow sweetness." }}
  ]
}
'
WHERE slug = "weekend-brunch-brew";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Dark Roast Power", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Deep, smoky and strong dark roast cup." }}
  ]
}
'
WHERE slug = "dark-roast-power";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Light Roast Floral", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Floral aroma with tea-like body and citrus acidity." }}
  ]
}
'
WHERE slug = "light-roast-floral";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Travel Mug Fast Brew", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Quick and practical recipe for brewing on the go." }}
  ]
}
'
WHERE slug = "travel-mug-fast";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Single Origin Highlight", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Showcases origin character beautifully." }}
  ]
}
'
WHERE slug = "single-origin-highlight";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Honey Oat Latte", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Sweet honey and creamy oat milk combination." }}
  ]
}
'
WHERE slug = "honey-oat-latte";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Manual Espresso Pro", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Dial in your manual espresso for clarity and control." }}
  ]
}
'
WHERE slug = "manual-espresso-pro";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Afternoon Pick Me Up", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Strong and energising brew for the afternoon slump." }}
  ]
}
'
WHERE slug = "afternoon-pick-me-up";


UPDATE recipes SET markdown = '
{
  "time": 1734200000000,
  "version": "2.28.2",
  "blocks": [
    { "type": "header", "data": { "text": "Decaf Evening Cup", "level": 2 }},
    { "type": "paragraph", "data": { "text": "Smooth decaf recipe for a relaxing evening cup." }}
  ]
}
'
WHERE slug = "decaf-evening-cup";