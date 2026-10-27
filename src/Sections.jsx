import React, { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { studio, trabalhos, tiposDeSite } from "./content";
import { safeStorage } from "./experience";
import InteractiveText from "./InteractiveText";

const qsModel = new URLSearchParams(window.location.search).get("modelo") || "";
if (qsModel) safeStorage.set("modo3_modelo", qsModel);
function makeLeadText(body) {
  return studio.whatsapp
    ? `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(body)}`
    : "";
}

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

export function Contact() {
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    tipo: qsModel || safeStorage.get("modo3_modelo") || "personalizado",
    descricao: "",
    aceite: false,
    botField: "",
  });

  useEffect(() => {
    const update = (event) => {
      const selected = event?.detail || safeStorage.get("modo3_modelo");
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
      safeStorage.remove("modo3_modelo");
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
          <h2>
            <InteractiveText text="Gostou do que viu? Bora conversar." />
          </h2>
          <p className="contact-copy">
            Preencha o formulário e conte um pouco sobre o seu projeto. Nós
            recebemos o pedido de orçamento e retornamos em seguida.
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
