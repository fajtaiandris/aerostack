export function renderResults(response, params) {
  const { data } = response;

  const container = document.getElementById("results");
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  if (data.length === 0) {
    container.innerHTML = `
      <div class="recipe-not-found">
        <h1>Way too specific...</h1>
        <p>There's not a single recipe matching your search.</p>
        <a href="/search" class="recipe-back-link">← Clear search</a>
      </div>`;
    container.dataset.empty = "true";
    return;
  }

  container.dataset.empty = "false";
  data.forEach((item) => {
    const card = document.createElement("recipe-card");

    card.setAttribute("recipe-id", item.id);
    card.setAttribute("title", item.title || "");
    card.setAttribute("author", item.author || "");
    card.setAttribute("date", item.created_at || "");
    card.setAttribute("slug", item.slug || "");

    if (item.tags) {
      card.setAttribute("tags", JSON.stringify(item.tags.map((t) => t.name)));
    }

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}
