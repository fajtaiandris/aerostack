export function renderResults(data, params) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  data.data.forEach((item) => {
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

  // Update pagination display
  document.getElementById("pageDisplay").textContent = `Page ${params.page}`;
}
