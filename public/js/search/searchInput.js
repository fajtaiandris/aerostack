import { debounce, DEFAULT_SEARCH_PARAMS } from "./utils.js";
import { onFilterChange } from "./filters.js";

const searchInput = document.getElementById("searchInput");

export const setupSearch = () => {
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      onFilterChange({ q: e.target.value, page: 1 });
    }, 300),
  );
};

export const syncSearchFromParams = (params) => {
  document.getElementById("searchInput").value =
    params.q || DEFAULT_SEARCH_PARAMS.q;
};
