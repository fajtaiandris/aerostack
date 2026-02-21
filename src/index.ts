import { Hono } from "hono";
import { search } from "./search";
import { ssrRecipe } from "./recipe";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/recipes", search);
app.get('/recipe/:slug', ssrRecipe);

app.get('/api/tags', async (c) => {
  const { results } = await c.env.aerostack_db
    .prepare('SELECT id, name FROM tags ORDER BY name')
    .all();

  return c.json(results);
});

export default app;
