/**
 * recipe.js – Renders a single recipe view page.
 *
 * Reads `?id=<number>` from the URL and looks it up in mock data.
 * The mock data shape matches the output of new-recipe.js:
 *   { id, title, tags: string[], content: { time, blocks, version } }
 *
 * The EditorJS "blocks" array supports: paragraph, header, list, delimiter.
 */

const MOCK_RECIPES = [
  {
    id: 1,
    title: "James Hoffmann's Ultimate AeroPress",
    author: "jhoffmann",
    date: "2025-12-14",
    votes: 342,
    tags: [
      "roast:light",
      "method:standard",
      "grind:medium-fine",
      "other:paper-filter",
    ],
    content: {
      time: 1734200000000,
      version: "2.28.2",
      blocks: [
        {
          type: "header",
          data: { text: "Overview", level: 2 },
        },
        {
          type: "paragraph",
          data: {
            text: "This is the recipe James Hoffmann popularised as the <b>ultimate</b> AeroPress technique. It's simple, forgiving, and produces an incredibly clean cup.",
          },
        },
        {
          type: "header",
          data: { text: "Parameters", level: 3 },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Coffee: <b>11 g</b>",
              "Water: <b>200 ml</b> at <b>100 °C</b>",
              "Grind: <b>Medium-fine</b>",
              "Brew time: <b>2 minutes</b>",
            ],
          },
        },
        {
          type: "header",
          data: { text: "Steps", level: 2 },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Place the AeroPress in standard orientation on your mug with a rinsed paper filter.",
              "Add <b>11 g</b> of medium-fine ground coffee.",
              "Pour <b>200 ml</b> of boiling water directly in.",
              "Give it a gentle swirl — no aggressive stirring.",
              "Place the plunger on top to create a seal and prevent dripping.",
              "Wait <b>2 minutes</b> total.",
              "Gently swirl one more time, then press slowly for about <b>30 seconds</b>.",
              "Stop pressing when you hear the hiss. Enjoy!",
            ],
          },
        },
        {
          type: "delimiter",
          data: {},
        },
        {
          type: "paragraph",
          data: {
            text: "This recipe works best with light-roast, high-quality single-origin beans. Adjust grind finer if the brew tastes sour, or coarser if it's bitter.",
          },
        },
      ],
    },
  },
];

/**
 * Convert an EditorJS blocks array into HTML.
 */
function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return `<p>${block.data.text}</p>`;

        case "header": {
          const tag = `h${block.data.level}`;
          return `<${tag}>${block.data.text}</${tag}>`;
        }

        case "list": {
          const tag = block.data.style === "ordered" ? "ol" : "ul";
          const items = block.data.items.map((i) => `<li>${i}</li>`).join("");
          return `<${tag}>${items}</${tag}>`;
        }

        case "delimiter":
          return `<hr />`;

        default:
          return "";
      }
    })
    .join("");
}

/**
 * Pretty-print a tag value.
 */
function formatTag(tag) {
  const [, value] = tag.split(":");
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function tagGroup(tag) {
  return tag.split(":")[0];
}

function timeAgo(dateStr) {
  const now = new Date("2026-02-17");
  const then = new Date(dateStr);
  const days = Math.floor((now - then) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("recipe-view");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  if (!recipe) {
    container.innerHTML = `
      <div class="recipe-not-found">
        <h1>Recipe not found</h1>
        <p>The recipe you're looking for doesn't exist or has been removed.</p>
        <a href="index.html" class="recipe-back-link">← Back to recipes</a>
      </div>`;
    return;
  }

  document.title = recipe.title + " – AeroPress Recipes";

  // Vote state
  let userVote = null; // null | "up" | "down"
  const baseVotes = recipe.votes;

  function displayVotes() {
    let v = baseVotes;
    if (userVote === "up") v += 1;
    if (userVote === "down") v -= 1;
    return v;
  }

  // Group tags by category
  const grouped = {};
  recipe.tags.forEach((t) => {
    const g = tagGroup(t);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(t);
  });

  const tagsHTML = recipe.tags
    .map((t) => `<span class="rv-tag">${formatTag(t)}</span>`)
    .join("");

  container.innerHTML = `
    <article class="recipe-view">
      <div class="rv-header">
        <vote-widget votes="${displayVotes()}" recipe-id="${recipe.id}"></vote-widget>
        <div class="rv-header-body">
          <h1 class="rv-title">${recipe.title}</h1>
          <div class="rv-meta">
            <span>by <strong>${recipe.author}</strong></span>
            <span>${timeAgo(recipe.date)}</span>
          </div>
        </div>
      </div>
      <div class="rv-tags">${tagsHTML}</div>
      <div class="rv-body">${renderBlocks(recipe.content.blocks)}</div>
    </article>
    <section class="rv-comments">
      <div class="giscus"></div>
    </section>`;

  // Inject Giscus script
  const giscusScript = document.createElement("script");
  giscusScript.src = "https://giscus.app/client.js";
  giscusScript.setAttribute("data-repo", "fajtaiandris/giscuss-test");
  giscusScript.setAttribute("data-repo-id", "R_kgDORSm3ZA");
  giscusScript.setAttribute("data-category", "General");
  giscusScript.setAttribute("data-category-id", "DIC_kwDORSm3ZM4C2p4T");
  giscusScript.setAttribute("data-mapping", "url");
  giscusScript.setAttribute("data-strict", "0");
  giscusScript.setAttribute("data-reactions-enabled", "1");
  giscusScript.setAttribute("data-emit-metadata", "0");
  giscusScript.setAttribute("data-input-position", "bottom");
  giscusScript.setAttribute("data-theme", "transparent_dark");
  giscusScript.setAttribute("data-lang", "en");
  giscusScript.setAttribute("data-loading", "lazy");
  giscusScript.crossOrigin = "anonymous";
  giscusScript.async = true;
  container.querySelector(".giscus").appendChild(giscusScript);

  // Vote handler via <vote-widget>
  const voteEl = container.querySelector("vote-widget");
  voteEl.addEventListener("vote", (e) => {
    const dir = e.detail.direction;
    userVote = userVote === dir ? null : dir;
    voteEl.setAttribute("votes", displayVotes());
    voteEl.setAttribute("user-vote", userVote || "");
  });
});
