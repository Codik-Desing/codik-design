import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { tiposDeSite } from "./content";
import InteractiveText from "./InteractiveText";

export function SiteTypes() {
  const [active, setActive] = useState("institucional");
  const current =
    tiposDeSite.find((item) => item.id === active) || tiposDeSite[0];
  return (
    <section className="types" id="tipos">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span>01 / TIPOS DE SITE</span>
          <h2>
            <InteractiveText text="Qual é a sua ideia?" />
          </h2>
        </div>
        <div
          className="type-tabs"
          role="tablist"
          aria-label="Tipos de site"
          onKeyDown={(event) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const currentIndex = tiposDeSite.findIndex(
              (item) => item.id === active,
            );
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tiposDeSite.length - 1
                  : (currentIndex +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      tiposDeSite.length) %
                    tiposDeSite.length;
            setActive(tiposDeSite[next].id);
            event.currentTarget.querySelectorAll('[role="tab"]')[next].focus();
          }}
        >
          {tiposDeSite.map((item) => (
            <button
              key={item.id}
              className={`type-tab ${active === item.id ? "is-active" : ""}`}
              onClick={() => setActive(item.id)}
              role="tab"
              id={`type-tab-${item.id}`}
              aria-controls="selected-type-panel"
              tabIndex={active === item.id ? 0 : -1}
              aria-selected={active === item.id}
            >
              <strong>{item.nome}</strong>
              <span>{item.frase}</span>
            </button>
          ))}
        </div>
        <div
          className="type-panel"
          id="selected-type-panel"
          role="tabpanel"
          aria-labelledby={`type-tab-${current.id}`}
          key={current.id}
        >
          <div>
            <p className="type-eyebrow">formato selecionado</p>
            <h3>
              <InteractiveText text={current.nome} interactive={false} />
            </h3>
            <p className="type-description">{current.descricao}</p>
          </div>
          <ul className="type-list">
            {current.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const steps = [
    [
      "01",
      "Você conta a ideia",
      "Explica seu objetivo, público e o estilo que você deseja para o projeto.",
    ],
    [
      "02",
      "Definimos a direção",
      "Escolhemos um modelo ou criamos a base do projeto a partir da sua marca.",
    ],
    [
      "03",
      "Montamos e ajustamos",
      "Organizamos textos, visual e versão mobile com atenção aos detalhes.",
    ],
    [
      "04",
      "Publicamos com você",
      "Colocamos o site no ar e orientamos sobre a manutenção e a próxima etapa.",
    ],
  ];
  return (
    <section className="process" id="processo">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span>04 / PROCESSO</span>
          <h2>
            <InteractiveText text="Do primeiro papo ao site no ar." />
          </h2>
        </div>
        <div className="process-list">
          {steps.map(([n, t, d]) => (
            <article className="process-card" key={n} data-reveal>
              <span>{n}</span>
              <h3>
                <InteractiveText text={t} interactive={false} />
              </h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const items = [
    [
      "Vocês fazem só modelo pronto?",
      "Não. Os modelos servem como referência visual. Também é possível personalizar cada detalhe para refletir a sua marca e o seu negócio.",
    ],
    [
      "Dá para pedir um site do zero?",
      "Sim. Se você deseja algo único, usamos este portfólio como referência de estilo e estrutura, sem limitar a criação.",
    ],
    [
      "Vocês publicam o site também?",
      "Sim. Podemos entregar o projeto pronto para publicação ou apoiar a etapa de colocar tudo no ar na Vercel, onde este portfólio já está hospedado.",
    ],
  ];
  return (
    <section className="faq" id="faq">
      <div className="shell">
        <div className="section-head section-head-dark" data-reveal>
          <span>05 / DÚVIDAS</span>
          <h2>
            <InteractiveText text="Antes de chamar, talvez você queira saber..." />
          </h2>
        </div>
        <div className="faq-list">
          {items.map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>
                {q}
                <ChevronDown size={16} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export { default as Contact } from "./Contact";
