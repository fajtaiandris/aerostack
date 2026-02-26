import { Context } from "hono";
import { RecipeStatus } from "./types";
import { parseRecipePayload } from "./recipe-payload";
import { generateRecipeSlug, isValidRecipeSlug } from "./recipe-slug";
import { generateEditHash } from "./edit/hash";

export const createRecipe = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json<unknown>();
    const parsed = parseRecipePayload(body);
    if ("error" in parsed) {
      return c.json({ error: parsed.error }, 400);
    }
    const { title, author, markdown, tags } = parsed.data;

    const slug = generateRecipeSlug(title, author);
    if (!isValidRecipeSlug(slug)) {
      return c.json({ error: "Invalid recipe title or author" }, 400);
    }
    const editHash = await createUniqueEditHash(c);
    const initialStatus: RecipeStatus = "pending_curation";

    const now = new Date().toISOString();

    // ---- Ensure slug uniqueness ----
    const existing = await c.env.aerostack_db
      .prepare(`SELECT id FROM recipes WHERE slug = ?`)
      .bind(slug)
      .first();

    if (existing) {
      return c.json({ error: "This recipe title is already taken" }, 409);
    }

    // ---- Invalidate sitemap cache ----
    await c.env.SITEMAP_KV.delete("sitemap.xml");

    // ---- Insert recipe ----
    const insertRecipe = await c.env.aerostack_db
      .prepare(
        `
        INSERT INTO recipes (slug, title, markdown, author, status, edit_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(slug, title, markdown, author, initialStatus, editHash, now)
      .run();

    const recipeId = insertRecipe.meta.last_row_id;

    // ---- Insert tags + relations ----
    for (const tagName of tags) {
      // Insert tag if not exists
      await c.env.aerostack_db
        .prepare(
          `
          INSERT INTO tags (name)
          VALUES (?)
          ON CONFLICT(name) DO NOTHING
        `,
        )
        .bind(tagName)
        .run();

      const tagRow = await c.env.aerostack_db
        .prepare(`SELECT id FROM tags WHERE name = ?`)
        .bind(tagName)
        .first();

      if (tagRow) {
        await c.env.aerostack_db
          .prepare(
            `
            INSERT INTO recipe_tags (recipe_id, tag_id)
            VALUES (?, ?)
            ON CONFLICT(recipe_id, tag_id) DO NOTHING
          `,
          )
          .bind(recipeId, tagRow.id)
          .run();
      }
    }

    return c.json(
      {
        id: recipeId,
        slug,
        title,
        author,
        created_at: now,
        status: initialStatus,
        edit_hash: editHash,
        tags,
      },
      201,
    );
  } catch (err) {
    return c.json({ error: "Something went wrong" }, 400);
  }
};

const createUniqueEditHash = async (c: Context<{ Bindings: Env }>) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const hash = generateEditHash();
    const existing = await c.env.aerostack_db
      .prepare(`SELECT id FROM recipes WHERE edit_hash = ?`)
      .bind(hash)
      .first();

    if (!existing) return hash;
  }

  throw new Error("Failed to generate a unique edit hash");
};
