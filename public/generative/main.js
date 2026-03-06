const SVG_NS = "http://www.w3.org/2000/svg";
const ART_WIDTH = 1200;
const ART_HEIGHT = 630;
const SHAPE_BORDER_WIDTH = 2;
const SHAPE_BORDER_COLOR = "var(--color-art-black)";
const SEED_LINE_MAX_CHARS = 18;
const SEED_MAX_LINES = 4;

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
const TOKEN_COLOR_VALUES = Object.fromEntries(
  ART_TOKEN_COLOR_NAMES.map((name) => [name, `var(${name})`]),
);
const BACKGROUND_TOKEN_NAMES = ART_TOKEN_COLOR_NAMES.filter(
  (name) => name !== "--color-art-black",
);

const artboard = document.getElementById("artboard");
const seedForm = document.getElementById("seed-form");
const seedInput = document.getElementById("seed-input");
const activeSeed = document.getElementById("active-seed");
const layoutName = document.getElementById("layout-name");
const rootStyles = getComputedStyle(document.documentElement);

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomRange(random, min, max) {
  return random() * (max - min) + min;
}

function pick(random, list) {
  return list[randomInt(random, 0, list.length - 1)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function svgElement(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([name, value]) => {
    node.setAttribute(name, String(value));
  });
  return node;
}

function resolveTokenColor(tokenName) {
  return rootStyles.getPropertyValue(tokenName).trim();
}

function serializeSvgForBackground(svgNode) {
  const clone = svgNode.cloneNode(true);
  clone.setAttribute("xmlns", SVG_NS);

  let markup = new XMLSerializer().serializeToString(clone);
  for (const tokenName of ART_TOKEN_COLOR_NAMES) {
    const resolved = resolveTokenColor(tokenName);
    if (!resolved) {
      continue;
    }
    markup = markup.split(`var(${tokenName})`).join(resolved);
  }

  return markup;
}

function applyPageBackgroundFromArt(svgNode) {
  const svgMarkup = serializeSvgForBackground(svgNode);
  const dataUrl = `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}")`;

  document.body.style.backgroundImage = dataUrl;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
}

function readSeedFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const namedSeed = params.get("seed") || params.get("q");
  if (namedSeed) {
    const normalized = normalizeSeedValue(namedSeed);
    if (normalized) {
      return normalized;
    }
  }

  const rawQuery = window.location.search.replace(/^\?/, "");
  return normalizeSeedValue(rawQuery) || "aerostack";
}

function normalizeSeedValue(seedText) {
  return String(seedText || "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function wrapSeedLines(seedText, maxChars, maxLines) {
  const normalized = normalizeSeedValue(seedText);
  if (!normalized) {
    return ["aerostack"];
  }

  const explicitLines = normalized.split("\n");
  const lines = [];
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

  return lines.length > 0 ? lines.slice(0, maxLines) : ["aerostack"];
}

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

function createLayout(random, shapeCount) {
  const mode = pick(random, ["scatter", "radial", "grid", "bands"]);
  const layout = { mode };

  if (mode === "grid") {
    const cols = randomInt(random, 3, 6);
    const rows = Math.ceil(shapeCount / cols);
    layout.cols = cols;
    layout.rows = rows;
  }

  if (mode === "bands") {
    layout.bands = randomInt(random, 2, 5);
  }

  return layout;
}

function pointFor(layout, index, count, random) {
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

function randomScale(random, forceVeryLarge = false) {
  if (forceVeryLarge) {
    return randomRange(random, 4.6, 7.8);
  }

  if (random() < 0.25) {
    return randomRange(random, 2.4, 5.8);
  }
  return 1;
}

function drawBackground(svg, backgroundColor) {
  svg.appendChild(
    svgElement("rect", {
      x: 0,
      y: 0,
      width: ART_WIDTH,
      height: ART_HEIGHT,
      fill: backgroundColor,
    }),
  );
}

function drawCircle(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  svg.appendChild(
    svgElement("circle", {
      cx: x.toFixed(2),
      cy: y.toFixed(2),
      r: (randomRange(random, 15, 78) * scale).toFixed(2),
      fill: pick(random, palette),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": SHAPE_BORDER_WIDTH,
    }),
  );
}

function drawRect(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  const width = randomRange(random, 60, 230) * scale;
  const height = randomRange(random, 34, 180) * scale;
  const rotation = randomRange(random, 0, 360).toFixed(2);
  svg.appendChild(
    svgElement("rect", {
      x: (x - width * 0.5).toFixed(2),
      y: (y - height * 0.5).toFixed(2),
      width: width.toFixed(2),
      height: height.toFixed(2),
      fill: pick(random, palette),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": SHAPE_BORDER_WIDTH,
      transform: `rotate(${rotation} ${x.toFixed(2)} ${y.toFixed(2)})`,
    }),
  );
}

function drawPolygon(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  const size = randomRange(random, 28, 96) * scale;
  const pointCount = pick(random, [6, 7, 7, 7, 8, 8, 8, 8, 9, 10]);
  const baseAngle = randomRange(random, 0, Math.PI * 2);
  const points = [];

  for (let i = 0; i < pointCount; i += 1) {
    const angle = baseAngle + i * ((Math.PI * 2) / pointCount);
    const radius = size * randomRange(random, 0.45, 1.35);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }

  svg.appendChild(
    svgElement("polygon", {
      points: points.join(" "),
      fill: pick(random, palette),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": SHAPE_BORDER_WIDTH,
    }),
  );
}

function drawTriangleShard(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  const size = randomRange(random, 34, 120) * scale;
  const baseAngle = randomRange(random, 0, Math.PI * 2);
  const points = [];

  for (let i = 0; i < 3; i += 1) {
    const angle = baseAngle + i * ((Math.PI * 2) / 3) + randomRange(random, -0.28, 0.28);
    const radius = size * randomRange(random, 0.62, 1.42);
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    });
  }

  svg.appendChild(
    svgElement("polygon", {
      points: points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "),
      fill: pick(random, palette),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": SHAPE_BORDER_WIDTH,
    }),
  );
}

function drawStar(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  const arms = randomInt(random, 5, 10);
  const outer = randomRange(random, 30, 92) * scale;
  const inner = outer * randomRange(random, 0.22, 0.58);
  const rotation = randomRange(random, 0, Math.PI * 2);
  const points = [];

  for (let i = 0; i < arms * 2; i += 1) {
    const angle = rotation + (i * Math.PI) / arms;
    const radius = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }

  svg.appendChild(
    svgElement("polygon", {
      points: points.join(" "),
      fill: pick(random, palette),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": SHAPE_BORDER_WIDTH,
    }),
  );
}

function drawLine(svg, random, palette, x, y, forceVeryLarge = false) {
  const scale = randomScale(random, forceVeryLarge);
  const angle = randomRange(random, 0, Math.PI * 2);
  const length = randomRange(random, 70, 260) * scale;
  const strokeWidth = randomRange(random, 2, 16) * Math.max(1, scale * 0.75);
  const x2 = x + Math.cos(angle) * length;
  const y2 = y + Math.sin(angle) * length;

  svg.appendChild(
    svgElement("line", {
      x1: x.toFixed(2),
      y1: y.toFixed(2),
      x2: x2.toFixed(2),
      y2: y2.toFixed(2),
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": (strokeWidth + SHAPE_BORDER_WIDTH).toFixed(2),
      "stroke-linecap": "butt",
    }),
  );

  svg.appendChild(
    svgElement("line", {
      x1: x.toFixed(2),
      y1: y.toFixed(2),
      x2: x2.toFixed(2),
      y2: y2.toFixed(2),
      stroke: pick(random, palette),
      "stroke-width": strokeWidth.toFixed(2),
      "stroke-linecap": "butt",
    }),
  );
}

function drawWavyLine(svg, random, palette, x, y, forceVeryLarge = false) {
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
  const points = [];

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

  let pathData = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midY = (points[i].y + points[i + 1].y) * 0.5;
    pathData += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  pathData += ` Q ${secondLast.x.toFixed(2)} ${secondLast.y.toFixed(2)} ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  svg.appendChild(
    svgElement("path", {
      d: pathData,
      fill: "none",
      stroke: SHAPE_BORDER_COLOR,
      "stroke-width": (strokeWidth + SHAPE_BORDER_WIDTH).toFixed(2),
      "stroke-linecap": "butt",
      "stroke-linejoin": "miter",
    }),
  );

  svg.appendChild(
    svgElement("path", {
      d: pathData,
      fill: "none",
      stroke: pick(random, palette),
      "stroke-width": strokeWidth.toFixed(2),
      "stroke-linecap": "butt",
      "stroke-linejoin": "miter",
    }),
  );
}

function drawShapes(svg, random, palette, layout, shapeCount) {
  const drawFns = [
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
  for (let i = 0; i < shapeCount; i += 1) {
    const point = pointFor(layout, i, shapeCount, random);
    const x = clamp(point.x, -420, ART_WIDTH + 420);
    const y = clamp(point.y, -420, ART_HEIGHT + 420);
    const drawShape = pick(random, drawFns);
    drawShape(svg, random, palette, x, y, i === veryLargeShapeIndex);
  }
}

function drawSeedLabel(svg, colors, seedText) {
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

    svg.appendChild(
      svgElement("rect", {
        x: rectX.toFixed(2),
        y: rectY.toFixed(2),
        width: lineBoxWidth.toFixed(2),
        height: lineBoxHeight.toFixed(2),
        fill: colors["--color-art-black"],
        transform: `rotate(${rotation.toFixed(2)} ${rectCenterX.toFixed(2)} ${rectCenterY.toFixed(2)})`,
      }),
    );

    const textNode = svgElement("text", {
      x: (baseX + boxPaddingX).toFixed(2),
      y: (y + boxPaddingY + fontSize * 0.88).toFixed(2),
      fill: "#ffffff",
      "font-size": fontSize.toFixed(2),
      "font-family": "\"Avenir Next\", \"Trebuchet MS\", sans-serif",
      "font-weight": 800,
      "text-anchor": "start",
      "letter-spacing": "0.01em",
    });
    textNode.textContent = line;
    svg.appendChild(textNode);
  }
}

function estimateTextWidth(text, fontSize) {
  return Math.max(1, text.length) * (fontSize * 0.59);
}

function render(seedText) {
  const random = mulberry32(hashSeed(seedText));
  const palette = createPalette();
  const backgroundPalette = BACKGROUND_TOKEN_NAMES.map((name) => TOKEN_COLOR_VALUES[name]);
  const backgroundColor = pick(random, backgroundPalette);
  const shapePalette = palette.filter((color) => color !== backgroundColor);
  const shapeCount = randomInt(random, 5, 10);
  const layout = createLayout(random, shapeCount);

  artboard.replaceChildren();
  drawBackground(artboard, backgroundColor);
  drawShapes(artboard, random, shapePalette, layout, shapeCount);
  applyPageBackgroundFromArt(artboard);
  drawSeedLabel(artboard, TOKEN_COLOR_VALUES, seedText);

  activeSeed.textContent = seedText;
  layoutName.textContent = layout.mode;
}

function updateUrl(seedText) {
  const url = new URL(window.location.href);
  if (seedText) {
    url.searchParams.set("seed", seedText);
    url.searchParams.delete("q");
  } else {
    url.search = "";
  }
  window.history.replaceState({}, "", url);
}

const initialSeed = readSeedFromQuery();
seedInput.value = initialSeed.replace(/\n/g, "\\n");
render(initialSeed);

seedForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextSeed = normalizeSeedValue(seedInput.value) || "aerostack";
  updateUrl(nextSeed);
  render(nextSeed);
});
