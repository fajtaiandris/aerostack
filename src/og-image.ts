import { Context } from "hono";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

const SVG_NS = "http://www.w3.org/2000/svg";
const ART_WIDTH = 1200;
const ART_HEIGHT = 630;
const SHAPE_BORDER_WIDTH = 2;
const SEED_LINE_MAX_CHARS = 18;
const SEED_MAX_LINES = 4;
const DEFAULT_SEED = "aerostack";

const ART_TOKEN_COLOR_NAMES = [
  "--color-art-black",
  "--color-art-purple-dark",
  "--color-art-purple",
  "--color-art-pink",
  "--color-art-pink-light",
  "--color-art-cyan",
  "--color-art-yellow",
  "--color-art-orange",
  "--color-art-red",
];
const TOKEN_COLOR_VALUES: Record<string, string> = {
  "--color-art-black": "#131016",
  "--color-art-purple-dark": "#4c2a8a",
  "--color-art-purple": "#7142b2",
  "--color-art-pink": "#ef86be",
  "--color-art-pink-light": "#f5b7d8",
  "--color-art-cyan": "#30b7c5",
  "--color-art-yellow": "#f2dd28",
  "--color-art-orange": "#ff8f32",
  "--color-art-red": "#fa4a3a",
};
const COLOR_BLACK = TOKEN_COLOR_VALUES["--color-art-black"];
const BACKGROUND_TOKEN_NAMES = ART_TOKEN_COLOR_NAMES.filter(
  (name) => name !== "--color-art-black",
);

function createPalette() {
  const ordered = [
    TOKEN_COLOR_VALUES["--color-art-red"],
    TOKEN_COLOR_VALUES["--color-art-orange"],
    TOKEN_COLOR_VALUES["--color-art-yellow"],
    TOKEN_COLOR_VALUES["--color-art-cyan"],
    TOKEN_COLOR_VALUES["--color-art-purple"],
    TOKEN_COLOR_VALUES["--color-art-purple-dark"],
    TOKEN_COLOR_VALUES["--color-art-pink"],
    TOKEN_COLOR_VALUES["--color-art-pink-light"],
    TOKEN_COLOR_VALUES["--color-art-black"],
  ];

  return Array.from(new Set(ordered));
}

function createBackgroundPalette() {
  return BACKGROUND_TOKEN_NAMES.map((name) => TOKEN_COLOR_VALUES[name]);
}

const DEFAULT_COLOR_FALLBACK = [
  TOKEN_COLOR_VALUES["--color-art-red"],
  TOKEN_COLOR_VALUES["--color-art-orange"],
  TOKEN_COLOR_VALUES["--color-art-yellow"],
  TOKEN_COLOR_VALUES["--color-art-cyan"],
  TOKEN_COLOR_VALUES["--color-art-purple"],
  TOKEN_COLOR_VALUES["--color-art-purple-dark"],
  TOKEN_COLOR_VALUES["--color-art-pink"],
  TOKEN_COLOR_VALUES["--color-art-pink-light"],
];

type Layout =
  | { mode: "scatter" | "radial" }
  | { mode: "grid"; cols: number; rows: number }
  | { mode: "bands"; bands: number };

type ShapeDrawFn = (
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) => string;

let resvgInitPromise: Promise<void> | null = null;
let fontBuffersPromise: Promise<Uint8Array[]> | null = null;

function ensureResvgReady() {
  if (!resvgInitPromise) {
    resvgInitPromise = initWasm(resvgWasm as any);
  }
  return resvgInitPromise;
}

function getFontBuffers(c: Context<{ Bindings: Env }>) {
  if (!fontBuffersPromise) {
    fontBuffersPromise = (async () => {
      const fontPaths = [
        "/fonts/avenir-next.ttc",
        "/fonts/trebuchet-ms-bold.ttf",
        "/fonts/trebuchet-ms.ttf",
      ];
      const buffers: Uint8Array[] = [];

      for (const path of fontPaths) {
        const fontAsset = await c.env.ASSETS.fetch(new Request(new URL(path, c.req.url)));
        if (!fontAsset.ok) {
          continue;
        }

        const fontArrayBuffer = await fontAsset.arrayBuffer();
        buffers.push(new Uint8Array(fontArrayBuffer));
      }

      return buffers;
    })();
  }

  return fontBuffersPromise;
}

export const ogImage = async (c: Context<{ Bindings: Env }>) => {
  const url = new URL(c.req.url);
  const seed = readSeedFromUrl(url);

  try {
    await ensureResvgReady();
    const fontBuffers = await getFontBuffers(c);

    const svg = renderSeededSvg(seed);
    const options: any = {
      fitTo: {
        mode: "width",
        value: ART_WIDTH,
      },
    };

    if (fontBuffers.length > 0) {
      options.font = {
        fontBuffers,
        defaultFontFamily: "Avenir Next",
      };
    }

    const resvg = new Resvg(svg, options);
    const pngData = resvg.render().asPng();

    return new Response(pngData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=0, s-maxage=86400",
      },
    });
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

function renderSeededSvg(seedText: string): string {
  const random = mulberry32(hashSeed(seedText));
  const palette = createPalette();
  const backgroundPalette = createBackgroundPalette();
  const backgroundColor = pick(random, backgroundPalette);
  const shapePalette = palette.filter((color) => color !== backgroundColor);
  const safeShapePalette = shapePalette.length > 0 ? shapePalette : DEFAULT_COLOR_FALLBACK;
  const shapeCount = randomInt(random, 5, 10);
  const layout = createLayout(random, shapeCount);
  const shapes = drawShapes(random, safeShapePalette, layout, shapeCount);
  const text = drawSeedLabel(seedText);

  return [
    `<svg xmlns="${SVG_NS}" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" width="${ART_WIDTH}" height="${ART_HEIGHT}" role="img" aria-label="Deterministic generative artwork">`,
    `<rect x="0" y="0" width="${ART_WIDTH}" height="${ART_HEIGHT}" fill="${backgroundColor}" />`,
    shapes,
    text,
    "</svg>",
  ].join("");
}

function drawShapes(random: () => number, palette: string[], layout: Layout, shapeCount: number) {
  const drawFns: ShapeDrawFn[] = [
    drawCircle,
    drawRect,
    drawPolygon,
    drawPolygon,
    drawTriangleShard,
    drawStar,
    drawLine,
    drawWavyLine,
  ];

  const veryLargeShapeIndex = shapeCount - 1;
  const parts: string[] = [];
  for (let i = 0; i < shapeCount; i += 1) {
    const point = pointFor(layout, i, shapeCount, random);
    const x = clamp(point.x, -420, ART_WIDTH + 420);
    const y = clamp(point.y, -420, ART_HEIGHT + 420);
    const drawShape = pick(random, drawFns);
    parts.push(drawShape(random, palette, x, y, i === veryLargeShapeIndex));
  }
  return parts.join("");
}

function drawCircle(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const r = randomRange(random, 15, 78) * scale;
  return `<circle cx="${fixed2(x)}" cy="${fixed2(y)}" r="${fixed2(r)}" fill="${pick(random, palette)}" stroke="${COLOR_BLACK}" stroke-width="${SHAPE_BORDER_WIDTH}" />`;
}

function drawRect(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const width = randomRange(random, 60, 230) * scale;
  const height = randomRange(random, 34, 180) * scale;
  const rotation = randomRange(random, 0, 360);
  return `<rect x="${fixed2(x - width * 0.5)}" y="${fixed2(y - height * 0.5)}" width="${fixed2(width)}" height="${fixed2(height)}" fill="${pick(random, palette)}" stroke="${COLOR_BLACK}" stroke-width="${SHAPE_BORDER_WIDTH}" transform="rotate(${fixed2(rotation)} ${fixed2(x)} ${fixed2(y)})" />`;
}

function drawPolygon(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const size = randomRange(random, 28, 96) * scale;
  const pointCount = pick(random, [6, 7, 7, 7, 8, 8, 8, 8, 9, 10]);
  const baseAngle = randomRange(random, 0, Math.PI * 2);
  const points: string[] = [];

  for (let i = 0; i < pointCount; i += 1) {
    const angle = baseAngle + i * ((Math.PI * 2) / pointCount);
    const radius = size * randomRange(random, 0.45, 1.35);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    points.push(`${fixed2(px)},${fixed2(py)}`);
  }

  return `<polygon points="${points.join(" ")}" fill="${pick(random, palette)}" stroke="${COLOR_BLACK}" stroke-width="${SHAPE_BORDER_WIDTH}" />`;
}

function drawTriangleShard(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const size = randomRange(random, 34, 120) * scale;
  const baseAngle = randomRange(random, 0, Math.PI * 2);
  const points: string[] = [];

  for (let i = 0; i < 3; i += 1) {
    const angle = baseAngle + i * ((Math.PI * 2) / 3) + randomRange(random, -0.28, 0.28);
    const radius = size * randomRange(random, 0.62, 1.42);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    points.push(`${fixed2(px)},${fixed2(py)}`);
  }

  return `<polygon points="${points.join(" ")}" fill="${pick(random, palette)}" stroke="${COLOR_BLACK}" stroke-width="${SHAPE_BORDER_WIDTH}" />`;
}

function drawStar(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const arms = randomInt(random, 5, 10);
  const outer = randomRange(random, 30, 92) * scale;
  const inner = outer * randomRange(random, 0.22, 0.58);
  const rotation = randomRange(random, 0, Math.PI * 2);
  const points: string[] = [];

  for (let i = 0; i < arms * 2; i += 1) {
    const angle = rotation + (i * Math.PI) / arms;
    const radius = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    points.push(`${fixed2(px)},${fixed2(py)}`);
  }

  return `<polygon points="${points.join(" ")}" fill="${pick(random, palette)}" stroke="${COLOR_BLACK}" stroke-width="${SHAPE_BORDER_WIDTH}" />`;
}

function drawLine(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const angle = randomRange(random, 0, Math.PI * 2);
  const length = randomRange(random, 70, 260) * scale;
  const strokeWidth = randomRange(random, 2, 16) * Math.max(1, scale * 0.75);
  const x2 = x + Math.cos(angle) * length;
  const y2 = y + Math.sin(angle) * length;
  const color = pick(random, palette);

  return [
    `<line x1="${fixed2(x)}" y1="${fixed2(y)}" x2="${fixed2(x2)}" y2="${fixed2(y2)}" stroke="${COLOR_BLACK}" stroke-width="${fixed2(strokeWidth + SHAPE_BORDER_WIDTH)}" stroke-linecap="butt" />`,
    `<line x1="${fixed2(x)}" y1="${fixed2(y)}" x2="${fixed2(x2)}" y2="${fixed2(y2)}" stroke="${color}" stroke-width="${fixed2(strokeWidth)}" stroke-linecap="butt" />`,
  ].join("");
}

function drawWavyLine(
  random: () => number,
  palette: string[],
  x: number,
  y: number,
  forceVeryLarge: boolean,
) {
  const scale = randomScale(random, forceVeryLarge);
  const angle = randomRange(random, 0, Math.PI * 2);
  const length = randomRange(random, 180, 460) * scale;
  const amplitude = randomRange(random, 14, 72) * scale;
  const waveCount = randomRange(random, 1.2, 4.2);
  const phase = randomRange(random, 0, Math.PI * 2);
  const strokeWidth = randomRange(random, 2, 14) * Math.max(1, scale * 0.75);
  const steps = randomInt(random, 14, 26);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < steps; i += 1) {
    const t = i / Math.max(1, steps - 1);
    const localX = (t - 0.5) * length;
    const localY =
      Math.sin(t * Math.PI * 2 * waveCount + phase) * amplitude +
      Math.sin(t * Math.PI * 2 * (waveCount * 2.1) + phase * 0.73) * (amplitude * 0.3);
    const px = x + localX * cos - localY * sin;
    const py = y + localX * sin + localY * cos;
    points.push({ x: px, y: py });
  }

  let pathData = `M ${fixed2(points[0].x)} ${fixed2(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midY = (points[i].y + points[i + 1].y) * 0.5;
    pathData += ` Q ${fixed2(points[i].x)} ${fixed2(points[i].y)} ${fixed2(midX)} ${fixed2(midY)}`;
  }
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  pathData += ` Q ${fixed2(secondLast.x)} ${fixed2(secondLast.y)} ${fixed2(last.x)} ${fixed2(last.y)}`;
  const color = pick(random, palette);

  return [
    `<path d="${pathData}" fill="none" stroke="${COLOR_BLACK}" stroke-width="${fixed2(strokeWidth + SHAPE_BORDER_WIDTH)}" stroke-linecap="butt" stroke-linejoin="miter" />`,
    `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${fixed2(strokeWidth)}" stroke-linecap="butt" stroke-linejoin="miter" />`,
  ].join("");
}

function drawSeedLabel(seedText: string) {
  const lines = wrapSeedLines(seedText, SEED_LINE_MAX_CHARS, SEED_MAX_LINES);
  const margin = 26;
  const boxPaddingX = 30;
  const boxPaddingY = 18;
  const lineGap = 12;
  const maxBannerWidth = ART_WIDTH - margin * 2;
  const maxBannerHeight = ART_HEIGHT * 0.5;
  const longestLineLength = Math.max(...lines.map((line) => line.length), 1);
  const fontFromWidth = (maxBannerWidth - boxPaddingX * 2) / (longestLineLength * 0.59);
  const fontFromHeight =
    (maxBannerHeight - (lines.length - 1) * lineGap - lines.length * boxPaddingY * 2) /
    Math.max(1, lines.length * 1.05);
  const fontSize = clamp(Math.floor(Math.min(fontFromWidth, fontFromHeight)), 48, 210);
  const lineHeight = fontSize * 1.05;
  const lineBoxHeight = lineHeight + boxPaddingY * 2;
  const totalHeight = lines.length * lineBoxHeight + (lines.length - 1) * lineGap;
  const baseX = margin;
  const baseY = ART_HEIGHT - totalHeight - margin;
  const textParts: string[] = [];
  const labelRandom = mulberry32(hashSeed(`label:${seedText}`));

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const y = baseY + i * (lineBoxHeight + lineGap);
    const textWidth = estimateTextWidth(line, fontSize);
    const lineBoxWidth = clamp(textWidth + boxPaddingX * 2, 180, maxBannerWidth);
    const jitterX = randomRange(labelRandom, -6, 6);
    const jitterY = randomRange(labelRandom, -4, 4);
    const rotation = randomRange(labelRandom, -2.2, 2.2);
    const rectX = baseX + jitterX;
    const rectY = y + jitterY;
    const rectCenterX = rectX + lineBoxWidth * 0.5;
    const rectCenterY = rectY + lineBoxHeight * 0.5;

    textParts.push(
      `<rect x="${fixed2(rectX)}" y="${fixed2(rectY)}" width="${fixed2(lineBoxWidth)}" height="${fixed2(lineBoxHeight)}" fill="${COLOR_BLACK}" transform="rotate(${fixed2(rotation)} ${fixed2(rectCenterX)} ${fixed2(rectCenterY)})" />`,
    );
    textParts.push(
      `<text x="${fixed2(baseX + boxPaddingX)}" y="${fixed2(y + boxPaddingY + fontSize * 0.88)}" fill="#ffffff" font-size="${fixed2(fontSize)}" font-family="'Avenir Next', 'Trebuchet MS', sans-serif" font-weight="800" text-anchor="start" letter-spacing="0.01em">${escapeXml(line)}</text>`,
    );
  }

  return textParts.join("");
}

function wrapSeedLines(seedText: string, maxChars: number, maxLines: number) {
  const normalized = normalizeSeedValue(seedText);
  if (!normalized) {
    return [DEFAULT_SEED];
  }

  const explicitLines = normalized.split("\n");
  const lines: string[] = [];
  let overflow = false;

  for (let i = 0; i < explicitLines.length; i += 1) {
    let source = explicitLines[i].replace(/\s+/g, " ").trim();
    if (!source) {
      continue;
    }

    while (source.length > 0) {
      if (lines.length >= maxLines) {
        overflow = true;
        break;
      }

      let chunk = source.slice(0, maxChars);
      if (source.length > maxChars) {
        const breakAt = chunk.lastIndexOf(" ");
        if (breakAt > Math.floor(maxChars * 0.5)) {
          chunk = chunk.slice(0, breakAt);
        }
      }

      const trimmed = chunk.trim();
      if (!trimmed) {
        source = "";
        continue;
      }

      lines.push(trimmed);
      source = source.slice(chunk.length).trimStart();
    }

    if (overflow) {
      break;
    }
  }

  if ((overflow || lines.length > maxLines) && lines.length > 0) {
    const tail = lines[lines.length - 1];
    lines[lines.length - 1] = `${tail.slice(0, Math.max(1, maxChars - 1))}…`;
  }

  return lines.length > 0 ? lines.slice(0, maxLines) : [DEFAULT_SEED];
}

function createLayout(random: () => number, shapeCount: number): Layout {
  const mode = pick(random, ["scatter", "radial", "grid", "bands"] as const);
  if (mode === "grid") {
    const cols = randomInt(random, 3, 6);
    const rows = Math.ceil(shapeCount / cols);
    return { mode, cols, rows };
  }

  if (mode === "bands") {
    return { mode, bands: randomInt(random, 2, 5) };
  }

  return { mode };
}

function pointFor(layout: Layout, index: number, count: number, random: () => number) {
  if (layout.mode === "radial") {
    const angle =
      (index / Math.max(1, count)) * Math.PI * 2 + randomRange(random, -0.45, 0.45);
    const radius = randomRange(random, ART_HEIGHT * 0.14, ART_HEIGHT * 0.5);
    return {
      x: ART_WIDTH * 0.5 + Math.cos(angle) * radius,
      y: ART_HEIGHT * 0.5 + Math.sin(angle) * radius,
    };
  }

  if (layout.mode === "grid") {
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    const cellW = ART_WIDTH / layout.cols;
    const cellH = ART_HEIGHT / layout.rows;
    return {
      x: (col + 0.5) * cellW + randomRange(random, -cellW * 0.38, cellW * 0.38),
      y: (row + 0.5) * cellH + randomRange(random, -cellH * 0.38, cellH * 0.38),
    };
  }

  if (layout.mode === "bands") {
    const bandHeight = ART_HEIGHT / layout.bands;
    const bandIndex = randomInt(random, 0, layout.bands - 1);
    return {
      x: randomRange(random, 0, ART_WIDTH),
      y:
        (bandIndex + 0.5) * bandHeight +
        randomRange(random, -bandHeight * 0.45, bandHeight * 0.45),
    };
  }

  return {
    x: randomRange(random, 0, ART_WIDTH),
    y: randomRange(random, 0, ART_HEIGHT),
  };
}

function randomScale(random: () => number, forceVeryLarge = false) {
  if (forceVeryLarge) {
    return randomRange(random, 4.6, 7.8);
  }

  if (random() < 0.25) {
    return randomRange(random, 2.4, 5.8);
  }

  return 1;
}

function readSeedFromUrl(url: URL) {
  const namedSeed = url.searchParams.get("seed") || url.searchParams.get("q");
  if (namedSeed) {
    const normalized = normalizeSeedValue(namedSeed);
    if (normalized) {
      return normalized;
    }
  }

  const rawQuery = url.search.replace(/^\?/, "");
  return normalizeSeedValue(rawQuery) || DEFAULT_SEED;
}

function normalizeSeedValue(seedText: string) {
  return String(seedText || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function hashSeed(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomRange(random: () => number, min: number, max: number) {
  return random() * (max - min) + min;
}

function pick<T>(random: () => number, list: T[]) {
  return list[randomInt(random, 0, list.length - 1)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fixed2(value: number) {
  return value.toFixed(2);
}

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(1, text.length) * (fontSize * 0.59);
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
