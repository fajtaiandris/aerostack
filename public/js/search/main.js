import { setupSearch, syncSearchFromParams } from "./searchInput.js";
import { setupFilters, syncFiltersFromParams } from "./filters.js";
import { setupPagination } from "./pagination.js";
import { fetchAndRender } from "./fetchAndRender.js";
import { getSearchParams } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  setupPagination();

  function loadFromURL() {
    const params = getSearchParams();
    syncSearchFromParams(params);
    syncFiltersFromParams(params);
    fetchAndRender(params);
  }

  loadFromURL();

  window.addEventListener("popstate", loadFromURL);
});
