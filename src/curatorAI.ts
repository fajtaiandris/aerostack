import { Context } from "hono";
import {
  extractEditorJsText,
  normalizeStatus,
  parseTags,
  Recipe,
  RecipeStatus,
} from "./types";

type CurationRuntimeEnv = Pick<Env, "aerostack_db" | "AI">;
type PendingCurationEnv = Pick<Env, "aerostack_db" | "CURATION_QUEUE">;

export type CurationQueueMessage = {
  recipeId: number;
};

const getRecipeForCurationById = async (
  env: CurationRuntimeEnv,
  recipeId: number,
): Promise<Recipe | null> => {
  const row = await env.aerostack_db
    .prepare(
      `
      SELECT
        r.id,
        r.slug,
        r.title,
        r.markdown,
        r.author,
        r.created_at,
        r.status,
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
      WHERE r.id = ? AND r.status = 'pending_curation'
      GROUP BY r.id
    `,
    )
    .bind(recipeId)
    .first();

  if (!row) return null;

  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    markdown: String(row.markdown),
    author: String(row.author),
    created_at: String(row.created_at),
    status: normalizeStatus(row.status),
    tags: parseTags(row.tags),
  };
};

export const enqueuePendingRecipesForCuration = async (
  env: PendingCurationEnv,
) => {
  const { results } = await env.aerostack_db
    .prepare(
      `
      SELECT id
      FROM recipes
      WHERE status = 'pending_curation'
      ORDER BY created_at DESC
    `,
    )
    .all();

  const recipeIds = (results || [])
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!recipeIds.length) {
    return { queued: 0 };
  }

  await env.CURATION_QUEUE.sendBatch(
    recipeIds.map((recipeId) => ({
      body: { recipeId } satisfies CurationQueueMessage,
    })),
  );

  return { queued: recipeIds.length };
};

export const isLowQualityRecipe = async (
  env: CurationRuntimeEnv,
  recipe: Recipe,
): Promise<boolean> => {
  const contentText = extractEditorJsText(recipe.markdown).slice(0, 1600);

  const response = (await env.AI.run("@cf/meta/llama-3.2-1b-instruct", {
    messages: [
      {
        role: "system",
        content:
          'You moderate coffee recipe submissions. Hide only if the submission is clearly a test/dummy/spam post or clearly not intended to be a coffee recipe. If it is a real coffee recipe attempt, even if short or imperfect, keep it live. Reply ONLY as JSON with shape {"decision":"live"|"hidden","reason":"short reason"}.',
      },
      {
        role: "user",
        content: `Title: ${recipe.title}\nAuthor: ${recipe.author}\nContent: ${contentText}`,
      },
    ],
    max_tokens: 80,
  })) as { response: string };

  const raw = String(response.response || "").trim();
  const normalized = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalized) as { decision?: string };
    return parsed.decision === "hidden";
  } catch {
    const lower = normalized.toLowerCase();
    if (/\bhidden\b/.test(lower)) {
      return true;
    }
    return false;
  }
};

export const curateRecipeById = async (
  env: CurationRuntimeEnv,
  recipeId: number,
) => {
  const recipe = await getRecipeForCurationById(env, recipeId);

  if (!recipe) {
    return { processed: false, reason: "not_found_or_not_pending" as const };
  }

  const lowQuality = await isLowQualityRecipe(env, recipe);
  const status: RecipeStatus = lowQuality ? "hidden" : "live";
  console.log(
    `[curatorAI] Moderation decision recipe ${recipe.id} "${recipe.title}": ${status}`,
  );

  await env.aerostack_db
    .prepare(
      `
      UPDATE recipes
      SET status = ?
      WHERE id = ? AND status = 'pending_curation'
    `,
    )
    .bind(status, recipe.id)
    .run();

  return { processed: true, status };
};
