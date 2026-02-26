import { Context } from "hono";
import { isValidEditHash } from "./hash";
import { EDIT_ERROR_CODES, type EditErrorCode } from "./error-codes";

type EditRecipePageData = {
  hash: string;
  title: string;
  author: string;
  markdown: string;
  tags: string[];
};

type EditRecipePagePayload =
  | { data: EditRecipePageData; error: null }
  | { data: null; error: { code: EditErrorCode } };

export const ssrEditRecipePage = async (c: Context<{ Bindings: Env }>) => {
  const template = await c.env.ASSETS.fetch(
    new Request(new URL("/edit-recipe/_edit-recipe.template.html", c.req.url)),
  );

  if (!template.ok) {
    return c.text("Edit page is unavailable right now", 500);
  }

  const hash = c.req.param("hash").trim().toLowerCase();

  let payload: EditRecipePagePayload;
  try {
    payload = await buildPagePayload(c, hash);
  } catch {
    payload = {
      data: null,
      error: { code: EDIT_ERROR_CODES.UNKNOWN_ERROR },
    };
  }

  let html = await template.text();
  html = html.replace(
    "{{preloadedData}}",
    escapeScriptJson(JSON.stringify(payload)),
  );

  return c.html(html);
};

const buildPagePayload = async (
  c: Context<{ Bindings: Env }>,
  hash: string,
): Promise<EditRecipePagePayload> => {
  if (!isValidEditHash(hash)) {
    return {
      data: null,
      error: { code: EDIT_ERROR_CODES.INVALID_EDIT_LINK },
    };
  }

  const row = await c.env.aerostack_db
    .prepare(
      `
      SELECT
        r.title,
        r.markdown,
        r.author,
        COALESCE(
          json_group_array(
            CASE WHEN t.name IS NULL THEN NULL ELSE t.name END
          ),
          '[]'
        ) AS tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE r.edit_hash = ?
      GROUP BY r.id
    `,
    )
    .bind(hash)
    .first();

  if (!row) {
    return {
      data: null,
      error: { code: EDIT_ERROR_CODES.EDIT_LINK_NOT_FOUND },
    };
  }

  return {
    data: {
      hash,
      title: String(row.title),
      author: String(row.author),
      markdown: String(row.markdown),
      tags: parseTagNames(row.tags),
    },
    error: null,
  };
};

const parseTagNames = (input: unknown): string[] => {
  try {
    const parsed = JSON.parse(String(input));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const escapeScriptJson = (value: string) =>
  value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
