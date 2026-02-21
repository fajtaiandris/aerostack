class RecipeContent extends HTMLElement {
  static get observedAttributes() {
    return ["content"];
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

  renderError() {
    this.shadowRoot.innerHTML = `
    <style>
        :host {
            display: block;
            font-family: system-ui, sans-serif;
            text-align: center;
        }
        .error {
            text-align: center;
            padding: 4rem 2rem;
            background: #1b1b1d;
            border: 1px solid var(--color-border);
            border-radius: 10px;
        }

        .error h1 {
            font-size: 1.75rem !important;
            margin-bottom: 0.5rem;
        }

        .error p {
            color: var(--color-muted);
            margin-bottom: 1.5rem;
        }

        .recipe-back-link {
            color: var(--color-accent);
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.15s;
        }
    </style>
    <div class="error">
        <h1>Oh no, we messed up! :(</h1>
        <p>This page is not loading properly for now.</p>
        <a href="/search" class="recipe-back-link">← Find another that might</a>
    </div>`;
  }

  render() {
    const raw = this.getAttribute("content");
    if (!raw) {
      this.renderError();
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.renderError();
      return;
    }

    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      this.renderError();
      return;
    }

    const container = document.createElement("div");

    parsed.blocks.forEach((block) => {
      const el = this.renderBlock(block);
      if (el) container.appendChild(el);
    });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        h1, h2, h3, h4, h5, h6 {
          margin: 1.2em 0 0.6em;
        }
        p {
          line-height: 1.6;
        }
        ul, ol {
          padding-left: 1.5em;
        }
        hr {
          margin: 2em 0;
          border: none;
          border-top: 1px solid #ddd;
        }
      </style>
    `;

    this.shadowRoot.appendChild(container);
  }

  renderBlock(block) {
    if (!block || typeof block !== "object") return null;

    switch (block.type) {
      case "paragraph": {
        const p = document.createElement("p");
        p.appendChild(this.safeInlineHTML(block.data?.text));
        return p;
      }

      case "header": {
        const level = Math.min(Math.max(block.data?.level || 2, 1), 6);
        const h = document.createElement(`h${level}`);
        h.appendChild(this.safeInlineHTML(block.data?.text));
        return h;
      }

      case "list": {
        const tag = block.data?.style === "ordered" ? "ol" : "ul";
        const list = document.createElement(tag);

        (block.data?.items || []).forEach((item) => {
          const li = document.createElement("li");
          li.appendChild(this.safeInlineHTML(item));
          list.appendChild(li);
        });

        return list;
      }

      case "delimiter":
        return document.createElement("hr");

      default:
        return null;
    }
  }

  /**
   * Safe inline HTML sanitizer.
   * Only allows: <b>, <strong>, <i>, <em>, <br>
   * Everything else becomes text.
   */
  safeInlineHTML(htmlString = "") {
    const template = document.createElement("template");
    template.innerHTML = htmlString;

    const allowed = ["B", "STRONG", "I", "EM", "BR"];

    const sanitizeNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.includes(node.tagName)) {
          return document.createTextNode(node.textContent);
        }

        const clean = document.createElement(node.tagName.toLowerCase());
        node.childNodes.forEach((child) =>
          clean.appendChild(sanitizeNode(child)),
        );
        return clean;
      }

      return document.createTextNode("");
    };

    const fragment = document.createDocumentFragment();
    template.content.childNodes.forEach((node) =>
      fragment.appendChild(sanitizeNode(node)),
    );

    return fragment;
  }
}

customElements.define("recipe-content", RecipeContent);
