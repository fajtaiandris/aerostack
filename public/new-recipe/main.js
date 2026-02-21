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

document.getElementById("submit-recipe").addEventListener("click", async () => {
  const titleInput = document.getElementById("recipe-title");
  const authorInput = document.getElementById("recipe-author");
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  const data = await editor.save();

  const tags = Array.from(
    document.querySelectorAll('input[name="recipe-tag"]:checked'),
  ).map((cb) => cb.value);

  try {
    const res = await fetch("/recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        author,
        markdown: JSON.stringify(data),
        tags,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create recipe");
    }

    const created = await res.json();

    // Redirect to new recipe page
    window.location.href = `/recipe/${created.slug}`;
  } catch (err) {
    console.error(err);
    alert(err.message || "Something went wrong");
  }
});
