export async function fetchResults(params) {
  const queryParams = {
    ...params,
    tags: params.tags.join(","),
  };
  const query = new URLSearchParams(queryParams).toString();
  const res = await fetch(`/recipes?${query}`);
  return res.json();
}
