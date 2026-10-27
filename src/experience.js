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
export const previewUrl = (item, width, format = "jpg") =>
  `${import.meta.env.BASE_URL}demos/previews/${item.slug}${width ? `-${width}` : ""}.${format}`;

// Event-driven animation: one RAF runs only while a pointer or letter is settling.
// Letter centers are measured on layout changes, never on every animation frame.
export function usePointerExperience(scopeRef, enabled) {
  useEffect(() => {
    if (!enabled) return;
    const root = scopeRef.current;
    const cursor = root.querySelector(".custom-cursor");
    const preview = root.querySelector(".work-hover-preview");
    let letters = [],
      weights = [];
    let live = true;
    let positions = [];
    // Document coordinates survive scrolling. Only nearby letters and those
    // returning to their original weight need work on an animation frame.
    let buckets = new Map();
    const settling = new Set();
    let hoveredRow = null;
    let previewBounds = {
      left: 16,
      right: innerWidth - 16,
      width: 260,
      height: 320,
    };
    let mx = -500,
      my = -500,
      cx = -500,
      cy = -500,
      px = -500,
      py = -500,
      rotation = 0;
    let raf = 0,
      measureRaf = 0,
      previewRaf = 0,
      inside = false;
    const measurePreview = () => {
      if (!hoveredRow?.isConnected) hoveredRow = null;
      const rowRect = hoveredRow?.getBoundingClientRect();
      const arrowRect = hoveredRow
        ?.querySelector(".row-arrow")
        ?.getBoundingClientRect();
      const left = Math.max(16, rowRect?.left || 16);
      // Reserve the arrow and both action buttons, even while the card tilts.
      const right = Math.min(
        innerWidth - 16,
        arrowRect ? arrowRect.left - 16 : innerWidth - 16,
      );
      const width = Math.max(0, Math.min(260, right - left));
      preview.style.setProperty("--preview-max-width", `${width}px`);
      preview.style.visibility = width < 150 ? "hidden" : "";
      previewBounds = {
        left,
        right,
        width,
        height: Math.max(0, Math.min(320, innerHeight - 32)),
      };
    };
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
        buckets = new Map();
        positions.forEach((center, index) => {
          const key = Math.floor(center.y / 260);
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(index);
        });
        measurePreview();
        wake();
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
      const { left: minimum, right, width, height } = previewBounds;
      let tilt = Math.max(-14, Math.min(14, rotation));
      let angle = (Math.abs(tilt) * Math.PI) / 180;
      // The rotated bounds count too; narrow or short screens use a flat card.
      if (
        width * Math.cos(angle) + height * Math.sin(angle) > right - minimum ||
        height * Math.cos(angle) + width * Math.sin(angle) > innerHeight - 32
      ) {
        tilt = 0;
        angle = 0;
      }
      const padX = Math.max(
        0,
        (width * Math.cos(angle) + height * Math.sin(angle) - width) / 2,
      );
      const padY = Math.max(
        0,
        (height * Math.cos(angle) + width * Math.sin(angle) - height) / 2,
      );
      const left = Math.max(
        minimum + padX,
        Math.min(right - width - padX, px + 28),
      );
      const top = Math.max(
        16 + padY,
        Math.min(innerHeight - 16 - height - padY, py - height / 2),
      );
      preview.style.transform = `translate3d(${left}px,${top}px,0) rotate(${tilt}deg)`;
      const candidates = new Set(settling);
      if (inside) {
        const first = Math.floor((my + scrollY - 260) / 260);
        const last = Math.floor((my + scrollY + 260) / 260);
        for (let key = first; key <= last; key++) {
          buckets.get(key)?.forEach((index) => candidates.add(index));
        }
      }
      candidates.forEach((i) => {
        const el = letters[i];
        const center = positions[i];
        const distance =
          center && inside
            ? Math.hypot(mx + scrollX - center.x, my + scrollY - center.y)
            : 1000;
        const target = 300 + 500 * Math.max(0, 1 - distance / 260);
        if (Math.abs(target - weights[i]) > 0.5) {
          weights[i] += (target - weights[i]) * 0.18;
          el.style.fontWeight = Math.round(weights[i]);
          settling.add(i);
          moving = true;
        } else settling.delete(i);
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const refreshLetters = () => {
      const previous = new Map(
        letters.map((el, index) => [el, weights[index]]),
      );
      letters = [...root.querySelectorAll("[data-weight-letter]")];
      weights = letters.map((el) => previous.get(el) ?? 300);
      settling.clear();
      weights.forEach((weight, i) => {
        if (weight > 300.5) settling.add(i);
      });
      measure();
      wake();
    };
    const move = (event) => {
      if (event.pointerType !== "mouse") return;
      inside = true;
      mx = event.clientX;
      my = event.clientY;
      const row = event.target.closest?.(".work-row") || null;
      if (row !== hoveredRow) {
        hoveredRow = row;
        measurePreview();
      }
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
      // Scrolling changes viewport bounds, not document-relative letter centers.
      if (!previewRaf)
        previewRaf = requestAnimationFrame(() => {
          previewRaf = 0;
          measurePreview();
        });
      wake();
    };
    const resize = () => {
      measure();
      wake();
    };
    const transitionEnd = (event) => {
      if (event.target.closest(".hero-line,[data-reveal]")) measure();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root.querySelector(".site-content"));
    const contentObserver = new MutationObserver((records) => {
      if (
        records.some((record) =>
          [...record.addedNodes, ...record.removedNodes].some(
            (node) =>
              node.nodeType === 1 &&
              (node.matches("[data-weight-letter]") ||
                node.querySelector("[data-weight-letter]")),
          ),
        )
      )
        refreshLetters();
    });
    contentObserver.observe(root.querySelector(".site-content"), {
      childList: true,
      subtree: true,
    });
    refreshLetters();
    document.fonts?.ready.then(measure);
    document.documentElement.classList.add("custom-pointer");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("codik:intro-end", measure);
    root.addEventListener("transitionend", transitionEnd);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measureRaf);
      cancelAnimationFrame(previewRaf);
      resizeObserver.disconnect();
      contentObserver.disconnect();
      preview.style.removeProperty("--preview-max-width");
      preview.style.visibility = "";
      document.documentElement.classList.remove("custom-pointer");
      cursor.classList.remove("is-present");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
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
