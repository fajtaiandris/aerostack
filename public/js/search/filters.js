import { updateURL, getSearchParams, DEFAULT_SEARCH_PARAMS } from "./utils.js";
import { renderResults } from "./results.js";
import { fetchResults } from "./api.js";

export function onFilterChange(newParams) {
  const params = { ...getSearchParams(), ...newParams };
  updateURL(params);
  fetchResults(params).then((data) => renderResults(data, params));
}

export const setupFilters = () => {
  document
    .getElementById("tagFilter")
    .addEventListener("change", (e) =>
      onFilterChange({ tags: e.target.value, page: 1 }),
    );
  document
    .getElementById("limitFilter")
    .addEventListener("change", (e) =>
      onFilterChange({ per_page: parseInt(e.target.value), page: 1 }),
    );
};

export const syncFiltersFromParams = (params) => {
  document.getElementById("tagFilter").value =
    params.tags || DEFAULT_SEARCH_PARAMS.tags;
  document.getElementById("limitFilter").value =
    params.per_page || DEFAULT_SEARCH_PARAMS.per_page;
};
