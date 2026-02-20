import { updateURL, getSearchParams } from "./utils.js";
import { renderResults } from "./results.js";
import { renderPagination } from "./pagination.js";
import { fetchResults } from "./api.js";

export function onFilterChange(newParams) {
  const params = { ...getSearchParams(), ...newParams };
  updateURL(params);
  fetchResults(params).then((data) => {
    (renderResults(data, params),
      renderPagination(params.page, data.total_pages));
  });
}

export const setupFilters = () => {
  const tagsToggle = document.getElementById("tags-toggle");
  const tagsDropdown = document.getElementById("tags-dropdown");

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
};

export const syncFiltersFromParams = (params) => {
  const checkboxes = document.querySelectorAll(
    '#tags-dropdown input[type="checkbox"]',
  );

  checkboxes.forEach((cb) => {
    cb.checked = params.tags.includes(cb.value);
  });

  updateTagsLabel();
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
