import { useEffect, useRef, useState } from "react";
import "./cookie-banner.css";

// ID publico do GA4 (ex.: G-XXXXXXXXXX), definido em VITE_GA_ID.
// Sem ID válido, o banner funciona e nenhum script de medição é carregado.
const GA_ID = /^G-[A-Z0-9]+$/.test(import.meta.env.VITE_GA_ID || "")
  ? import.meta.env.VITE_GA_ID : null;
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
const KEY = "codik:cookie-consent";
const OPEN_EVENT = "codik:open-cookie-settings";

// Guarda em memoria quando o localStorage esta bloqueado.
let memory = null;

function readConsent() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const value = JSON.parse(raw);
      const age = Date.now() - Date.parse(value?.at);
      if (value?.v === 1 && typeof value.analytics === "boolean" && age >= 0 && age < MAX_AGE) return value;
    }
  } catch {
    /* storage bloqueado ou JSON invalido */
  }
  return memory;
}

function writeConsent(analytics) {
  const value = { analytics, at: new Date().toISOString(), v: 1 };
  memory = value;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage bloqueado: a escolha vale so nesta sessao */
  }
  return value;
}

let gaLoaded = false;

function enableAnalytics() {
  if (!GA_ID) return;
  window[`ga-disable-${GA_ID}`] = false;
  if (gaLoaded) return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 60 * 60 * 24 * 180,
    cookie_update: false,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
  });

  const script = document.createElement("script");
  script.async = true;
  script.onerror = () => { gaLoaded = false; script.remove(); };
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

function disableAnalytics() {
  if (!GA_ID) return;
  window[`ga-disable-${GA_ID}`] = true;

  const host = window.location.hostname;
  const labels = host.split(".");
  const domains = labels.map((_, i) => `.${labels.slice(i).join(".")}`);
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

  document.cookie.split(";").forEach((item) => {
    const name = item.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      document.cookie = `${name}=; ${expired}`;
      domains.forEach((d) => {
        document.cookie = `${name}=; ${expired}; domain=${d}`;
      });
    }
  });
}

// Use em um botao do rodape: onClick={openCookieSettings}
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function CookieBanner({
  privacyHref = "/privacidade",
  delay = 4500, // espera a abertura do site terminar; use 0 se remove-la
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const openedByUser = useRef(false);

  useEffect(() => {

    const saved = readConsent();
    if (saved?.analytics === true) enableAnalytics();
    else disableAnalytics();

    let timer;
    if (!saved) timer = window.setTimeout(() => setOpen(true), delay);

    const onOpen = () => {
      openedByUser.current = true;
      setOpen(true);
    };
    const onStorage = (event) => {
      if (event.key !== KEY && event.key !== null) return;
      memory = null;
      const value = readConsent();
      if (value?.analytics === true) enableAnalytics();
      else disableAnalytics();
      setOpen(!value);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("storage", onStorage);
    };
  }, [delay]);

  // Quem reabre pelo rodape (teclado ou leitor de tela) recebe o foco no banner.
  useEffect(() => {
    if (open && openedByUser.current) {
      ref.current?.querySelector("button")?.focus();
      openedByUser.current = false;
    }
  }, [open]);

  function decide(analytics) {
    writeConsent(analytics);
    if (analytics) enableAnalytics();
    else disableAnalytics();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <section
      ref={ref}
      className="ck"
      role="region"
      aria-labelledby="ck-title"
      aria-describedby="ck-desc"
    >
      <h2 id="ck-title" className="ck__title">
        Medição de visitas
      </h2>
      <p id="ck-desc" className="ck__text">
        Com o seu aceite, usamos cookies de análise para entender quais páginas
        ajudam quem nos visita. Sem aceite, o Google Analytics não é carregado. O tema claro ou
        escuro fica salvo só no seu navegador e não depende disso.{" "}
        <a href={privacyHref}>Política de privacidade</a>
      </p>
      <div className="ck__actions">
        <button type="button" className="ck__btn" onClick={() => decide(false)}>
          Recusar
        </button>
        <button
          type="button"
          className="ck__btn ck__btn--accept"
          onClick={() => decide(true)}
        >
          Aceitar
        </button>
      </div>
    </section>
  );
}
