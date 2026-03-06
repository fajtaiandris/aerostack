import { Context } from "hono";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

type WorkerContext = Context<{ Bindings: Env }>;

let resvgInitPromise: Promise<void> | null = null;
const fontBuffersByKey = new Map<string, Promise<Uint8Array[]>>();

function ensureResvgReady() {
  if (!resvgInitPromise) {
    resvgInitPromise = initWasm(resvgWasm as any);
  }

  return resvgInitPromise;
}

export async function rasterizeSvgToPng(
  svg: string,
  width: number,
  fontBuffers: Uint8Array[] = [],
) {
  await ensureResvgReady();

  const options: any = {
    fitTo: {
      mode: "width",
      value: width,
    },
  };

  if (fontBuffers.length > 0) {
    options.font = {
      fontBuffers,
      defaultFontFamily: "Avenir Next",
    };
  }

  const resvg = new Resvg(svg, options);
  return resvg.render().asPng();
}

export function pngImageResponse(pngData: Uint8Array) {
  return new Response(pngData, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}

export function getFontBuffers(
  c: WorkerContext,
  fontPaths: string[],
): Promise<Uint8Array[]> {
  const origin = new URL(c.req.url).origin;
  const cacheKey = `${origin}|${fontPaths.join(",")}`;

  if (!fontBuffersByKey.has(cacheKey)) {
    fontBuffersByKey.set(
      cacheKey,
      (async () => {
        const buffers: Uint8Array[] = [];
        for (const path of fontPaths) {
          const response = await c.env.ASSETS.fetch(new Request(new URL(path, origin)));
          if (!response.ok) {
            continue;
          }
          const arrayBuffer = await response.arrayBuffer();
          buffers.push(new Uint8Array(arrayBuffer));
        }
        return buffers;
      })(),
    );
  }

  return fontBuffersByKey.get(cacheKey)!;
}
