import { Context } from "hono";

export const sitemap = async (c: Context<{ Bindings: Env }>) => {
  const baseUrl = "https://aerostack.xyz";
  const kvKey = "sitemap.xml";

  const cached = await c.env.SITEMAP_KV.get(kvKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600",
      },
    });
  }

  const { results } = await c.env.aerostack_db
    .prepare(
      `
      SELECT slug, created_at
      FROM recipes
    `,
    )
    .all();

  const staticUrls = [
    { loc: `${baseUrl}/`, created_at: null },
    { loc: `${baseUrl}/search`, created_at: null },
    { loc: `${baseUrl}/contact`, created_at: null },
    { loc: `${baseUrl}/terms`, created_at: null },
  ];

  const recipeUrls = results.map((row: any) => ({
    loc: `${baseUrl}/recipe/${row.slug}`,
    created_at: row.created_at,
  }));

  const urls = staticUrls
    .concat(recipeUrls)
    .map((row: any) => {
      const loc = row.loc;
      const lastmod = row.created_at
        ? `<lastmod>${new Date(row.created_at).toISOString()}</lastmod>`
        : "";

      return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod}
  </url>`;
    })
    .join("");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  await c.env.SITEMAP_KV.put(kvKey, sitemapXml, {
    expirationTtl: 86400,
  });

  return new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
};

const escapeXml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
