class RecipeContent extends HTMLElement {
  static get observedAttributes() {
    return ["content"];
  }

  constructor() {
    super();
    this._editor = null;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  renderError() {
    this.innerHTML = `
      <div class="error">
        <h1>Oh no, we messed up! :(</h1>
        <p>This page is not loading properly for now.</p>
        <a href="/search" class="recipe-back-link">← Find another that might</a>
      </div>
    `;
  }

  async render() {
    const raw = this.getAttribute("content");
    if (!raw) return this.renderError();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return this.renderError();
    }

    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      return this.renderError();
    }

    this.destroyEditor();

    this.innerHTML = `<div class="editor-viewer"></div>`;

    this._editor = new EditorJS({
      holder: this.querySelector(".editor-viewer"),
      data: parsed,
      readOnly: true,
      tools: {
        header: Header,
        list: EditorjsList,
        delimiter: Delimiter,
      },
    });

    await this._editor.isReady;
  }

  destroyEditor() {
    if (this._editor) {
      this._editor = null;
    }
  }
}

customElements.define("recipe-content", RecipeContent);
