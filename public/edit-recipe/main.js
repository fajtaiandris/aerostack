const editorContainer = document.querySelector(".editor-container");
const titleInput = document.getElementById("recipe-title");
const authorInput = document.getElementById("recipe-author");
const submitButton = document.getElementById("submit-recipe");

const ERROR_TEXT = {
  INVALID_EDIT_LINK: {
    title: "Invalid edit link",
    message: "This edit link is malformed.",
  },
  EDIT_LINK_NOT_FOUND: {
    title: "Edit link not found",
    message: "This edit link is invalid or expired.",
  },
  INVALID_RECIPE_FIELDS: {
    title: "Invalid recipe data",
    message: "Title, author, and recipe content are required.",
  },
  INVALID_RECIPE_SLUG: {
    title: "Invalid recipe data",
    message: "This title/author combination cannot be used.",
  },
  RECIPE_SLUG_TAKEN: {
    title: "Duplicate recipe",
    message: "This recipe title is already taken.",
  },
  UNKNOWN_ERROR: {
    title: "Unable to load recipe",
    message: "Something went wrong while opening this edit page.",
  },
};

const preloaded = readPreloadedData();
if (!preloaded || preloaded.error || !preloaded.data) {
  renderEditError(errorForCode(preloaded?.error?.code || "UNKNOWN_ERROR"));
} else {
  initEditPage(preloaded.data);
}

async function initEditPage(initialRecipe) {
  const editor = new EditorJS({
    holder: "editorjs",
    placeholder: "Instructions for your recipe",
    inlineToolbar: ["link", "bold", "italic"],
    tools: {
      header: {
        class: Header,
        config: {
          levels: [2, 3],
          defaultLevel: 2,
        },
        inlineToolbar: true,
      },
      list: {
        class: EditorjsList,
        inlineToolbar: true,
      },
      delimiter: Delimiter,
    },
  });

  titleInput.value = initialRecipe.title || "";
  authorInput.value = initialRecipe.author || "";
  setCheckedTags(initialRecipe.tags);

  const parsedContent = parseEditorContent(initialRecipe.markdown);
  if (!parsedContent) {
    renderEditError({
      title: "Recipe content cannot be loaded",
      message: "This recipe content is not in a valid format.",
    });
    return;
  }

  submitButton.disabled = true;

  await editor.isReady;
  await editor.render(parsedContent);
  submitButton.disabled = false;

  submitButton.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const data = await editor.save();
    const tags = Array.from(
      document.querySelectorAll('input[name="recipe-tag"]:checked'),
    ).map((checkbox) => checkbox.value);

    try {
      const res = await fetch(
        `/recipes/edit/${encodeURIComponent(initialRecipe.hash)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            author,
            markdown: JSON.stringify(data),
            tags,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorCode = body?.error_code || "UNKNOWN_ERROR";
        const errorText = errorForCode(errorCode);

        if (errorCode === "INVALID_EDIT_LINK" || errorCode === "EDIT_LINK_NOT_FOUND") {
          renderEditError(errorText);
          return;
        }

        throw new Error(errorText.message || "Failed to save recipe");
      }

      const recipe = await res.json();
      window.location.href = `/recipe/${recipe.slug}`;
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  });
}

function readPreloadedData() {
  const node = document.getElementById("edit-recipe-data");
  if (!node) return null;

  try {
    const parsed = JSON.parse(node.textContent || "");
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCheckedTags(tags) {
  if (!Array.isArray(tags)) return;

  const selected = new Set(tags.map((tag) => String(tag)));
  const checkboxes = document.querySelectorAll('input[name="recipe-tag"]');

  for (const checkbox of checkboxes) {
    checkbox.checked = selected.has(checkbox.value);
  }
}

function parseEditorContent(raw) {
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.blocks)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function errorForCode(code) {
  return ERROR_TEXT[code] || ERROR_TEXT.UNKNOWN_ERROR;
}

function renderEditError({ title, message }) {
  editorContainer.innerHTML = `
    <div class="recipe-not-found">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="/search" class="recipe-back-link">← Back to recipes</a>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
