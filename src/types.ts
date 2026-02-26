export type Recipe = {
  id: number;
  slug: string;
  title: string;
  markdown: string;
  author: string;
  created_at: string;
  status: RecipeStatus;
  edit_hash?: string;
  tags: Tag[];
};

export type Tag = {
  id: number;
  name: string;
};

export type RecipeStatus = "pending_curation" | "live" | "hidden";

export const parseTags = (input: unknown): Tag[] => {
  try {
    const parsed = JSON.parse(String(input));
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (tag): tag is { id: number | string; name: string } =>
          tag !== null && tag !== undefined && typeof tag.name === "string",
      )
      .map((tag) => ({ id: Number(tag.id), name: tag.name }))
      .filter((tag) => Number.isFinite(tag.id));
  } catch {
    return [];
  }
};

export const normalizeStatus = (value: unknown): RecipeStatus => {
  if (value === "pending_curation" || value === "live" || value === "hidden") {
    return value;
  }

  return "live";
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const collectTextValues = (value: unknown, output: string[]) => {
  if (typeof value === "string") {
    const cleaned = stripHtml(value);
    if (cleaned) output.push(cleaned);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectTextValues(item, output);
    return;
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectTextValues(nested, output);
    }
  }
};

export const extractEditorJsText = (input: string): string => {
  try {
    const parsed = JSON.parse(input) as { blocks?: unknown[] };
    if (!parsed || !Array.isArray(parsed.blocks)) {
      return stripHtml(input);
    }

    const output: string[] = [];
    for (const block of parsed.blocks) {
      if (block && typeof block === "object" && "data" in block) {
        collectTextValues((block as { data?: unknown }).data, output);
      }
    }

    return output.join(" ").trim();
  } catch {
    return stripHtml(input);
  }
};
