import { Context } from "hono";

const VIEW_COOKIE_PREFIX = "rv_";
const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|preview|prerender|headless|uptime|monitor|wget|curl|python-requests|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot/i;

type RecipeContext = Context<{ Bindings: Env }>;

export const normalizeNonNegativeInt = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
};

export const formatViews = (count: number) =>
  count === 1 ? "1 view" : `${count} views`;

export const trackRecipeView = async (
  c: RecipeContext,
  recipeId: number,
  currentCount: number,
) => {
  let viewCount = currentCount;

  if (!shouldTrackView(c)) {
    return { viewCount, setCookie: null as string | null };
  }

  const cookieName = `${VIEW_COOKIE_PREFIX}${recipeId}`;
  const hasTrackedCookie = hasCookie(c.req.header("Cookie"), cookieName);
  if (hasTrackedCookie) {
    return { viewCount, setCookie: null as string | null };
  }

  const didIncrement = await incrementRecipeViewCount(c, recipeId);
  if (!didIncrement) {
    return { viewCount, setCookie: null as string | null };
  }

  viewCount += 1;
  return {
    viewCount,
    setCookie: buildViewCookie(c, cookieName),
  };
};

const incrementRecipeViewCount = async (c: RecipeContext, recipeId: number) => {
  try {
    await c.env.aerostack_db
      .prepare(
        `
        UPDATE recipes
        SET view_count = view_count + 1
        WHERE id = ?
      `,
      )
      .bind(recipeId)
      .run();

    return true;
  } catch {
    return false;
  }
};

const shouldTrackView = (c: RecipeContext) => {
  const accept = c.req.header("Accept") || "";
  if (!accept.includes("text/html")) return false;

  const purpose = `${c.req.header("Purpose") || ""} ${c.req.header("Sec-Purpose") || ""}`
    .trim()
    .toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("preview")) {
    return false;
  }

  const fetchMode = (c.req.header("Sec-Fetch-Mode") || "").toLowerCase();
  if (fetchMode && fetchMode !== "navigate") return false;

  const ua = c.req.header("User-Agent") || "";
  if (!ua || BOT_UA_PATTERN.test(ua)) return false;

  return true;
};

const hasCookie = (cookieHeader: string | undefined, cookieName: string) => {
  if (!cookieHeader) return false;

  return cookieHeader.split(";").some((part) => {
    const [name] = part.split("=", 1);
    return name?.trim() === cookieName;
  });
};

const buildViewCookie = (c: RecipeContext, cookieName: string) => {
  const isSecure = new URL(c.req.url).protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  return `${cookieName}=1; Max-Age=${VIEW_COOKIE_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
};
