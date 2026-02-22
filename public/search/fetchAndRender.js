import { fetchResults } from "./api.js";
import { renderResults, renderError } from "./results.js";
import { renderPagination } from "./pagination.js";

export const fetchAndRender = async (params) => {
  let data;
  try {
    data = await fetchResults(params);
    if (!data || !data.data || !Array.isArray(data.data)) {
      renderError();
      return;
    }
  } catch (error) {
    console.error("Error fetching results:", error);
    renderError();
    return;
  }
  renderResults(data, params);
  renderPagination(params.page, data.total_pages);
};
