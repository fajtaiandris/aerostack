document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeMenu");

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const navigate = () => {
        if (document.referrer && document.referrer !== "") {
          history.back();
        } else {
          window.location.href = "index.html";
        }
      };

      // Use View Transitions API if available (for history.back)
      if (document.startViewTransition) {
        document.startViewTransition(navigate);
      } else {
        navigate();
      }
    });
  }
});
