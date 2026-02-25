import { Hono } from "hono";
import { search } from "./search";
import { ssrRecipe } from "./recipe";
import { createRecipe } from "./create-recipe";
import { sitemap } from "./sitemap";
import { enqueuePendingRecipesForCuration } from "./curatorAI";
import { handleCurationQueue } from "./queue";
import { handleScheduled } from "./scheduled";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/recipes", search);
app.get("/recipe/:slug", ssrRecipe);
app.post("/recipes", createRecipe);
app.get("/sitemap.xml", sitemap);

app.get("/__dev/enqueue-pending-recipes", async (c) => {
  const result = await enqueuePendingRecipesForCuration(c.env);
  return c.json(result);
});

export default {
  fetch: app.fetch,
  queue: handleCurationQueue,
  scheduled: handleScheduled,
};
