import { updateURL, getSearchParams } from "./utils.js";
import { fetchAndRender } from "./fetchAndRender.js";

const SORT_LABELS = {
  new: "New",
  top: "Views",
};

const normalizeSort = (value) => (value === "top" ? "top" : "new");

export function onFilterChange(newParams) {
  const params = { ...getSearchParams(), ...newParams };
  updateURL(params);
  fetchAndRender(params);
}

export const setupFilters = () => {
  const tagsToggle = document.getElementById("tags-toggle");
  const tagsDropdown = document.getElementById("tags-dropdown");
  const sortToggle = document.getElementById("sort-toggle");
  const sortDropdown = document.getElementById("sort-dropdown");

  tagsDropdown.addEventListener("change", () => {
    const selected = Array.from(
      tagsDropdown.querySelectorAll('input[type="checkbox"]:checked'),
    ).map((cb) => cb.value);
    updateTagsLabel();
    onFilterChange({ tags: selected, page: 1 });
  });

  if (tagsToggle && tagsDropdown) {
    tagsToggle.addEventListener("click", () => {
      tagsDropdown.classList.toggle("open");
      sortDropdown?.classList.remove("open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!tagsToggle.contains(e.target) && !tagsDropdown.contains(e.target)) {
        tagsDropdown.classList.remove("open");
      }
    });

    // Clear filters button
    const tagsClear = document.getElementById("tags-clear");
    if (tagsClear) {
      tagsClear.addEventListener("click", () => {
        tagsDropdown
          .querySelectorAll('input[type="checkbox"]')
          .forEach((cb) => (cb.checked = false));
        updateTagsLabel();
        onFilterChange({ tags: [], page: 1 });
      });
    }
  }

  if (sortToggle && sortDropdown) {
    sortToggle.addEventListener("click", () => {
      sortDropdown.classList.toggle("open");
      tagsDropdown?.classList.remove("open");
    });

    sortDropdown.querySelectorAll(".sort-option").forEach((option) => {
      option.addEventListener("click", () => {
        const nextSort = normalizeSort(option.dataset.value);
        setSortUI(nextSort);
        sortDropdown.classList.remove("open");
        onFilterChange({ sort: nextSort, page: 1 });
      });
    });

    document.addEventListener("click", (e) => {
      if (!sortToggle.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.remove("open");
      }
    });
  }
};

export const syncFiltersFromParams = (params) => {
  const checkboxes = document.querySelectorAll(
    '#tags-dropdown input[type="checkbox"]',
  );

  checkboxes.forEach((cb) => {
    cb.checked = params.tags.includes(cb.value);
  });

  updateTagsLabel();
  setSortUI(normalizeSort(params.sort));
};

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

function setSortUI(sort) {
  const normalizedSort = normalizeSort(sort);
  const label = document.querySelector("#sort-toggle .sort-toggle-label");
  if (label) {
    label.textContent = SORT_LABELS[normalizedSort];
  }

  document.querySelectorAll("#sort-dropdown .sort-option").forEach((option) => {
    const isActive = normalizeSort(option.dataset.value) === normalizedSort;
    option.classList.toggle("active", isActive);
  });
}
