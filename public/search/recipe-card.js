class RecipeCard extends HTMLElement {
  static get observedAttributes() {
    return [
      "recipe-id",
      "title",
      "author",
      "date",
      "views",
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
        background: white;
        transition: background 0.15s;
        font-family: system-ui, -apple-system, sans-serif;
      }

      :host(:hover) {
        background: #ef5350;
      }

      a, a:hover {
        color: inherit;
        text-decoration: none
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
        margin-bottom: 0.5rem;
        color: #131016;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        font-size: 0.78rem;
        color: #131016;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
        empty: hidden;
      }
      
      .tags:empty {
        display: none;
      }

      .tag {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 0.2rem 0.5rem;
        border-radius: 0;
        background: #f2dd28;
        border: none;
        color: #131016;
        transition: background 0.15s;
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

  _formatViews(viewCount) {
    return viewCount === 1 ? "1 view" : `${viewCount} views`;
  }

  _parseViews() {
    const raw = this.getAttribute("views");
    const parsed = Number.parseInt(String(raw ?? "0"), 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
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
    const views = this._parseViews();
    // const recipeId = this.getAttribute("recipe-id") || "";
    const slug = this.getAttribute("slug") || "";
    const tags = this._parseTags();

    const tagsHTML = tags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${this._styles}</style>
      <a href="/recipe/${slug}">
        <div class="card">
          <div class="body">
            <div class="title">${title}</div>
            <div class="tags">${tagsHTML}</div>
            <div class="meta">
              <span>by ${author}</span>
              <span>${this._timeAgo(date)}</span>
              <span>${this._formatViews(views)}</span>
            </div>
          </div>
        </div>
      </a>
    `;
  }
}

customElements.define("recipe-card", RecipeCard);
