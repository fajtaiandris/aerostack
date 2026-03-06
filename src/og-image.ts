import { Context } from "hono";
import {
  ART_WIDTH,
  createOgSvg,
  readSeedFromSearch,
} from "../public/shared/art-generator.js";
import { getFontBuffers, pngImageResponse, rasterizeSvgToPng } from "./rasterize-svg";

const OG_FONT_PATHS = [
  "/fonts/avenir-next.ttc",
  "/fonts/trebuchet-ms-bold.ttf",
  "/fonts/trebuchet-ms.ttf",
];

export const ogImage = async (c: Context<{ Bindings: Env }>) => {
  const seed = readSeedFromSearch(new URL(c.req.url).search);

  try {
    const svg = createOgSvg(seed);
    const fontBuffers = await getFontBuffers(c, OG_FONT_PATHS);
    const pngData = await rasterizeSvgToPng(svg, ART_WIDTH, fontBuffers);
    return pngImageResponse(pngData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        error: "Failed to render OG image",
        message,
        seed,
      },
      500,
    );
  }
};
