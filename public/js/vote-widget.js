class VoteWidget extends HTMLElement {
  static get observedAttributes() {
    return ["votes", "user-vote", "recipe-id"];
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        min-width: 2.5rem;
        flex-shrink: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .vote-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        padding: 0.2rem;
        color: #E6E6E6;
        opacity: 0.3;
        transition: opacity 0.15s, color 0.15s;
      }

      .vote-btn:hover {
        opacity: 0.7;
      }

      .vote-btn.active {
        opacity: 1;
        color: #C62828;
      }

      .vote-count {
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1;
        color: #E6E6E6;
      }
    `;
  }

  render() {
    const votes = this.getAttribute("votes") || "0";
    const userVote = this.getAttribute("user-vote") || "";
    const recipeId = this.getAttribute("recipe-id") || "";

    this.shadowRoot.innerHTML = `
      <style>${this._styles}</style>
      <button class="vote-btn ${userVote === "up" ? "active" : ""}"
              data-dir="up" aria-label="Upvote">▲</button>
      <span class="vote-count">${votes}</span>
      <button class="vote-btn ${userVote === "down" ? "active" : ""}"
              data-dir="down" aria-label="Downvote">▼</button>
    `;

    this.shadowRoot.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("vote", {
            detail: {
              id: recipeId ? parseInt(recipeId, 10) : null,
              direction: btn.dataset.dir,
            },
            bubbles: true,
            composed: true,
          }),
        );
      });
    });
  }
}

customElements.define("vote-widget", VoteWidget);
