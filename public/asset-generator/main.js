import {
  DEFAULT_SEED,
  FAVICON_SIZES,
  normalizeFaviconSize,
  createFaviconSvg,
  generateOgArt,
  normalizeSeedValue,
  readSeedFromSearch,
} from "/shared/art-generator.js";

const seedForm = document.getElementById("seed-form");
const seedInput = document.getElementById("seed-input");
const ogArtboard = document.getElementById("og-artboard");
const faviconPreviewGrid = document.getElementById("favicon-preview-grid");
const ogOpen = document.getElementById("og-open");
const ogDownload = document.getElementById("og-download");
const faviconOpen = document.getElementById("favicon-open");
const faviconDownload = document.getElementById("favicon-download");

let renderTimer;
const searchParams = new URLSearchParams(window.location.search);
let selectedFaviconSize = normalizeFaviconSize(
  searchParams.get("faviconSize") || searchParams.get("size"),
);
let currentSeed = DEFAULT_SEED;
let currentFaviconSvg = "";

function renderSvgPreview(targetNode, svgMarkup) {
  if (!targetNode) {
    return;
  }
  targetNode.innerHTML = svgMarkup;
}

function applyPageBackground(svgMarkup) {
  const encoded = encodeURIComponent(svgMarkup);
  document.body.style.backgroundImage = `url("data:image/svg+xml;charset=UTF-8,${encoded}")`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
}

function buildRasterUrl(path, seedText, faviconSize) {
  const params = new URLSearchParams();
  params.set("seed", seedText);
  if (faviconSize) {
    params.set("size", String(faviconSize));
  }
  return `${path}?${params.toString()}`;
}

function safeFilePart(seedText) {
  const compact = seedText.replace(/\s+/g, "-").replace(/\n+/g, "-");
  const safe = compact.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 60);
  return safe || DEFAULT_SEED;
}

function updateRasterLinks(seedText, faviconSize) {
  const ogUrl = buildRasterUrl("/api/og-image", seedText);
  const faviconUrl = buildRasterUrl("/api/favicon", seedText, faviconSize);
  const seedSlug = safeFilePart(seedText);

  if (ogOpen) {
    ogOpen.href = ogUrl;
  }
  if (ogDownload) {
    ogDownload.href = ogUrl;
    ogDownload.setAttribute("download", `${seedSlug}-og.png`);
  }
  if (faviconOpen) {
    faviconOpen.href = faviconUrl;
    faviconOpen.title = `Open ${faviconSize}x${faviconSize} PNG`;
  }
  if (faviconDownload) {
    faviconDownload.href = faviconUrl;
    faviconDownload.title = `Download ${faviconSize}x${faviconSize} PNG`;
    faviconDownload.setAttribute("download", `${seedSlug}-favicon.png`);
  }
}

function updateUrl(seedText) {
  const url = new URL(window.location.href);
  if (seedText) {
    url.searchParams.set("seed", seedText);
    url.searchParams.delete("q");
  } else {
    url.search = "";
  }
  url.searchParams.set("faviconSize", String(selectedFaviconSize));
  window.history.replaceState({}, "", url);
}

function previewDisplaySize(size) {
  return Math.max(30, Math.min(96, Math.round(size * 1.25)));
}

function renderFaviconSizePreviews(svgMarkup) {
  if (!faviconPreviewGrid) {
    return;
  }

  faviconPreviewGrid.replaceChildren();

  for (const size of FAVICON_SIZES) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = `favicon-size-option${size === selectedFaviconSize ? " is-active" : ""}`;
    option.setAttribute("aria-label", `Use ${size} by ${size} favicon size`);
    option.title = `${size}x${size}`;

    const frame = document.createElement("div");
    frame.className = "favicon-size-frame";
    const displaySize = previewDisplaySize(size);
    frame.style.width = `${displaySize}px`;
    frame.style.height = `${displaySize}px`;
    frame.innerHTML = svgMarkup;

    const label = document.createElement("span");
    label.className = "favicon-size-label";
    label.textContent = `${size}x${size}`;

    option.append(frame, label);
    option.addEventListener("click", () => {
      selectedFaviconSize = size;
      renderFaviconSizePreviews(currentFaviconSvg);
      updateRasterLinks(currentSeed, selectedFaviconSize);
      updateUrl(currentSeed);
    });

    faviconPreviewGrid.appendChild(option);
  }
}

function render(seedText) {
  const normalizedSeed = normalizeSeedValue(seedText) || DEFAULT_SEED;
  currentSeed = normalizedSeed;
  const og = generateOgArt(normalizedSeed);
  currentFaviconSvg = createFaviconSvg(normalizedSeed);

  renderSvgPreview(ogArtboard, og.svg);
  renderFaviconSizePreviews(currentFaviconSvg);
  applyPageBackground(og.backgroundSvg);
  updateRasterLinks(normalizedSeed, selectedFaviconSize);
}

const initialSeed = readSeedFromSearch(window.location.search) || DEFAULT_SEED;
seedInput.value = initialSeed.replace(/\n/g, "\\n");
render(initialSeed);

seedInput.addEventListener("input", () => {
  clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => {
    const nextSeed = normalizeSeedValue(seedInput.value) || DEFAULT_SEED;
    updateUrl(nextSeed);
    render(nextSeed);
  }, 120);
});

seedForm.addEventListener("submit", (event) => {
  event.preventDefault();
});
