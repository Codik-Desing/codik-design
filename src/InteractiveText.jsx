import React from "react";

export function SplitWord({ text, interactive = true }) {
  return [...text].map((char, index) => (
    <span
      className="title-glyph"
      data-char={char === " " ? "\u00a0" : char}
      key={index}
    >
      <span {...(interactive ? { "data-weight-letter": "" } : {})}>
        {char === " " ? "\u00a0" : char}
      </span>
    </span>
  ));
}

// Keep whole words together, allow normal line wrapping, and expose one readable
// string to assistive technology. The hidden glyph reserves its heaviest width.
export default function InteractiveText({ text, interactive = true }) {
  return (
    <span className="interactive-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((word, index) =>
          /^\s+$/.test(word) ? (
            word
          ) : (
            <span className="interactive-word" key={index}>
              <SplitWord text={word} interactive={interactive} />
            </span>
          ),
        )}
      </span>
    </span>
  );
}
