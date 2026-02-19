import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get('/recipes', async (c) => {
  const { results } = await c.env.aerostack_db
    .prepare(`
      SELECT
        r.id, r.slug, r.title, r.author, r.created_at,
        COALESCE(json_group_array(json_object('id', t.id, 'name', t.name)), '[]') AS tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `)
    .all()

    const recipes = results.map(r => ({
      ...r,
      tags: JSON.parse(r.tags as string)
    }));

  return c.json(recipes)
})

app.get('/recipe/:slug', async (c) => {
  const slug = c.req.param('slug');

  const recipeRow = await c.env.aerostack_db.prepare(`
    SELECT
      r.id,
      r.slug,
      r.title,
      r.markdown,
      r.author,
      r.created_at,
      COALESCE(json_group_array(json_object('id', t.id, 'name', t.name)), '[]') AS tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    WHERE r.slug = ?
    GROUP BY r.id
  `)
    .bind(slug)
    .first();

  if (!recipeRow) {
    return c.text('Recipe not found', 404);
  }

  return c.json(recipeRow);
});

export default app;
