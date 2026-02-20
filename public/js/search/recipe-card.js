class RecipeCard extends HTMLElement {
  static get observedAttributes() {
    return [
      "recipe-id",
      "title",
      "author",
      "date",
      "description",
      "tags",
      "slug",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get _styles() {
    return `
      :host {
        display: block;
        background: #3A3D40;
        transition: background 0.15s;
        font-family: system-ui, -apple-system, sans-serif;
      }

      :host(:hover) {
        background: #444749;
      }

      .card {
        display: flex;
        gap: 1rem;
        padding: 1rem 1.25rem;
      }

      .body {
        flex: 1;
        min-width: 0;
      }

      .title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
        color: #E6E6E6;
      }

      .title a {
        color: inherit;
        text-decoration: none;
        transition: color 0.15s;
      }

      .title a:hover {
        color: #ef5350;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        font-size: 0.78rem;
        color: #999999;
        margin-bottom: 0.5rem;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .tag {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        background: #505356;
        border: none;
        color: #E6E6E6;
      }
    `;
  }

  _timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const days = Math.floor((now - then) / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  _parseTags() {
    const raw = this.getAttribute("tags");
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  render() {
    const title = this.getAttribute("title") || "";
    const author = this.getAttribute("author") || "";
    const date = this.getAttribute("date") || "";
    // const recipeId = this.getAttribute("recipe-id") || "";
    const slug = this.getAttribute("slug") || "";
    const tags = this._parseTags();

    const tagsHTML = tags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${this._styles}</style>
      <div class="card">
        <div class="body">
          <div class="title">
            <a href="/recipe/${slug}">${title}</a>
          </div>
          <div class="meta">
            <span>by ${author}</span>
            <span>${this._timeAgo(date)}</span>
          </div>
          <div class="tags">
            ${tagsHTML}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("recipe-card", RecipeCard);
