import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { studio, trabalhos, tiposDeSite, filtrosCategoria } from "./content";
import "./style.css";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const qsModel = new URLSearchParams(window.location.search).get("modelo") || "";

function modelUrl(model) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}${model.demo}`;
}

function makeLeadText(body) {
  return studio.whatsapp
    ? `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(body)}`
    : "";
}

function Brand({ animated = false }) {
  const logoRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!animated) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    const schedule = () => {
      setBlinking(false);
      if (hovered || focused || motion.matches) return;
      timer = window.setTimeout(
        () => {
          setBlinking(true);
          timer = window.setTimeout(schedule, 1600);
        },
        1000 + Math.random() * 2000,
      );
    };
    schedule();
    const onMotionChange = () => {
      window.clearTimeout(timer);
      schedule();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [animated, hovered, focused]);
  const playActive = () => {
    if (
      !animated ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const logo = logoRef.current;
    if (!logo) return;
    logo.getAnimations().forEach((animation) => animation.cancel());
    logo.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.9) rotate(-2deg)", offset: 0.25 },
        { transform: "scale(1.045) rotate(1deg)", offset: 0.65 },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  };
  return (
    <a
      href="#inicio"
      className={`brand brand-codik${animated ? " brand-animated" : ""}${blinking ? " is-blinking" : ""}`}
      onClick={playActive}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label="CODIK DESIGN — voltar ao início"
    >
      <span className="brand-logo-stack" ref={logoRef}>
        <img
          src={`${import.meta.env.BASE_URL}codik-logo-black.png`}
          alt="CODIK DESIGN"
          className="brand-logo"
          width={220}
          height={52}
          loading="eager"
          decoding="async"
        />
        {animated && (
          <img
            src={`${import.meta.env.BASE_URL}codik-logo.png`}
            alt=""
            aria-hidden="true"
            className="brand-logo brand-logo-flash"
            width={220}
            height={52}
            decoding="async"
          />
        )}
      </span>
      <span className="brand-credit">por Isaías, Rodrigo e Nicolas</span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("inicio");
  const barRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const total =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = total > 0 ? Math.min(1, window.scrollY / total) : 0;
        if (barRef.current)
          barRef.current.style.transform = `scaleX(${progress})`;
        const sections = [
          "inicio",
          "tipos",
          "modelos",
          "sobre",
          "processo",
          "faq",
          "contato",
        ];
        let current = "inicio";
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 190) current = id;
        }
        setActive((previous) => (previous === current ? previous : current));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);
  const links = [
    ["tipos", "Tipos de site"],
    ["modelos", "Modelos"],
    ["sobre", "Sobre"],
    ["processo", "Processo"],
    ["faq", "Dúvidas"],
    ["contato", "Pedir orçamento"],
  ];
  return (
    <header className="header">
      <div className="shell header-inner">
        <Brand animated />
        <button
          className={`mobile-toggle ${open ? "menu-open" : ""}`}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          <span className="menu-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <nav
          className={`navigation ${open ? "navigation-open" : ""}`}
          id="site-nav"
          aria-label="Menu principal"
        >
          {links.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className={`${id === "contato" ? "nav-cta" : ""} ${active === id ? "is-current" : ""}`}
              onClick={() => {
                setActive(id);
                setOpen(false);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
      <span className="page-progress" ref={barRef} aria-hidden="true" />
    </header>
  );
}

function Visual({ styleName }) {
  return (
    <div className={`visual visual-${styleName}`}>
      {styleName === "brasa" && (
        <>
          <div className="v-brasa-label">BRASA</div>
          <div className="v-brasa-title">
            sabor
            <br />
            <em>de verdade</em>
          </div>
          <div className="v-brasa-strip">CARDÁPIO • RESERVA • ENDEREÇO</div>
        </>
      )}
      {styleName === "corte" && (
        <>
          <div className="v-corte-code">013</div>
          <div className="v-corte-title">
            corte que
            <br />
            fala por você
          </div>
          <div className="v-corte-strip">AGENDE • CORTE • BARBA</div>
        </>
      )}
      {styleName === "morada" && (
        <>
          <div className="v-morada-nav">
            morada <span>arquitetura</span>
          </div>
          <div className="v-morada-box"></div>
          <div className="v-morada-word">
            projetos
            <br />
            <i>que respiram</i>
          </div>
        </>
      )}
      {styleName === "forma" && (
        <>
          <div className="v-forma-head">
            FORMA<small> treine no seu ritmo</small>
          </div>
          <div className="v-forma-circle"></div>
          <div className="v-forma-title">
            vem
            <br />
            pro jogo
          </div>
        </>
      )}
      {styleName === "flora" && (
        <>
          <div className="v-flora-head">
            flora <small>presentes & flores</small>
          </div>
          <div className="v-flora-copy">
            o gesto
            <br />
            <i>também é</i>
            <br />
            bonito
          </div>
        </>
      )}
      {styleName === "pixel" && (
        <>
          <div className="v-pixel-nav">
            pixelware <span>software de verdade</span>
          </div>
          <div className="v-pixel-bars">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="v-pixel-copy">
            menos bagunça.
            <br />
            <em>mais visão.</em>
          </div>
        </>
      )}
    </div>
  );
}

function Hero() {
  const sceneRef = useRef(null);
  const onParallax = (event) => {
    if (
      !sceneRef.current ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    )
      return;
    if (event.pointerType && event.pointerType !== "mouse") return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    sceneRef.current.style.setProperty("--parallax-x", `${x * 20}px`);
    sceneRef.current.style.setProperty("--parallax-y", `${y * 15}px`);
  };
  const resetParallax = () => {
    if (!sceneRef.current) return;
    sceneRef.current.style.setProperty("--parallax-x", "0px");
    sceneRef.current.style.setProperty("--parallax-y", "0px");
  };
  return (
    <section className="hero" id="inicio">
      <div className="shell hero-shell">
        <div className="hero-topline">
          <span>feito a seis mãos — Isaías / Rodrigo / Nicolas</span>
          <span>estúdio independente • são paulo / br</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">web design + desenvolvimento</p>
            <h1 aria-label="A sua marca merece ser vista.">
              <span className="hero-line">
                <span>A sua marca</span>
              </span>
              <span className="hero-line">
                <span>
                  <em>merece</em>
                </span>
              </span>
              <span className="hero-line">
                <span>
                  ser vista<span className="hero-period">.</span>
                </span>
              </span>
            </h1>
            <p className="hero-text">
              Você tem a ideia. A gente cuida do site. De uma página para
              apresentar seu negócio a um projeto completo, criamos algo que
              combina com você — e funciona de verdade.
            </p>
            <div className="hero-actions">
              <a href="#modelos" className="button button-dark">
                ver modelos <ArrowRight size={16} />
              </a>
              <a href="#contato" className="button button-light">
                quero meu site <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div
            className="hero-showcase"
            ref={sceneRef}
            onPointerMove={onParallax}
            onPointerLeave={resetParallax}
          >
            <div className="hero-card hero-card-main">
              <Visual styleName="brasa" />
            </div>
            <div className="hero-card hero-card-secondary">
              <Visual styleName="pixel" />
            </div>
            <div className="hero-badge">
              FEITO
              <br />
              DO SEU JEITO <span>↗</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const items = [
    "DESIGN QUE CONVERSA",
    "SITES QUE FUNCIONAM",
    "DO RASCUNHO AO LINK",
    "SEU PRÓXIMO PROJETO",
  ];
  return (
    <div className="ticker" aria-label="Design e desenvolvimento de sites">
      <div className="ticker-track" aria-hidden="true">
        {[0, 1].map((group) => (
          <div className="ticker-set" key={group}>
            {items.map((text, i) => (
              <span key={i}>
                {text} <b>✳</b>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteTypes() {
  const [active, setActive] = useState("institucional");
  const current =
    tiposDeSite.find((item) => item.id === active) || tiposDeSite[0];
  return (
    <section className="types" id="tipos">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span>01 / TIPOS DE SITE</span>
          <h2>Qual é a sua ideia?</h2>
        </div>
        <div className="type-tabs" role="tablist" aria-label="Tipos de site">
          {tiposDeSite.map((item) => (
            <button
              key={item.id}
              className={`type-tab ${active === item.id ? "is-active" : ""}`}
              onClick={() => setActive(item.id)}
              role="tab"
              aria-selected={active === item.id}
            >
              <strong>{item.nome}</strong>
              <span>{item.frase}</span>
            </button>
          ))}
        </div>
        <div className="type-panel" role="tabpanel" key={current.id}>
          <div>
            <p className="type-eyebrow">formato selecionado</p>
            <h3>{current.nome}</h3>
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

function Models() {
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("Todos");
  const [activeSlide, setActiveSlide] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const carouselRef = useRef(null);
  const visible = useMemo(
    () =>
      trabalhos.filter((item) => {
        const byTipo = tipo === "todos" || item.tipo === tipo;
        const byCat = categoria === "Todos" || item.categoria === categoria;
        return byTipo && byCat;
      }),
    [tipo, categoria],
  );

  const scrollToSlide = (index) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cards = Array.from(carousel.querySelectorAll(".model-card"));
    const target = Math.max(0, Math.min(cards.length - 1, index));
    if (!cards[target]) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const destination = cards[target].offsetLeft - cards[0].offsetLeft;
    carousel.scrollTo({
      left: destination,
      behavior: prefersReduced ? "instant" : "smooth",
    });
    setActiveSlide(target);
  };
  const moveCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const card = carousel.querySelector(".model-card");
    const step = card
      ? card.getBoundingClientRect().width + 22
      : carousel.clientWidth;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    carousel.scrollBy({
      left: direction * step,
      behavior: prefersReduced ? "instant" : "smooth",
    });
  };
  const onCarouselScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cards = Array.from(carousel.querySelectorAll(".model-card"));
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    const left = carousel.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < maxScroll - 4);
    if (!cards.length) return;
    if (maxScroll > 3 && left >= maxScroll - 4) {
      setActiveSlide(cards.length - 1);
      return;
    }
    const origin = cards[0].offsetLeft;
    const target = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(card.offsetLeft - origin - left);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Infinity },
    );
    setActiveSlide((current) =>
      current === target.index ? current : target.index,
    );
  };
  useEffect(() => {
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
    setActiveSlide(0);
    const raf = requestAnimationFrame(() => onCarouselScroll());
    return () => cancelAnimationFrame(raf);
  }, [tipo, categoria]);
  useEffect(() => {
    const update = () => onCarouselScroll();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [visible.length]);

  const reset = () => {
    setTipo("todos");
    setCategoria("Todos");
  };
  return (
    <section className="models" id="modelos">
      <div className="shell">
        <div className="section-head section-head-dark" data-reveal>
          <span>02 / MODELOS</span>
          <h2>Dá uma olhada no que a gente faz.</h2>
        </div>
        <div className="filter-block">
          <div>
            <p className="filter-title">tipo de site</p>
            <div className="filters-row">
              <button
                type="button"
                className={`filter-pill ${tipo === "todos" ? "is-active" : ""}`}
                onClick={() => setTipo("todos")}
                aria-pressed={tipo === "todos"}
              >
                Todos
              </button>
              {tiposDeSite.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`filter-pill ${tipo === item.id ? "is-active" : ""}`}
                  onClick={() => setTipo(item.id)}
                  aria-pressed={tipo === item.id}
                >
                  {item.nome}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="filter-title">segmento</p>
            <div className="filters-row">
              {filtrosCategoria.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={`filter-pill ${categoria === item ? "is-active" : ""}`}
                  onClick={() => setCategoria(item)}
                  aria-pressed={categoria === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="carousel-heading">
          <div className="model-count" aria-live="polite">
            <span>
              {visible.length}{" "}
              {visible.length === 1
                ? "modelo encontrado"
                : "modelos encontrados"}{" "}
              · deslize para explorar
            </span>
            {(tipo !== "todos" || categoria !== "Todos") && (
              <button type="button" onClick={reset}>
                limpar filtros ↗
              </button>
            )}
          </div>
          {visible.length > 1 && (
            <div className="carousel-arrows">
              <button
                type="button"
                aria-label="Modelo anterior"
                onClick={() => moveCarousel(-1)}
                disabled={!canPrev}
              >
                <ChevronLeft size={23} />
              </button>
              <button
                type="button"
                aria-label="Próximo modelo"
                onClick={() => moveCarousel(1)}
                disabled={!canNext}
              >
                <ChevronRight size={23} />
              </button>
            </div>
          )}
        </div>
        <div
          className="models-carousel"
          ref={carouselRef}
          onScroll={onCarouselScroll}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Modelos de sites"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              moveCarousel(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              moveCarousel(-1);
            }
          }}
        >
          {visible.map((item, index) => (
            <article
              className="model-card"
              key={item.slug}
              style={{ "--card-order": index }}
              aria-label={`Modelo ${index + 1} de ${visible.length}: ${item.nome}`}
            >
              <a
                className="model-preview"
                href={modelUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir demonstração do modelo ${item.nome}`}
              >
                <Visual styleName={item.estilo} />
                <span className="model-hover">
                  abrir demo <ArrowUpRight size={16} />
                </span>
              </a>
              <div className="model-top">
                <div>
                  <span className="model-meta">
                    {item.num} / {item.categoria}
                  </span>
                  <h3>{item.nome}</h3>
                </div>
                <span className="model-tag">{item.tipoLabel}</span>
              </div>
              <p className="model-description">{item.descricao}</p>
              <p className="model-summary">{item.resumo}</p>
              <div className="model-actions">
                <a
                  href={modelUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ver demo
                </a>
                <a
                  href="#contato"
                  onClick={() => {
                    sessionStorage.setItem("modo3_modelo", item.slug);
                    window.dispatchEvent(
                      new CustomEvent("modo3:modelo", { detail: item.slug }),
                    );
                  }}
                >
                  quero algo assim
                </a>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="empty-filter">
              Ainda não temos um modelo nessa combinação.{" "}
              <button type="button" onClick={reset}>
                Ver todos ↗
              </button>
            </div>
          )}
        </div>
        {visible.length > 1 && (
          <div className="carousel-bottom">
            <div className="carousel-pagination" aria-label="Escolher modelo">
              {visible.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={index === activeSlide ? "is-active" : ""}
                  aria-label={`Ir para ${item.nome}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  onClick={() => scrollToSlide(index)}
                />
              ))}
            </div>
            <span className="carousel-position">
              {String(activeSlide + 1).padStart(2, "0")} /{" "}
              {String(visible.length).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about" id="sobre">
      <div className="shell about-grid" data-reveal>
        <div>
          <span className="section-mini">03 / SOBRE A CODIK DESIGN</span>
          <h2>Três devs. Diferentes ideias. O mesmo cuidado com cada pixel.</h2>
        </div>
        <div>
          <p className="about-lead">
            A gente gosta de pegar uma ideia no papel e transformar em algo que
            dá orgulho de mostrar.
          </p>
          <p>
            Somos <strong>Isaías, Rodrigo e Nicolas</strong>. Juntamos
            desenvolvimento e design para montar sites rápidos, bonitos e
            práticos. Sem formulário gigante para começar: é só chamar e contar
            o que você precisa.
          </p>
          <div className="member-list">
            {studio.membros.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    [
      "01",
      "Você conta sua ideia",
      "Conta o que você precisa, para quem é e o estilo que curte.",
    ],
    [
      "02",
      "A gente define a direção",
      "Escolhemos um modelo ou criamos algo do zero como base do projeto.",
    ],
    [
      "03",
      "Montamos e ajustamos",
      "Organizamos texto, visual e versão mobile com carinho nos detalhes.",
    ],
    [
      "04",
      "Publicamos com você",
      "Colocamos o site no ar e explicamos como manter tudo funcionando.",
    ],
  ];
  return (
    <section className="process" id="processo">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span>04 / PROCESSO</span>
          <h2>Do primeiro papo ao site no ar.</h2>
        </div>
        <div className="process-list">
          {steps.map(([n, t, d]) => (
            <article className="process-card" key={n} data-reveal>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    [
      "Vocês fazem só modelo pronto?",
      "Não. Os modelos servem para mostrar direção visual. A gente também pode personalizar tudo para o seu negócio.",
    ],
    [
      "Dá para pedir um site do zero?",
      "Sim. Se você quiser algo único, usamos esse portfólio só como referência de estilo e estrutura.",
    ],
    [
      "Vocês publicam o site também?",
      "Sim. A gente pode entregar o projeto pronto para publicar ou ajudar a colocar no ar na Vercel, onde nosso portfólio já está hospedado.",
    ],
  ];
  return (
    <section className="faq" id="faq">
      <div className="shell">
        <div className="section-head section-head-dark" data-reveal>
          <span>05 / DÚVIDAS</span>
          <h2>Antes de chamar, talvez você queira saber...</h2>
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

function Contact() {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    tipo: qsModel || sessionStorage.getItem("modo3_modelo") || "personalizado",
    descricao: "",
    aceite: false,
    botField: "",
  });

  useEffect(() => {
    const update = (event) => {
      const selected = event?.detail || sessionStorage.getItem("modo3_modelo");
      if (selected) setForm((old) => ({ ...old, tipo: selected }));
    };
    update();
    window.addEventListener("modo3:modelo", update);
    return () => window.removeEventListener("modo3:modelo", update);
  }, []);

  const formId = (import.meta.env.VITE_FORMSPREE_FORM_ID || "").trim();
  const isLive = /^[a-zA-Z0-9]{6,20}$/.test(formId);
  const endpoint = `https://formspree.io/f/${formId}`;
  const whatsappMessage =
    "Oi! Conheci a CODIK DESIGN pelo portfólio e queria saber mais sobre a criação de um site.";

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    setStatus({ type: "", message: "" });
    if (form.botField.trim()) {
      setStatus({
        type: "error",
        message: "Não foi possível validar o envio.",
      });
      return;
    }
    if (!form.aceite) {
      setStatus({
        type: "error",
        message: "Precisamos da sua autorização para responder ao pedido.",
      });
      return;
    }
    if (!isLive) {
      setStatus({
        type: "preview",
        message:
          "Este formulário ainda não está recebendo mensagens. Tente novamente mais tarde ou use um canal direto da equipe.",
      });
      return;
    }
    setSending(true);
    try {
      const body = new FormData();
      body.append("nome", form.nome.trim());
      body.append("email", form.email.trim());
      body.append("whatsapp", form.whatsapp.trim());
      body.append(
        "modelo",
        trabalhos.find((item) => item.slug === form.tipo)?.nome ||
          "Site do zero",
      );
      body.append("mensagem", form.descricao.trim());
      body.append("consentimento", "Sim, para retorno sobre o orçamento");
      body.append("_subject", "Novo pedido de orçamento — CODIK DESIGN");
      body.append("_gotcha", form.botField);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      if (response.status === 429) {
        setStatus({
          type: "error",
          message:
            "Muitos envios em pouco tempo. Espere um pouco e tente novamente.",
        });
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const detail = Array.isArray(payload.errors)
          ? payload.errors
              .map((item) => item.message)
              .filter(Boolean)
              .join(" ")
          : "";
        throw new Error(detail || `Falha no envio (${response.status})`);
      }
      setStatus({
        type: "success",
        message:
          "Mensagem enviada! Seu pedido chegou ao nosso formulário. Entraremos em contato pelo e-mail ou WhatsApp informado.",
      });
      setForm({
        nome: "",
        email: "",
        whatsapp: "",
        tipo: "personalizado",
        descricao: "",
        aceite: false,
        botField: "",
      });
      sessionStorage.removeItem("modo3_modelo");
    } catch (error) {
      console.error("Não foi possível enviar o orçamento:", error);
      setStatus({
        type: "error",
        message:
          "Não deu para enviar agora. Confira sua conexão e tente novamente. Se preferir, use nosso WhatsApp, quando disponível.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="contact" id="contato">
      <div className="shell contact-grid" data-reveal>
        <div>
          <span className="section-mini light">06 / CONTATO</span>
          <h2>Gostou do que viu? Bora conversar.</h2>
          <p className="contact-copy">
            Preencha o formulário e conte um pouco sobre o seu projeto. A gente
            recebe seu pedido de orçamento e entra em contato.
          </p>
          <div className="contact-badges">
            <span>site responsivo</span>
            <span>projeto personalizado</span>
            <span>publicação incluída no planejamento</span>
          </div>
          {studio.email && (
            <a className="contact-direct-link" href={`mailto:${studio.email}`}>
              Fale com a equipe: {studio.email} <ArrowUpRight size={16} />
            </a>
          )}
          {studio.whatsapp && (
            <a
              className="contact-direct-link"
              href={makeLeadText(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prefere conversar por WhatsApp? <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <form
          className="contact-form"
          name="orcamentos-codik"
          onSubmit={submit}
        >
          <div className="honeypot-field" aria-hidden="true">
            <label htmlFor="bot-field">Deixe este campo vazio</label>
            <input
              id="bot-field"
              name="_gotcha"
              tabIndex="-1"
              autoComplete="off"
              value={form.botField}
              onChange={(e) =>
                setForm((old) => ({ ...old, botField: e.target.value }))
              }
            />
          </div>
          <div className="contact-form-top">
            <span>FALE COM A EQUIPE</span>
            <span>✳</span>
          </div>
          <label htmlFor="nome">
            Seu nome <span aria-hidden="true">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            value={form.nome}
            maxLength={100}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Como podemos te chamar?"
            autoComplete="name"
            required
          />

          <label htmlFor="email">
            Seu e-mail <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            maxLength={180}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
          />

          <label htmlFor="whatsapp">
            WhatsApp <span className="optional">(opcional)</span>
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            value={form.whatsapp}
            maxLength={30}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="(11) 99999-9999"
            autoComplete="tel"
          />

          <label htmlFor="tipo">Qual modelo chamou sua atenção?</label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="personalizado">Quero um site do zero</option>
            {trabalhos.map((item) => (
              <option key={item.slug} value={item.slug}>
                Quero algo como {item.nome}
              </option>
            ))}
          </select>

          <label htmlFor="descricao">
            Conta sua ideia <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows="5"
            minLength={10}
            maxLength={2000}
            required
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="O que seu negócio faz? O que você gostaria de ter no site?"
          />

          <label className="consent-row" htmlFor="aceite">
            <input
              id="aceite"
              name="aceite"
              type="checkbox"
              value="sim"
              checked={form.aceite}
              onChange={(e) => setForm({ ...form, aceite: e.target.checked })}
              required
            />
            <span>
              Autorizo a CODIK DESIGN a usar meus dados para responder a este
              pedido de orçamento.
            </span>
          </label>
          <button
            type="submit"
            disabled={sending}
            className="button button-dark full"
          >
            {sending ? "enviando…" : "enviar orçamento"}{" "}
            <ArrowUpRight size={16} />
          </button>
          <p className="form-privacy">
            Seus dados serão usados para entrar em contato sobre a proposta.
          </p>
          {!isLive && (
            <p className="preview-note">
              Pedidos de orçamento temporariamente indisponíveis. Entre em
              contato pelos outros canais da equipe.
            </p>
          )}
          {status.message && (
            <p
              role="status"
              aria-live="polite"
              className={`status-msg status-${status.type}`}
            >
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <Brand />
        <div className="footer-copy">
          <p>Design, código e boas ideias.</p>
          <small>
            © {new Date().getFullYear()} CODIK DESIGN — oferecimento dos devs
            Isaías, Rodrigo e Nicolas.
          </small>
        </div>
        <a href="#inicio" className="back-link">
          voltar ao topo
        </a>
      </div>
    </footer>
  );
}

function App() {
  useEffect(() => {
    const targets = () =>
      document.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      targets().forEach((el) => el.classList.add("is-visible"));
      return;
    }
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -35px 0px" },
    );
    const observe = () => targets().forEach((el) => observer.observe(el));
    observe();
    const mutation = new MutationObserver(observe);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Ticker />
        <SiteTypes />
        <Models />
        <About />
        <Process />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
