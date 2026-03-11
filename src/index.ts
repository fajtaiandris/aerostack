import { Hono } from "hono";
import { search } from "./search";
import { ssrRecipe } from "./recipe/page";
import { createRecipe } from "./create-recipe";
import { sitemap } from "./sitemap";
import { handleCurationQueue } from "./queue";
import { handleScheduled } from "./scheduled";
import { updateRecipeByHash } from "./edit/recipe";
import { ssrEditRecipePage } from "./edit/page";
import { ogImage } from "./og-image";
import { faviconImage } from "./favicon";
import { SECURITY_HEADERS } from "./security/headers";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  await next();

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    c.header(name, value);
  }
});

app.get("/api/recipes", search);
app.get("/api/og-image", ogImage);
app.get("/api/favicon", faviconImage);
app.get("/recipe/:slug", ssrRecipe);
app.get("/edit-recipe/:hash", ssrEditRecipePage);
app.post("/recipes", createRecipe);
app.put("/recipes/edit/:hash", updateRecipeByHash);
app.get("/sitemap.xml", sitemap);

export default {
  fetch: app.fetch,
  queue: handleCurationQueue,
  scheduled: handleScheduled,
};
