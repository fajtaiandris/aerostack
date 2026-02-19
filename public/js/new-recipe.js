const editor = new EditorJS({
  holder: "editorjs",
  placeholder: "Write your recipe here...",
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
  const title = document.getElementById("recipe-title").value.trim();
  const data = await editor.save();
  const tags = Array.from(
    document.querySelectorAll('input[name="recipe-tag"]:checked'),
  ).map((cb) => cb.value);

  console.log("Title:", title);
  console.log("Tags:", tags);
  console.log("Content:", data);
  alert("Recipe logged to console (no persistence yet)");
});
