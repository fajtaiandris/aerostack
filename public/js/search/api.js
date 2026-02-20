export async function fetchResults(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/recipes?${query}`);
  return res.json();
}
