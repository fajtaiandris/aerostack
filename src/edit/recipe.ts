import { Context } from "hono";
import { parseRecipePayload } from "../recipe-payload";
import { generateRecipeSlug, isValidRecipeSlug } from "../recipe-slug";
import { isValidEditHash } from "./hash";
import { EDIT_ERROR_CODES } from "./error-codes";

export const updateRecipeByHash = async (c: Context<{ Bindings: Env }>) => {
  try {
    const hash = c.req.param("hash").trim().toLowerCase();

    if (!isValidEditHash(hash)) {
      return c.json({ error_code: EDIT_ERROR_CODES.INVALID_EDIT_LINK }, 400);
    }

    const body = await c.req.json<unknown>();
    const parsed = parseRecipePayload(body);
    if ("error" in parsed) {
      return c.json({ error_code: EDIT_ERROR_CODES.INVALID_RECIPE_FIELDS }, 400);
    }
    const { title, author, markdown, tags } = parsed.data;
    const nextSlug = generateRecipeSlug(title, author);

    if (!isValidRecipeSlug(nextSlug)) {
      return c.json({ error_code: EDIT_ERROR_CODES.INVALID_RECIPE_SLUG }, 400);
    }

    const recipeRow = await c.env.aerostack_db
      .prepare(`SELECT id FROM recipes WHERE edit_hash = ?`)
      .bind(hash)
      .first<{ id: number | string }>();

    if (!recipeRow) {
      return c.json({ error_code: EDIT_ERROR_CODES.EDIT_LINK_NOT_FOUND }, 404);
    }

    const recipeId = Number(recipeRow.id);

    const existingSlug = await c.env.aerostack_db
      .prepare(`SELECT id FROM recipes WHERE slug = ? AND id != ?`)
      .bind(nextSlug, recipeId)
      .first();

    if (existingSlug) {
      return c.json({ error_code: EDIT_ERROR_CODES.RECIPE_SLUG_TAKEN }, 409);
    }

    await c.env.aerostack_db
      .prepare(
        `
        UPDATE recipes
        SET slug = ?, title = ?, author = ?, markdown = ?
        WHERE id = ?
      `,
      )
      .bind(nextSlug, title, author, markdown, recipeId)
      .run();

    await replaceRecipeTags(c, recipeId, tags);

    return c.json({
      id: recipeId,
      slug: nextSlug,
      title,
      author,
      tags,
    });
  } catch {
    return c.json({ error_code: EDIT_ERROR_CODES.UNKNOWN_ERROR }, 400);
  }
};

const replaceRecipeTags = async (
  c: Context<{ Bindings: Env }>,
  recipeId: number,
  tagNames: string[],
) => {
  if (!tagNames.length) {
    await c.env.aerostack_db
      .prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`)
      .bind(recipeId)
      .run();
    return;
  }

  for (const tagName of tagNames) {
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
  }

  const placeholders = tagNames.map(() => "?").join(",");
  const { results } = await c.env.aerostack_db
    .prepare(`SELECT id FROM tags WHERE name IN (${placeholders})`)
    .bind(...tagNames)
    .all<{ id: number | string }>();

  const tagIds = (results || [])
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id));

  if (!tagIds.length) {
    await c.env.aerostack_db
      .prepare(`DELETE FROM recipe_tags WHERE recipe_id = ?`)
      .bind(recipeId)
      .run();
    return;
  }

  const keepPlaceholders = tagIds.map(() => "?").join(",");
  await c.env.aerostack_db
    .prepare(
      `
      DELETE FROM recipe_tags
      WHERE recipe_id = ? AND tag_id NOT IN (${keepPlaceholders})
    `,
    )
    .bind(recipeId, ...tagIds)
    .run();

  for (const tagId of tagIds) {
    await c.env.aerostack_db
      .prepare(
        `
        INSERT INTO recipe_tags (recipe_id, tag_id)
        VALUES (?, ?)
        ON CONFLICT(recipe_id, tag_id) DO NOTHING
      `,
      )
      .bind(recipeId, tagId)
      .run();
  }
};
