import { Context } from "hono";

export const createRecipe = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json<{
      title: string;
      author: string;
      markdown: string;
      tags?: string[];
      slug?: string;
    }>();

    if (!body.title || !body.author || !body.markdown) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const slug = body.slug ?? generateSlug(body.title, body.author);
    const tags = (body.tags ?? []).map(t => t.trim()).filter(Boolean);

    const now = new Date().toISOString();

    // ---- Ensure slug uniqueness ----
    const existing = await c.env.aerostack_db
      .prepare(`SELECT id FROM recipes WHERE slug = ?`)
      .bind(slug)
      .first();

    if (existing) {
      return c.json({ error: "This recipe title is already taken" }, 409);
    }

    // ---- Insert recipe ----
    const insertRecipe = await c.env.aerostack_db
      .prepare(`
        INSERT INTO recipes (slug, title, markdown, author, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(slug, body.title, body.markdown, body.author, now)
      .run();

    const recipeId = insertRecipe.meta.last_row_id;

    // ---- Insert tags + relations ----
    for (const tagName of tags) {
      // Insert tag if not exists
      await c.env.aerostack_db
        .prepare(`
          INSERT INTO tags (name)
          VALUES (?)
          ON CONFLICT(name) DO NOTHING
        `)
        .bind(tagName)
        .run();

      const tagRow = await c.env.aerostack_db
        .prepare(`SELECT id FROM tags WHERE name = ?`)
        .bind(tagName)
        .first();

      if (tagRow) {
        await c.env.aerostack_db
          .prepare(`
            INSERT INTO recipe_tags (recipe_id, tag_id)
            VALUES (?, ?)
            ON CONFLICT(recipe_id, tag_id) DO NOTHING
          `)
          .bind(recipeId, tagRow.id)
          .run();
      }
    }

    return c.json(
      {
        id: recipeId,
        slug,
        title: body.title,
        author: body.author,
        created_at: now,
        tags,
      },
      201
    );
  } catch (err) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
};

function generateSlug(title: string, author: string) {
  return `${title}-by-${author}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}