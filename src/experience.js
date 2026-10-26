import { useEffect, useState } from "react";

export const safeStorage = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* Storage may be disabled. */
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* Optional persistence. */
    }
  },
};

export function useMedia(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function chooseModel(item) {
  safeStorage.set("modo3_modelo", item.slug);
  window.dispatchEvent(new CustomEvent("modo3:modelo", { detail: item.slug }));
}

export const demoUrl = (item) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}${item.demo}`;
export const previewUrl = (item) =>
  `${import.meta.env.BASE_URL}demos/previews/${item.slug}.jpg`;

// Event-driven animation: one RAF runs only while a pointer or letter is settling.
// Letter centers are measured on layout changes, never on every animation frame.
export function usePointerExperience(scopeRef, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const root = scopeRef.current;
    const cursor = root.querySelector(".custom-cursor");
    const preview = root.querySelector(".work-hover-preview");
    const letters = [...root.querySelectorAll("[data-weight-letter]")];
    let live = true;
    let positions = [],
      weights = letters.map(() => 300);
    let mx = -500,
      my = -500,
      cx = -500,
      cy = -500,
      px = -500,
      py = -500,
      rotation = 0;
    let raf = 0,
      measureRaf = 0,
      inside = false;
    const measure = () => {
      if (!live) return;
      cancelAnimationFrame(measureRaf);
      measureRaf = requestAnimationFrame(() => {
        positions = letters.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.left + r.width / 2 + scrollX,
            y: r.top + r.height / 2 + scrollY,
          };
        });
      });
    };
    function step() {
      let moving =
        Math.abs(mx - cx) > 0.1 ||
        Math.abs(my - cy) > 0.1 ||
        Math.abs(mx - px) > 0.1 ||
        Math.abs(my - py) > 0.1 ||
        Math.abs(rotation) > 0.1;
      cx += (mx - cx) * 0.22;
      cy += (my - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      const oldX = px;
      px += (mx - px) * 0.14;
      py += (my - py) * 0.14;
      rotation += ((px - oldX) * 0.6 - rotation) * 0.2;
      // Keep the preview inside the viewport, including the last visible rows.
      const left = Math.min(innerWidth - 280, Math.max(16, px + 28));
      const top = Math.min(innerHeight - 340, Math.max(16, py - 160));
      preview.style.transform = `translate3d(${left}px,${top}px,0) rotate(${Math.max(-14, Math.min(14, rotation))}deg)`;
      letters.forEach((el, i) => {
        const center = positions[i];
        const distance =
          center && inside
            ? Math.hypot(mx + scrollX - center.x, my + scrollY - center.y)
            : 1000;
        const target = 300 + 500 * Math.max(0, 1 - distance / 260);
        if (Math.abs(target - weights[i]) > 0.5) {
          weights[i] += (target - weights[i]) * 0.18;
          el.style.fontWeight = Math.round(weights[i]);
          moving = true;
        }
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const move = (event) => {
      if (event.pointerType !== "mouse") return;
      inside = true;
      mx = event.clientX;
      my = event.clientY;
      cursor.classList.add("is-present");
      wake();
    };
    const leave = () => {
      inside = false;
      cursor.classList.remove("is-present");
      wake();
    };
    const over = (event) =>
      cursor.classList.toggle(
        "is-large",
        !!event.target.closest('a,button,summary,select,[tabindex="0"]'),
      );
    const scroll = () => {
      measure();
      wake();
    };
    const transitionEnd = (event) => {
      if (event.target.closest(".hero-line")) measure();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root.querySelector(".editorial-hero"));
    measure();
    document.fonts?.ready.then(measure);
    document.documentElement.classList.add("custom-pointer");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    window.addEventListener("codik:intro-end", measure);
    root.addEventListener("transitionend", transitionEnd);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measureRaf);
      resizeObserver.disconnect();
      document.documentElement.classList.remove("custom-pointer");
      cursor.classList.remove("is-present");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      window.removeEventListener("codik:intro-end", measure);
      root.removeEventListener("transitionend", transitionEnd);
      letters.forEach((el) => {
        el.style.fontWeight = "";
      });
    };
  }, [enabled, scopeRef]);
}

export function useMagnetism(scopeRef, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const elements = [...scopeRef.current.querySelectorAll("[data-magnetic]")];
    const cleanups = elements.map((el) => {
      let rect;
      const enter = () => {
        rect = el.getBoundingClientRect();
      };
      const move = (event) => {
        if (event.pointerType !== "mouse" || !rect) return;
        el.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.35}px,${(event.clientY - rect.top - rect.height / 2) * 0.35}px)`;
      };
      const reset = () => {
        el.style.transform = "";
      };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", reset);
      el.addEventListener("blur", reset);
      return () => {
        reset();
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", reset);
        el.removeEventListener("blur", reset);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [enabled, scopeRef]);
}

export function useConfetti(scopeRef, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const pieces = new Set();
    const burst = (event) => {
      if (
        !event.detail ||
        event.target.closest(
          "input,textarea,select,label,[contenteditable],dialog",
        ) ||
        window.getSelection()?.toString()
      )
        return;
      const count = event.target.closest("[data-contact-burst]") ? 26 : 9;
      for (let i = 0; i < count; i++) {
        const el = document.createElement("i");
        el.className = "click-particle";
        el.setAttribute("aria-hidden", "true");
        el.style.left = `${event.clientX}px`;
        el.style.top = `${event.clientY}px`;
        el.style.background = i % 3 ? "var(--ac)" : "var(--fg)";
        scopeRef.current.appendChild(el);
        pieces.add(el);
        const angle = Math.random() * Math.PI * 2,
          distance = 50 + Math.random() * 130;
        const animation = el.animate(
          [
            { transform: "translate(0,0) rotate(0)", opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 600 + Math.random() * 500,
            easing: "cubic-bezier(.2,.8,.2,1)",
          },
        );
        animation.onfinish = () => {
          el.remove();
          pieces.delete(el);
        };
      }
    };
    document.addEventListener("click", burst);
    return () => {
      document.removeEventListener("click", burst);
      pieces.forEach((el) => {
        el.getAnimations().forEach((a) => a.cancel());
        el.remove();
      });
    };
  }, [enabled, scopeRef]);
}
