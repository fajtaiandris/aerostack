const EDIT_HASH_PARAM = "edit";
const EDIT_HASH_PATTERN = /^[a-f0-9]{32}$/;

const url = new URL(window.location.href);
const editHash = (url.searchParams.get(EDIT_HASH_PARAM) || "")
  .trim()
  .toLowerCase();

if (url.searchParams.has(EDIT_HASH_PARAM)) {
  url.searchParams.delete(EDIT_HASH_PARAM);
  const cleanUrl =
    url.pathname +
    (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
    url.hash;
  history.replaceState(history.state, "", cleanUrl);
}

if (EDIT_HASH_PATTERN.test(editHash)) {
  renderEditBanner(editHash);
}

applyRecipeTitleBackground();

async function applyRecipeTitleBackground() {
  const titleNode = document.querySelector(".rv-title");
  const titleSeed = String(titleNode?.textContent || "").trim();
  if (!titleSeed) {
    return;
  }

  try {
    const { DEFAULT_SEED, generateOgArt, normalizeSeedValue } = await import(
      "/shared/art-generator.js"
    );

    const normalizedSeed = normalizeSeedValue(titleSeed) || DEFAULT_SEED;
    const { backgroundSvg } = generateOgArt(normalizedSeed);
    const onePixelBorderSvg = backgroundSvg.replace(
      /stroke-width="2(?:\.0+)?"/g,
      'stroke-width="1"',
    );
    const encoded = encodeURIComponent(onePixelBorderSvg);

    document.body.style.backgroundImage = `url("data:image/svg+xml;charset=UTF-8,${encoded}")`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center top";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
  } catch {
    // Keep the default body background if shared art generation fails.
  }
}

function renderEditBanner(editHashValue) {
  const editUrl = `${window.location.origin}/edit-recipe/${encodeURIComponent(editHashValue)}`;

  const banner = document.createElement("div");
  banner.className = "featured-banner";
  banner.setAttribute("role", "status");

  const badge = document.createElement("div");
  badge.className = "featured-badge";
  badge.textContent = "Heads Up";

  const content = document.createElement("div");
  content.className = "featured-content";

  const title = document.createElement("h2");
  title.textContent = "Your recipe is live!";

  const text = document.createElement("p");
  text.textContent =
    "Open your edit page and bookmark it now for later or lose access to editing forever.";

  const openButton = document.createElement("a");
  openButton.className = "featured-cta";
  openButton.href = editUrl;
  openButton.target = "_blank";
  openButton.rel = "noopener noreferrer";
  openButton.textContent = "Open edit page";

  content.append(title, text, openButton);
  banner.append(badge, content);

  const container = document.querySelector(".recipe-view-container");
  if (container) {
    container.prepend(banner);
  } else {
    const header = document.querySelector("header");
    if (header?.parentNode) {
      header.parentNode.insertBefore(banner, header.nextSibling);
      return;
    }

    document.body.prepend(banner);
  }
}
