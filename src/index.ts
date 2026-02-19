import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/recipes", async (c) => {
  const url = new URL(c.req.url);

  const page = clampInt(url.searchParams.get("page"), 1, 1_000_000, 1);
  const perPage = clampInt(url.searchParams.get("per_page"), 1, 50, 10);

  const qRaw = (url.searchParams.get("q") || "").trim();
  const q = qRaw ? `%${qRaw.toLowerCase()}%` : null;

  const tagsParam = (url.searchParams.get("tags") || "").trim();
  const tagNames = tagsParam
    ? tagsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const tagsMode = (url.searchParams.get("tags_mode") || "all").toLowerCase();
  const matchAllTags = tagsMode !== "any"; // default all

  const offset = (page - 1) * perPage;

  // ---- Build dynamic WHERE + params (search only title + author) ----
  const where = [];
  const params = [];

  if (q) {
    where.push("(LOWER(r.title) LIKE ? OR LOWER(r.author) LIKE ?)");
    params.push(q, q);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // ---- Tag filter SQL (supports all/any) ----
  // We filter recipe IDs via a CTE, then join tags for the final rows.
  //
  // - matchAllTags=true: recipe must have ALL tagNames -> HAVING COUNT(DISTINCT ...) = N
  // - matchAllTags=false: recipe must have ANY tagNames -> EXISTS / IN
  //
  const tagFilterSql = (() => {
    if (!tagNames.length) return { sql: "", tagParams: [] };

    const placeholders = tagNames.map(() => "?").join(",");

    if (matchAllTags) {
      // Require all tags: only keep recipes whose matching tag count equals N
      return {
        sql: `
          AND r.id IN (
            SELECT rt.recipe_id
            FROM recipe_tags rt
            JOIN tags t ON t.id = rt.tag_id
            WHERE t.name IN (${placeholders})
            GROUP BY rt.recipe_id
            HAVING COUNT(DISTINCT t.name) = ?
          )
        `,
        tagParams: [...tagNames, tagNames.length],
      };
    }

    // Any tag
    return {
      sql: `
        AND r.id IN (
          SELECT rt.recipe_id
          FROM recipe_tags rt
          JOIN tags t ON t.id = rt.tag_id
          WHERE t.name IN (${placeholders})
        )
      `,
      tagParams: [...tagNames],
    };
  })();

  // ---- Total count ----
  // Count distinct recipes after filters.
  const countStmt = c.env.aerostack_db.prepare(
    `
      SELECT COUNT(*) AS total
      FROM recipes r
      ${whereSql}
      ${whereSql ? "" : "WHERE 1=1"}
      ${tagFilterSql.sql}
    `.replace(/\n\s+/g, "\n")
  );

  const countRes = await countStmt.bind(...params, ...tagFilterSql.tagParams).first();
  const total = Number(countRes?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // If page is beyond end, return empty data but valid meta
  if (offset >= total && total > 0) {
    return c.json({
      data: [],
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
    });
  }

  // ---- Page query ----
  const dataStmt = c.env.aerostack_db.prepare(
    `
      SELECT
        r.id, r.slug, r.title, r.author, r.created_at,
        COALESCE(
          json_group_array(
            CASE WHEN t.id IS NULL THEN NULL
                 ELSE json_object('id', t.id, 'name', t.name)
            END
          ),
          '[]'
        ) AS tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      ${whereSql}
      ${whereSql ? "" : "WHERE 1=1"}
      ${tagFilterSql.sql}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `.replace(/\n\s+/g, "\n")
  );

  const { results } = await dataStmt
    .bind(...params, ...tagFilterSql.tagParams, perPage, offset)
    .all();

  const data = (results || []).map((r) => ({
    ...r,
    tags: safeJsonParse(r.tags, []),
  }));

  return c.json({
    data,
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
  });
});

// ----------------- helpers -----------------
function clampInt(value: string | null, min: number, max: number, fallback: number) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeJsonParse(str: unknown, fallback: never[]) {
  try {
    const v = JSON.parse(String(str));
    return Array.isArray(v) ? v.filter(Boolean) : fallback;
  } catch {
    return fallback;
  }
}

app.get('/tags', async (c) => {
  const { results } = await c.env.aerostack_db
    .prepare('SELECT id, name FROM tags ORDER BY name')
    .all();

  return c.json(results);
});

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
