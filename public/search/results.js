export function renderResults(response, params) {
  const { data } = response;

  const container = document.getElementById("results");
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  if (data.length === 0) {
    renderNoResults();
    return;
  }

  container.dataset.empty = "false";
  data.forEach((item) => {
    const card = document.createElement("recipe-card");

    card.setAttribute("recipe-id", item.id);
    card.setAttribute("title", item.title || "");
    card.setAttribute("author", item.author || "");
    card.setAttribute("date", item.created_at || "");
    card.setAttribute("views", String(item.view_count ?? 0));
    card.setAttribute("slug", item.slug || "");

    if (item.tags) {
      card.setAttribute("tags", JSON.stringify(item.tags.map((t) => t.name)));
    }

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function renderNoResults() {
  const container = document.getElementById("results");
  container.innerHTML = `
      <div class="recipe-not-found">
        <h1>Way too specific...</h1>
        <p>There's not a single recipe matching your search.</p>
        <a href="/search" class="recipe-back-link">← Clear search</a>
      </div>`;
  container.dataset.empty = "true";
}

export function renderError() {
  const container = document.getElementById("results");
  container.innerHTML = `
    <div class="recipe-not-found">
      <h1>This site is having trouble :(</h1>
      <p>We couldn't fetch the results of your search.</p>
      <a href="/search" class="recipe-back-link">↻ Maybe now it works</a>
    </div>`;
  container.dataset.empty = "true";
}
