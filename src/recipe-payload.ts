export type RecipePayload = {
  title: string;
  author: string;
  markdown: string;
  tags: string[];
};

const MAX_TITLE_LENGTH = 160;
const MAX_AUTHOR_LENGTH = 80;
const MAX_TAGS = 24;
const MAX_TAG_LENGTH = 48;

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

  if (title.length > MAX_TITLE_LENGTH || author.length > MAX_AUTHOR_LENGTH) {
    return { error: "Title or author is too long" };
  }

  const tags = Array.isArray(body.tags)
    ? [
        ...new Set(
          body.tags
            .map((t) => String(t).trim())
            .filter((tag) => tag.length > 0 && tag.length <= MAX_TAG_LENGTH),
        ),
      ].slice(0, MAX_TAGS)
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
