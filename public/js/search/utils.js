export const DEFAULT_SEARCH_PARAMS = {
  page: 1,
  per_page: 5,
  q: "",
  tags: "",
};

export function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function getSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    page: parseInt(params.get("page")) || DEFAULT_SEARCH_PARAMS.page,
    per_page:
      parseInt(params.get("per_page")) || DEFAULT_SEARCH_PARAMS.per_page,
    q: params.get("q") || DEFAULT_SEARCH_PARAMS.q,
    tags: params.get("tags") || DEFAULT_SEARCH_PARAMS.tags,
  };
}

export function updateURL(params, replace = false) {
  const url = new URL(window.location);
  Object.keys(params).forEach((key) =>
    params[key]
      ? url.searchParams.set(key, params[key])
      : url.searchParams.delete(key),
  );
  replace
    ? history.replaceState(null, "", url)
    : history.pushState(null, "", url);
}
