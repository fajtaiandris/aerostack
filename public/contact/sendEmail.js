const form = document.getElementById("form");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(form);
  const object = Object.fromEntries(formData);
  const json = JSON.stringify(object);

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: json,
  })
    .then(async (response) => {
      let json = await response.json();
      if (response.status == 200) {
        renderSuccess();
      } else {
        console.log(response);
        renderError();
      }
    })
    .catch((error) => {
      console.log(error);
      renderError();
    });
});

const renderError = () => {
  const errorContainer = document.getElementById("container");
  errorContainer.innerHTML = `<div class="recipe-not-found error">
        <h1>No mail today! :(</h1>
        <p>We're having issues sending your message.</p>
        <a href="/search" class="recipe-back-link">← Keep searching in the meantime</a>
      </div>
    `;
};

const renderSuccess = () => {
  const errorContainer = document.getElementById("container");
  errorContainer.innerHTML = `<div class="recipe-not-found success">
        <h1>Message sent! :)</h1>
        <p>Thanks for reaching out, I'll get back to you as soon as I can.</p>
        <a href="/search" class="recipe-back-link">← Keep searching in the meantime</a>
      </div>
    `;
};
