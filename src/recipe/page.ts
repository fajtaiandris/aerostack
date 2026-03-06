import { Context } from "hono";
import { Recipe } from "../types";
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
    const slug = c.req.param("slug");

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
      const url = new URL("/search", c.req.url);
      url.searchParams.set("q", query);

      return c.redirect(url.toString(), 302);
    }

    const asset = await c.env.ASSETS.fetch(
      new Request(new URL("/recipe/_recipe.template.html", c.req.url)),
    );

    const recipe: Recipe = recipeRow as unknown as Recipe;
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
    const ogImageUrl = `/api/og-image?seed=${encodeURIComponent(recipe.title)}`;

    html = html.replaceAll("{{title}}", recipe.title);
    html = html.replaceAll("{{author}}", recipe.author);
    html = html.replaceAll("{{ogImage}}", ogImageUrl);
    html = html.replaceAll("{{timeAgo}}", timeAgo(recipe.created_at));
    html = html.replaceAll("{{views}}", formatViews(viewCount));
    html = html.replaceAll("{{content}}", escapeAttribute(recipe.markdown));
    html = html.replaceAll(
      "{{tags}}",
      (JSON.parse(recipeRow.tags as string) as { id: number; name: string }[])
        .map((t) => `<span class="rv-tag">${t.name}</span>`)
        .join(""),
    );
    return c.html(html);
  } catch (err) {
    const url = new URL("/search", c.req.url);
    return c.redirect(url.toString(), 302);
  }
};

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
