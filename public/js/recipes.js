let RECIPES = [];
const PER_PAGE = 5;
let currentPage = 1;
let filteredRecipes = [...RECIPES];
let userVotes = {};

async function loadRecipes() {
  try {
    const res = await fetch("/recipes"); // Worker endpoint
    if (!res.ok) throw new Error("Failed to fetch recipes");
    const data = (await res.json()).data;

    // Optional: map fields if API uses slightly different names
    RECIPES = data.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author || "Anonymous",
      date: r.created_at,
      votes: r.votes || 0,
      tags: Array.isArray(r.tags) ? r.tags.map((t) => t.name) : [],
    }));

    filteredRecipes = [...RECIPES];
    applyFilters();
  } catch (err) {
    console.error("Error loading recipes:", err);
    const list = document.getElementById("recipe-list");
    if (list) {
      list.innerHTML =
        '<p style="padding:2rem;text-align:center;opacity:.45">Failed to load recipes.</p>';
    }
  }
}

function getSelectedTags() {
  const checked = document.querySelectorAll(
    '#tags-dropdown input[type="checkbox"]:checked',
  );
  const tags = { roast: [], method: [], grind: [], other: [] };
  checked.forEach((cb) => {
    const [group, value] = cb.value.split(":");
    if (tags[group]) tags[group].push(value);
  });
  return tags;
}

function updateTagsLabel() {
  const btn = document.getElementById("tags-toggle");
  if (!btn) return;
  const arrow = btn.querySelector(".tags-arrow");
  const checked = document.querySelectorAll(
    '#tags-dropdown input[type="checkbox"]:checked',
  );

  // Remove old content (pills + label) but keep arrow
  while (btn.firstChild && btn.firstChild !== arrow) {
    btn.removeChild(btn.firstChild);
  }

  if (checked.length === 0) {
    const label = document.createElement("span");
    label.className = "tags-toggle-label";
    label.textContent = "All";
    btn.insertBefore(label, arrow);
  } else {
    // Try pills first
    checked.forEach((cb) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = cb.dataset.label || cb.value.split(":")[1];
      btn.insertBefore(pill, arrow);
    });

    // Measure: compute available space (button width minus padding and arrow)
    const style = getComputedStyle(btn);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const availableWidth = btn.offsetWidth - paddingLeft - paddingRight;

    // Sum up pill widths + gaps
    const gap = parseFloat(style.gap) || 0;
    const pills = btn.querySelectorAll(".tag-pill");
    let totalWidth = 0;
    pills.forEach((pill, i) => {
      totalWidth += pill.offsetWidth;
      if (i > 0) totalWidth += gap;
    });

    if (totalWidth > availableWidth) {
      while (btn.firstChild && btn.firstChild !== arrow) {
        btn.removeChild(btn.firstChild);
      }
      const label = document.createElement("span");
      label.className = "tags-toggle-label";
      label.textContent = checked.length + " selected";
      btn.insertBefore(label, arrow);
    }
  }
}

const GRIND_MAP = {
  "extra-fine": "Extra fine",
  fine: "Fine",
  "medium-fine": "Medium-fine",
  medium: "Medium",
  "medium-coarse": "Medium-coarse",
  coarse: "Coarse",
};

function applyFilters() {
  const sort = document.getElementById("filter-sort").value;
  const tags = getSelectedTags();
  const search = document
    .getElementById("filter-search")
    .value.toLowerCase()
    .trim();

  filteredRecipes = RECIPES.filter((r) => {
    if (tags.method.length && !tags.method.includes(r.method)) return false;
    if (tags.roast.length && !tags.roast.includes(r.roast)) return false;
    if (tags.grind.length) {
      const grindLower = r.grindSize.toLowerCase();
      const match = tags.grind.some(
        (g) => grindLower === (GRIND_MAP[g] || g).toLowerCase(),
      );
      if (!match) return false;
    }
    if (
      search &&
      !r.title.toLowerCase().includes(search) &&
      !r.author.toLowerCase().includes(search)
    )
      return false;
    return true;
  });

  if (sort === "top") {
    filteredRecipes.sort((a, b) => b.votes - a.votes);
  } else if (sort === "new") {
    filteredRecipes.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  currentPage = 1;
  render();
}

function getDisplayVotes(recipe) {
  let v = recipe.votes;
  const vote = userVotes[recipe.id];
  if (vote === "up") v += 1;
  if (vote === "down") v -= 1;
  return v;
}

function render() {
  const list = document.getElementById("recipe-list");
  if (!list) return;

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PER_PAGE;
  const page = filteredRecipes.slice(start, start + PER_PAGE);

  list.innerHTML = "";

  if (!page.length) {
    list.innerHTML =
      '<p style="padding:2rem;text-align:center;opacity:.45">No recipes match your filters.</p>';
  } else {
    page.forEach((r) => {
      const card = document.createElement("recipe-card");
      card.setAttribute("recipe-id", r.id);
      card.setAttribute("title", r.title);
      card.setAttribute("author", r.author);
      card.setAttribute("date", r.date);
      card.setAttribute("votes", getDisplayVotes(r));
      card.setAttribute("tags", JSON.stringify(r.tags || []));
      card.setAttribute("user-vote", userVotes[r.id] || "");
      list.appendChild(card);
    });
  }

  // Pagination
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageNumbers = document.getElementById("page-numbers");

  if (prevBtn) {
    prevBtn.classList.toggle("disabled", currentPage <= 1);
  }
  if (nextBtn) {
    nextBtn.classList.toggle("disabled", currentPage >= totalPages);
  }
  if (pageNumbers) {
    pageNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const span = document.createElement("span");
      span.className = "page-num" + (i === currentPage ? " active" : "");
      span.textContent = i;
      span.addEventListener("click", () => {
        currentPage = i;
        render();
      });
      pageNumbers.appendChild(span);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Only run on pages that have the recipe list
  if (!document.getElementById("recipe-list")) return;

  // Listen for vote events from recipe-card web components
  document.addEventListener("vote", (e) => {
    const { id, direction } = e.detail;
    const current = userVotes[id];
    userVotes[id] = current === direction ? null : direction;
    render();
  });

  // Sort dropdown
  const sortToggle = document.getElementById("sort-toggle");
  const sortDropdown = document.getElementById("sort-dropdown");
  let currentSort = "top";

  // Expose sort value via a getter so applyFilters can read it
  const sortInput = document.createElement("input");
  sortInput.type = "hidden";
  sortInput.id = "filter-sort";
  sortInput.value = "top";
  document.body.appendChild(sortInput);

  if (sortToggle && sortDropdown) {
    sortToggle.addEventListener("click", () => {
      sortDropdown.classList.toggle("open");
      // Close tags dropdown if open
      const td = document.getElementById("tags-dropdown");
      if (td) td.classList.remove("open");
    });

    sortDropdown.addEventListener("click", (e) => {
      const option = e.target.closest(".sort-option");
      if (!option) return;
      sortDropdown
        .querySelectorAll(".sort-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");
      sortInput.value = option.dataset.value;
      sortToggle.querySelector(".sort-toggle-label").textContent =
        option.textContent;
      sortDropdown.classList.remove("open");
      applyFilters();
    });

    document.addEventListener("click", (e) => {
      if (!sortToggle.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.remove("open");
      }
    });
  }

  // Tags dropdown toggle
  const tagsToggle = document.getElementById("tags-toggle");
  const tagsDropdown = document.getElementById("tags-dropdown");

  if (tagsToggle && tagsDropdown) {
    tagsToggle.addEventListener("click", () => {
      tagsDropdown.classList.toggle("open");
      // Close sort dropdown if open
      const sd = document.getElementById("sort-dropdown");
      if (sd) sd.classList.remove("open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!tagsToggle.contains(e.target) && !tagsDropdown.contains(e.target)) {
        tagsDropdown.classList.remove("open");
      }
    });

    // Listen for checkbox changes
    tagsDropdown.addEventListener("change", () => {
      updateTagsLabel();
      applyFilters();
    });

    // Clear filters button
    const tagsClear = document.getElementById("tags-clear");
    if (tagsClear) {
      tagsClear.addEventListener("click", () => {
        tagsDropdown
          .querySelectorAll('input[type="checkbox"]')
          .forEach((cb) => (cb.checked = false));
        updateTagsLabel();
        applyFilters();
      });
    }
  }

  document
    .getElementById("filter-search")
    .addEventListener("input", applyFilters);

  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredRecipes.length / PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      render();
    }
  });

  // applyFilters();

  loadRecipes();
});
