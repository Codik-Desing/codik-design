document.querySelectorAll('a[href*="?modelo="]').forEach(function (a) {
      a.addEventListener("click", function () {
        var match = this.getAttribute("href").match(/(?:^|[?&])modelo=([^&#]+)/);
        if (match && match[1]) {
          sessionStorage.setItem("modo3_modelo", decodeURIComponent(match[1]));
        }
      });
    });
    if (location.protocol === "file:") {
      document
        .querySelectorAll('a[href^="../../?modelo="]')
        .forEach(
          (a) =>
          (a.href = a
            .getAttribute("href")
            .replace("../../?modelo=", "../../PREVIA.html?modelo=")),
        );
    }
