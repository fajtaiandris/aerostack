export const RECIPE_SLUG_MAX_LENGTH = 120;

const RECIPE_SLUG_PATTERN = /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/;

export const normalizeRecipeSlug = (slug: string) =>
  String(slug).trim().toLowerCase();

export const generateRecipeSlug = (title: string, author: string) =>
  normalizeRecipeSlug(
    `${title}-by-${author}`
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-"),
  );

export const isValidRecipeSlug = (slug: string) =>
  slug.length > 0 &&
  slug.length <= RECIPE_SLUG_MAX_LENGTH &&
  RECIPE_SLUG_PATTERN.test(slug);
