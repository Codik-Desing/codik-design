(function () {
      if (
        !("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      var parts = document.querySelectorAll(
        "main>section:not(:first-child),main>div:not(:first-child)",
      );
      document.body.classList.add("demo-motion");
      var o = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("demo-seen");
              o.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
      );
      parts.forEach(function (el) {
        o.observe(el);
      });
    })();
