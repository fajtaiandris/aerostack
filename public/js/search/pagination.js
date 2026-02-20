import { fetchResults } from "./api.js";
import { renderResults } from "./results.js";
import { updateURL, getSearchParams } from "./utils.js";

export const setupPagination = () => {
  document.getElementById("prevPage").addEventListener("click", () => {
    const params = getSearchParams();
    if (params.page > 1) onPageChange(params.page - 1);
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    const params = getSearchParams();
    onPageChange(params.page + 1);
  });
};

function onPageChange(newPage) {
  const params = { ...getSearchParams(), page: newPage };
  updateURL(params);
  fetchResults(params).then((data) => renderResults(data, params));
}
