export const DEFAULT_SEARCH_PARAMS = {
  page: 1,
  per_page: 5,
  q: "",
  tags: [],
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
  const tags = params.get("tags");
  return {
    page: parseInt(params.get("page")) || DEFAULT_SEARCH_PARAMS.page,
    per_page:
      parseInt(params.get("per_page")) || DEFAULT_SEARCH_PARAMS.per_page,
    q: params.get("q") || DEFAULT_SEARCH_PARAMS.q,
    tags: tags ? tags.split(",").filter(Boolean) : DEFAULT_SEARCH_PARAMS.tags,
  };
}

export function updateURL(params, replace = false) {
  const url = new URL(window.location);

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (value === undefined || value === null) {
      url.searchParams.delete(key);
      return;
    }

    // Array → comma separated
    if (Array.isArray(value)) {
      if (value.length === 0) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value.join(","));
      }
      return;
    }

    if (value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  replace
    ? history.replaceState(null, "", url)
    : history.pushState(null, "", url);
}
