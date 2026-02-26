export type RecipePayload = {
  title: string;
  author: string;
  markdown: string;
  tags: string[];
};

export const parseRecipePayload = (
  input: unknown,
): { data: RecipePayload } | { error: string } => {
  if (!input || typeof input !== "object") {
    return { error: "Missing required fields" };
  }

  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const markdownRaw = typeof body.markdown === "string" ? body.markdown : "";

  if (!title || !author || !markdownRaw.trim()) {
    return { error: "Missing required fields" };
  }

  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.map((t) => String(t).trim()).filter(Boolean))]
    : [];

  return {
    data: {
      title,
      author,
      markdown: markdownRaw,
      tags,
    },
  };
};
