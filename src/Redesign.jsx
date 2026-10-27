import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Eye,
  RotateCcw,
  Search,
  SunMoon,
  X,
} from "lucide-react";
import { filtrosCategoria, studio, tiposDeSite, trabalhos } from "./content";
import { Contact, FAQ, Process, SiteTypes } from "./Sections";
import InteractiveText, { SplitWord } from "./InteractiveText";
import {
  chooseModel,
  demoUrl,
  previewUrl,
  safeStorage,
  useConfetti,
  useMagnetism,
  useMedia,
  usePointerExperience,
} from "./experience";

function Intro({ active, run, onReveal, onFinish, reduce }) {
  const [phase, setPhase] = useState("enter");
  const [count, setCount] = useState(0);
  const skipRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    if (reduce) {
      onReveal();
      onFinish();
      return;
    }
    setPhase("enter");
    setCount(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    const started = performance.now();
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - started) / 1900);
      setCount(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timers = [
      setTimeout(() => setPhase("letters-out"), 2400),
      setTimeout(() => {
        setPhase("curtain-out");
        onReveal();
      }, 2900),
      setTimeout(onFinish, 3900),
    ];
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onReveal();
        onFinish();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, run, reduce, onReveal, onFinish]);
  if (!active) return null;
  return (
    <div
      className={`intro-overlay ${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura Codik Design"
      onClick={() => {
        onReveal();
        onFinish();
      }}
    >
      <div className="intro-word" aria-hidden="true">
        {[..."codik"].map((letter, i) => (
          <span className="intro-letter" key={i} style={{ "--i": i }}>
            {letter}
          </span>
        ))}
        <sup>®</sup>
      </div>
      <span className="intro-tag" aria-hidden="true">
        design e desenvolvimento web
      </span>
      <span className="intro-count" aria-hidden="true">
        {String(count).padStart(3, "0")}%
      </span>
      <button
        type="button"
        className="intro-skip"
        ref={skipRef}
        onClick={() => {
          onReveal();
          onFinish();
        }}
      >
        Pular abertura <span>ESC ↗</span>
      </button>
    </div>
  );
}

function ThemeToggle() {
  const osDark = useMedia("(prefers-color-scheme: dark)");
  const [manual, setManual] = useState(() => {
    try {
      const stored = localStorage.getItem("codik-theme");
      return ["light", "dark"].includes(stored) ? stored : null;
    } catch {
      return null;
    }
  });
  const theme = manual || (osDark ? "dark" : "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <button
      type="button"
      data-magnetic
      className="icon-button theme-toggle"
      aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setManual(next);
        try {
          localStorage.setItem("codik-theme", next);
        } catch {
          /* Theme still works without storage. */
        }
      }}
    >
      <SunMoon size={19} strokeWidth={1.5} />
    </button>
  );
}

function Header({ onReplay, reduce }) {
  return (
    <header className="editorial-header">
      <a
        className="wordmark"
        href="#inicio"
        aria-label="Codik Design — início"
        data-magnetic
      >
        CODIK<sup>®</sup>
      </a>
      <nav aria-label="Navegação principal">
        <a href="#modelos" data-magnetic>
          Trabalhos
        </a>
        <a href="#sobre" className="nav-about" data-magnetic>
          O estúdio
        </a>
        <a href="#contato" data-magnetic>
          Contato <span>↗</span>
        </a>
        <div className="nav-controls">
          <ThemeToggle />
          <button
            type="button"
            data-magnetic
            className="icon-button replay-button"
            aria-label="Rever abertura"
            onClick={onReplay}
            disabled={reduce}
            title={
              reduce
                ? "Abertura desativada pela preferência de movimento reduzido"
                : "Rever a abertura"
            }
          >
            <RotateCcw size={18} strokeWidth={1.5} />
          </button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <section
      className="editorial-hero"
      id="inicio"
      aria-labelledby="hero-title"
    >
      <div className="hero-top-note">
        <span>ESTÚDIO INDEPENDENTE / SÃO PAULO, BR</span>
        <span>DESIGN + DESENVOLVIMENTO WEB</span>
      </div>
      <div className="hero-main">
        <h1 id="hero-title" aria-label="Sites que ninguém esquece.">
          <span className="hero-line" aria-hidden="true">
            <span style={{ "--delay": ".2s" }}>
              <SplitWord text="Sites que" />
            </span>
          </span>
          <span className="hero-line serif-line" aria-hidden="true">
            <span style={{ "--delay": ".3s" }}>
              <em>
                <SplitWord text="ninguém" interactive={false} />
              </em>
            </span>
          </span>
          <span className="hero-line" aria-hidden="true">
            <span style={{ "--delay": ".4s" }}>
              <SplitWord text="esquece." />
            </span>
          </span>
        </h1>
        <div className="hero-side-note">
          <span>FEITO A SEIS MÃOS.</span>
          <p>
            A sua marca
            <br />
            merece ser vista.
          </p>
          <a
            href="#modelos"
            data-magnetic
            aria-label="Explorar os modelos de sites"
          >
            <ArrowDown size={30} strokeWidth={1.25} />
          </a>
        </div>
      </div>
      <p className="hero-pointer-hint" aria-hidden="true">
        ↑ passe o mouse sobre o título
      </p>
      <div className="hero-meta">
        <p>
          Estúdio independente de design e desenvolvimento web, feito por{" "}
          <strong>Isaías, Rodrigo e Nicolas.</strong>
        </p>
        <span className="availability">
          <i />
          disponível para projetos
        </span>
        <span className="local-clock">
          São Paulo, <time>{clock || "—:—"}</time>
        </span>
      </div>
    </section>
  );
}

function Marquee() {
  return (
    <div className="editorial-marquee" aria-hidden="true">
      <div>
        {[0, 1].map((set) => (
          <span key={set}>
            {Array.from({ length: 6 }, (_, i) => (
              <React.Fragment key={i}>
                CODIK DESIGN® <i>✦</i>
              </React.Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewDialog({ item, onClose }) {
  const dialogRef = useRef(null),
    stageRef = useRef(null);
  const [device, setDevice] = useState("desktop"),
    [size, setSize] = useState({ width: 900, height: 600 });
  useEffect(() => {
    const dialog = dialogRef.current,
      previous = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(stageRef.current);
    return () => {
      observer.disconnect();
      document.body.style.overflow = previous;
    };
  }, []);
  const width = device === "desktop" ? 1440 : 390,
    scale = Math.max(0.1, Math.min(1, size.width / width));
  return (
    <dialog
      className="site-preview-dialog"
      ref={dialogRef}
      aria-labelledby="preview-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="preview-toolbar">
        <div>
          <span>MODELO CONCEITUAL / {item.categoria}</span>
          <h3 id="preview-title">{item.nome}</h3>
        </div>
        <div
          className="device-switch"
          role="group"
          aria-label="Formato da prévia"
        >
          <button
            type="button"
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            Celular
          </button>
        </div>
        <button
          type="button"
          className="icon-button preview-close"
          onClick={onClose}
          aria-label="Fechar prévia"
        >
          <X size={23} />
        </button>
      </div>
      <div className="preview-live-stage" ref={stageRef}>
        <div
          className="preview-live-frame"
          style={{ width: width * scale, height: size.height }}
        >
          <iframe
            key={device}
            title={`Demonstração interativa: ${item.nome}`}
            src={`${demoUrl(item)}?preview=1`}
            style={{
              width,
              height: size.height / scale,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      </div>
      <div className="preview-footer">
        <p>{item.descricao}</p>
        <a href={demoUrl(item)} target="_blank" rel="noopener noreferrer">
          Abrir demo <ArrowUpRight size={15} />
        </a>
        <a
          className="preview-select"
          href="#contato"
          onClick={() => {
            chooseModel(item);
            onClose();
          }}
        >
          Quero esse estilo <ArrowRight size={15} />
        </a>
      </div>
    </dialog>
  );
}

function WorkList({ onHover, fine }) {
  const [category, setCategory] = useState("Todos"),
    [type, setType] = useState("todos"),
    [search, setSearch] = useState(""),
    [preview, setPreview] = useState(null);
  const openerRef = useRef(null);
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const visible = useMemo(
    () =>
      trabalhos.filter(
        (item) =>
          (category === "Todos" || item.categoria === category) &&
          (type === "todos" || item.tipo === type) &&
          normalize(
            `${item.nome} ${item.categoria} ${item.descricao} ${item.resumo} ${item.tipoLabel}`,
          ).includes(normalize(search.trim())),
      ),
    [category, type, search],
  );
  const filtered =
    category !== "Todos" || type !== "todos" || search.length > 0;
  const close = () => {
    setPreview(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  };
  const reset = () => {
    setCategory("Todos");
    setType("todos");
    setSearch("");
    onHover(null);
  };
  useEffect(() => {
    onHover(null);
  }, [category, type, search, onHover]);
  return (
    <section
      className="editorial-works section-pad"
      id="modelos"
      aria-labelledby="work-title"
    >
      <span className="anchor-alias" id="trabalhos" />
      <div className="works-heading" data-reveal>
        <div>
          <span className="section-label">01 / EXPLORE AS POSSIBILIDADES</span>
          <h2 id="work-title">
            <InteractiveText text="Trabalhos" />
            <sup>{String(trabalhos.length).padStart(2, "0")}</sup>
          </h2>
        </div>
        <p>
          Seu próximo site começa com uma ideia.
          <br />
          <span>Modelos conceituais. Imagine sua marca aqui.</span>
        </p>
      </div>
      <div
        className="work-filters"
        role="group"
        aria-label="Filtrar por segmento"
      >
        {filtrosCategoria.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={() => setCategory(name)}
          >
            {name}
            <sup>
              {name === "Todos"
                ? trabalhos.length
                : trabalhos.filter((item) => item.categoria === name).length}
            </sup>
          </button>
        ))}
      </div>
      <div className="work-search-bar">
        <label>
          <Search size={16} />
          <input
            type="search"
            aria-label="Buscar modelos"
            placeholder="Busque um nome, um estilo, uma ideia…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <label>
          <span className="sr-only">Tipo de site</span>
          <select
            aria-label="Tipo de site"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="todos">Todos os tipos de site</option>
            {tiposDeSite.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="work-list-note">
        <span role="status">
          {visible.length} {visible.length === 1 ? "modelo" : "modelos"} /{" "}
          {category === "Todos" ? "todos os segmentos" : category}
        </span>
        {filtered ? (
          <button type="button" onClick={reset}>
            Limpar filtros <X size={12} />
          </button>
        ) : (
          <span>
            Explore uma direção <ArrowDown size={12} />
          </span>
        )}
      </div>
      <div className="work-list" onPointerLeave={() => onHover(null)}>
        {visible.map((item) => (
          <article className="work-entry" key={item.slug}>
            <a
              className="work-row"
              href={demoUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Explorar ${item.nome}, ${item.categoria}, ${item.tipoLabel}`}
              onPointerEnter={(event) => {
                if (fine && event.pointerType === "mouse") onHover(item);
              }}
              onPointerLeave={() => onHover(null)}
            >
              <span className="work-number">{item.num}</span>
              <b>
                <InteractiveText text={item.nome} interactive={false} />
                <small>{item.tipoLabel}</small>
              </b>
              <i>{item.categoria}</i>
              <span className="work-year">{item.ano}</span>
              <ArrowUpRight
                className="row-arrow"
                size={23}
                strokeWidth={1.25}
              />
            </a>
            <div className="work-row-tools">
              <button
                type="button"
                aria-label={`Prévia de ${item.nome}`}
                className="work-preview-button"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  onHover(null);
                  setPreview(item);
                }}
              >
                <Eye size={18} strokeWidth={1.4} />
              </button>
              <a
                href="#contato"
                className="work-choose"
                aria-label={`Quero um site como ${item.nome}`}
                onClick={() => chooseModel(item)}
              >
                <ArrowRight size={18} strokeWidth={1.4} />
              </a>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="work-empty">
          <h3>Nenhum modelo nessa combinação.</h3>
          <p>Uma nova busca pode abrir outras possibilidades.</p>
          <button type="button" className="text-action" onClick={reset}>
            Ver todos os modelos <ArrowUpRight size={18} />
          </button>
        </div>
      )}
      <div className="work-footnote">
        <span>Os modelos são referências. A identidade final será a sua.</span>
        <a
          href="#contato"
          onClick={() => {
            safeStorage.remove("modo3_modelo");
            window.dispatchEvent(
              new CustomEvent("modo3:modelo", { detail: "personalizado" }),
            );
          }}
        >
          Também criamos do zero <ArrowUpRight size={16} />
        </a>
      </div>
      {preview && <PreviewDialog item={preview} onClose={close} />}
    </section>
  );
}

function Studio() {
  return (
    <section className="studio-section section-pad" id="sobre">
      <div className="studio-intro" data-reveal>
        <div>
          <span className="section-label">03 / SOBRE A CODIK DESIGN</span>
          <h2>
            <InteractiveText text="Três devs." />
            <br />
            <InteractiveText text="Diferentes ideias." />
            <br />
            <em>O mesmo cuidado.</em>
          </h2>
        </div>
        <div className="studio-copy">
          <p className="studio-lead">O mesmo cuidado com cada pixel.</p>
          <p>
            Gostamos de transformar uma ideia em algo com presença, clareza e
            propósito.
          </p>
          <p>
            Somos <strong>Isaías, Rodrigo e Nicolas</strong>. Unimos design e
            desenvolvimento para criar sites rápidos, bonitos e eficientes — com
            uma conversa simples e um processo claro desde o começo.
          </p>
          <p className="studio-original-copy">
            Você tem a ideia. Nós cuidamos do site. Do primeiro esboço ao
            produto final, criamos experiências que refletem sua marca e
            funcionam na prática.
          </p>
        </div>
      </div>
      <div className="team-editorial">
        {studio.equipe.map(({ nome: name, foto, funcao, github }, index) => (
          <a
            className="team-person"
            key={name}
            data-reveal
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver GitHub de ${name} (abre em nova aba)`}
          >
            <div
              className="team-portrait"
              aria-label={`Retrato de ${name} ainda não disponível`}
            >
              <span className="portrait-index">0{index + 1} / CODIK</span>
              <span className="portrait-monogram" aria-hidden="true">
                {name.charAt(0)}
                <i>®</i>
              </span>
              <span className="portrait-caption">FEITO A SEIS MÃOS.</span>
            </div>
            <div className="team-person-name">
              <h3>
                <InteractiveText text={name} interactive={false} />
              </h3>
              <ArrowUpRight size={22} strokeWidth={1.25} />
            </div>
            <span className="team-role">{funcao || "Equipe Codik Design"}</span>
            <span className="team-profile-link">
              GitHub <ArrowUpRight size={13} aria-hidden="true" />
            </span>
            {/* TODO: substituir a composição tipográfica pela foto real e informar a função de cada sócio. Nomes reais preservados de content.js. */}
          </a>
        ))}
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section className="editorial-cta" aria-labelledby="cta-title">
      <div data-reveal>
        <span className="section-label">VAMOS CRIAR ALGUMA COISA JUNTOS</span>
        <h2 id="cta-title">
          <InteractiveText text="Bora fazer algo" />
          <br />
          <em>fora do comum?</em>
        </h2>
        <a
          className="contact-orbit"
          href="#contato"
          data-magnetic
          data-contact-burst
        >
          Falar com
          <br />a gente <ArrowUpRight size={24} strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="editorial-footer">
      <a
        href="#inicio"
        className="footer-wordmark"
        aria-label="Codik Design — voltar ao início"
      >
        CODIK DESIGN<sup>®</sup>
      </a>
      <span>
        © {new Date().getFullYear()} / Design, código e boas ideias.
        <br />
        Feito em São Paulo, por Isaías, Rodrigo e Nicolas.
      </span>
      <a href={`mailto:${studio.email}`}>
        {studio.email} <ArrowUpRight size={14} />
      </a>
      <a href="#inicio" className="footer-top">
        Voltar ao topo ↑
      </a>
    </footer>
  );
}

// Hovering a model only updates the floating card, not the full page's text,
// forms and catalog. State changes within these sections still render normally.
const SiteContent = memo(function SiteContent({
  active,
  fine,
  reduce,
  onReplay,
  onHover,
}) {
  return (
    <div className="site-content" {...(active ? { inert: "" } : {})}>
      <Header onReplay={onReplay} reduce={reduce} />
      <main id="main-content">
        <Hero />
        <Marquee />
        <WorkList onHover={onHover} fine={fine && !reduce} />
        <SiteTypes />
        <Studio />
        <Process />
        <FAQ />
        <ContactCTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
});

export default function Redesign() {
  const scopeRef = useRef(null);
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  const fine = useMedia("(hover: hover) and (pointer: fine)");
  const [active, setActive] = useState(() => !reduce);
  const [ready, setReady] = useState(!active),
    [run, setRun] = useState(0),
    [hover, setHover] = useState(null),
    [previewItem, setPreviewItem] = useState(null);
  const onHover = useCallback((item) => {
    setHover(item);
    // Retain the last screenshot during its existing fade-out, and request
    // nothing until a fine pointer actually opens a preview.
    if (item) setPreviewItem(item);
  }, []);
  const onReveal = useCallback(() => setReady(true), []);
  const onFinish = useCallback(() => {
    setActive(false);
    setReady(true);
    window.dispatchEvent(new Event("codik:intro-end"));
  }, []);
  const onReplay = useCallback(() => {
    if (!reduce) {
      setReady(false);
      setActive(true);
      setRun((previous) => previous + 1);
    }
  }, [reduce]);
  usePointerExperience(scopeRef, fine && !reduce && !active);
  useMagnetism(scopeRef, fine && !reduce && !active);
  useConfetti(scopeRef, !reduce && !active);
  useEffect(() => {
    const targets = [...scopeRef.current.querySelectorAll("[data-reveal]")];
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    document.documentElement.classList.add("reveal-enabled");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.15 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-enabled");
    };
  }, [reduce]);
  useEffect(() => {
    if (active) return;
    const hash = location.hash.slice(1);
    if (!hash) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: "instant", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return (
    <div
      ref={scopeRef}
      className={`redesign-app ${ready ? "hero-ready" : "hero-waiting"}`}
    >
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <SiteContent
        active={active}
        fine={fine}
        reduce={reduce}
        onReplay={onReplay}
        onHover={onHover}
      />
      <div className="custom-cursor" aria-hidden="true" />
      <div
        className={`work-hover-preview ${hover && fine && !reduce ? "is-on" : ""}`}
        aria-hidden="true"
      >
        <div className="hover-browser">
          <span>● ● ●</span>
          <span>CODIK / DEMO</span>
          <ArrowUpRight size={12} />
        </div>
        <div className="hover-preview-image">
          {previewItem && fine && !reduce && (
            <picture>
              <source
                type="image/webp"
                srcSet={`${previewUrl(previewItem, 260, "webp")} 1x, ${previewUrl(previewItem, 520, "webp")} 2x`}
              />
              <img
                src={previewUrl(previewItem, 520)}
                srcSet={`${previewUrl(previewItem, 260)} 1x, ${previewUrl(previewItem, 520)} 2x`}
                width="1440"
                height="3800"
                decoding="async"
                alt=""
              />
            </picture>
          )}
        </div>
        <div className="hover-preview-caption">
          <b>{hover?.nome}</b>
          <span>{hover?.tipoLabel}</span>
        </div>
      </div>
      <Intro
        active={active}
        run={run}
        onReveal={onReveal}
        onFinish={onFinish}
        reduce={reduce}
      />
    </div>
  );
}
