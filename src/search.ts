import { Context } from "hono";

export const search = async (c: Context<{ Bindings: Env }>) => {
  const url = new URL(c.req.url);

  const page = clampInt(url.searchParams.get("page"), 1, 1_000_000, 1);
  const perPage = clampInt(url.searchParams.get("per_page"), 1, 50, 10);
  const sort = parseSort(url.searchParams.get("sort"));
  const orderBySql =
    sort === "top"
      ? "ORDER BY r.view_count DESC, r.created_at DESC"
      : "ORDER BY r.created_at DESC";

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
  const where: string[] = [];
  const params = [];

  // Hidden recipes should not appear in search.
  where.push("(r.status IS NULL OR r.status IN ('pending_curation', 'live'))");

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
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);

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
        r.id, r.slug, r.title, r.author, r.created_at, r.view_count,
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
      ${orderBySql}
      LIMIT ? OFFSET ?
    `.replace(/\n\s+/g, "\n")
  );

  const { results } = await dataStmt
    .bind(...params, ...tagFilterSql.tagParams, perPage, offset)
    .all();

  const data = (results || []).map((r) => ({
    ...r,
    view_count: normalizeNonNegativeInt(r.view_count),
    tags: safeJsonParse(r.tags, []),
  }));

  return c.json({
    data,
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
  });
};

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

function normalizeNonNegativeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function parseSort(input: string | null): "new" | "top" {
  return input === "top" ? "top" : "new";
}
