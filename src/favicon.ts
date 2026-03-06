import { Context } from "hono";
import {
  createFaviconSvg,
  normalizeFaviconSize,
  readSeedFromSearch,
} from "../public/shared/art-generator.js";
import { pngImageResponse, rasterizeSvgToPng } from "./rasterize-svg";

export const faviconImage = async (c: Context<{ Bindings: Env }>) => {
  const url = new URL(c.req.url);
  const seed = readSeedFromSearch(url.search);
  const size = normalizeFaviconSize(url.searchParams.get("size"));

  try {
    const svg = createFaviconSvg(seed);
    const pngData = await rasterizeSvgToPng(svg, size);
    return pngImageResponse(pngData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        error: "Failed to render favicon image",
        message,
        seed,
        size,
      },
      500,
    );
  }
};
