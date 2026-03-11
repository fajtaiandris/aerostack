import { Context } from "hono";
import { isValidRecipeSlug, normalizeRecipeSlug } from "../recipe-slug";
import { formatViews, normalizeNonNegativeInt, trackRecipeView } from "./view-count";

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const then = new Date(dateStr);
  const days = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};

export const ssrRecipe = async (c: Context<{ Bindings: Env }>) => {
  try {
    const slug = normalizeRecipeSlug(c.req.param("slug"));
    if (!isValidRecipeSlug(slug)) {
      return redirectToSearch(c);
    }

    const recipeRow = await c.env.aerostack_db
      .prepare(
        `
    SELECT
      r.id,
      r.slug,
      r.title,
      r.markdown,
      r.author,
      r.created_at,
      r.view_count,
      COALESCE(json_group_array(json_object('id', t.id, 'name', t.name)), '[]') AS tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    WHERE r.slug = ?
    GROUP BY r.id
  `,
      )
      .bind(slug)
      .first();

    if (!recipeRow) {
      const query = slug.replace(/[-_]/g, " ");
      return redirectToSearch(c, query);
    }

    const asset = await c.env.ASSETS.fetch(
      new Request(new URL("/recipe/_recipe.template.html", c.req.url)),
    );

    const title = String(recipeRow.title ?? "");
    const author = String(recipeRow.author ?? "");
    const markdown = String(recipeRow.markdown ?? "");
    const createdAt = String(recipeRow.created_at ?? "");
    const tags = parseRecipeTags(recipeRow.tags);

    let viewCount = normalizeNonNegativeInt(recipeRow.view_count);

    const recipeId = Number(recipeRow.id);
    if (Number.isInteger(recipeId) && recipeId > 0) {
      const tracked = await trackRecipeView(c, recipeId, viewCount);
      viewCount = tracked.viewCount;
      if (tracked.setCookie) {
        c.header("Set-Cookie", tracked.setCookie);
      }
    }

    let html = await asset.text();
    const ogImageUrl = `/api/og-image?seed=${encodeURIComponent(title)}`;

    html = html.replaceAll("{{title}}", escapeHtml(title));
    html = html.replaceAll("{{author}}", escapeHtml(author));
    html = html.replaceAll("{{ogImage}}", escapeAttribute(ogImageUrl));
    html = html.replaceAll("{{timeAgo}}", timeAgo(createdAt));
    html = html.replaceAll("{{views}}", formatViews(viewCount));
    html = html.replaceAll("{{content}}", escapeAttribute(markdown));
    html = html.replaceAll("{{tags}}", renderTagHtml(tags));
    return c.html(html);
  } catch {
    return redirectToSearch(c);
  }
};

const redirectToSearch = (
  c: Context<{ Bindings: Env }>,
  query?: string,
) => {
  const url = new URL("/search", c.req.url);
  const normalizedQuery = String(query ?? "").trim();
  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return c.redirect(url.toString(), 302);
};

const parseRecipeTags = (raw: unknown): string[] => {
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (tag): tag is { name: unknown } =>
          Boolean(tag) && typeof tag === "object" && "name" in tag,
      )
      .map((tag) => String(tag.name || "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const renderTagHtml = (tags: string[]) =>
  tags.map((tag) => `<span class="rv-tag">${escapeHtml(tag)}</span>`).join("");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
