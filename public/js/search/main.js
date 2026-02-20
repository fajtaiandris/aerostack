import { setupSearch, syncSearchFromParams } from "./searchInput.js";
import { setupFilters, syncFiltersFromParams } from "./filters.js";
import { setupPagination } from "./pagination.js";
import { fetchResults } from "./api.js";
import { renderResults } from "./results.js";
import { getSearchParams } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  setupPagination();

  function loadFromURL() {
    const params = getSearchParams();
    syncSearchFromParams(params);
    syncFiltersFromParams(params);
    fetchResults(params).then((data) => renderResults(data, params));
  }

  loadFromURL();

  window.addEventListener("popstate", loadFromURL);
});
