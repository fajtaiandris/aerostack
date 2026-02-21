import { onFilterChange } from "./filters.js";
import { updateURL, getSearchParams } from "./utils.js";
import { fetchAndRender } from "./fetchAndRender.js";

export const setupPagination = () => {
  document.getElementById("prev-page").addEventListener("click", () => {
    const params = getSearchParams();
    if (params.page > 1) onPageChange(params.page - 1);
  });
  document.getElementById("next-page").addEventListener("click", () => {
    const params = getSearchParams();
    onPageChange(params.page + 1);
  });
};

function onPageChange(newPage) {
  const params = { ...getSearchParams(), page: newPage };
  updateURL(params);
  fetchAndRender(params);
}

export const renderPagination = (currentPage, totalPages) => {
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageNumbers = document.getElementById("page-numbers");
  const container = document.getElementById("pagination");

  pageNumbers.innerHTML = "";

  if (totalPages < 1) {
    container.dataset.hidden = "true";
    return;
  }

  container.dataset.hidden = "false";

  // How many numbers to show around current
  const windowSize = 2;

  let start = Math.max(1, currentPage - windowSize);
  let end = Math.min(totalPages, currentPage + windowSize);

  // Adjust window when near edges
  if (currentPage <= windowSize) {
    end = Math.min(totalPages, 1 + windowSize * 2);
  }
  if (currentPage + windowSize > totalPages) {
    start = Math.max(1, totalPages - windowSize * 2);
  }

  for (let p = start; p <= end; p++) {
    const span = document.createElement("span");
    span.className = "page-num" + (p === currentPage ? " active" : "");
    span.textContent = p;

    span.addEventListener("click", () => {
      if (p !== currentPage) {
        onFilterChange({ page: p });
      }
    });

    pageNumbers.appendChild(span);
  }

  // ---------- Prev button ----------
  if (currentPage <= 1) {
    prevBtn.classList.add("disabled");
  } else {
    prevBtn.classList.remove("disabled");
  }

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      onFilterChange({ page: currentPage - 1 });
    }
  };

  // ---------- Next button ----------
  if (currentPage >= totalPages) {
    nextBtn.classList.add("disabled");
  } else {
    nextBtn.classList.remove("disabled");
  }

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      onFilterChange({ page: currentPage + 1 });
    }
  };
};
