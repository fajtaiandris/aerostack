export const generateRecipeSlug = (title: string, author: string) =>
  `${title}-by-${author}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const isValidRecipeSlug = (slug: string) =>
  /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(slug);
29;
