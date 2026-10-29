import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { studio, trabalhos } from "./content";
import { safeStorage } from "./experience";
import InteractiveText from "./InteractiveText";
import {
  budgets,
  deadlines,
  emptyContact,
  formatPhone,
  phoneDigits,
  validateContact,
} from "./contact-form";

function selectedModel() {
  const candidate =
    new URLSearchParams(window.location.search).get("modelo") ||
    safeStorage.get("modo3_modelo");
  return trabalhos.some((item) => item.slug === candidate)
    ? candidate
    : "personalizado";
}

function Field({
  name,
  label,
  optional,
  error,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={`contact-field ${error ? "has-error" : ""} ${className}`}>
      <label htmlFor={name}>
        {label}
        {optional ? (
          <span className="optional">opcional</span>
        ) : (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      <p
        className={`field-note ${error ? "field-error" : ""}`}
        id={`${name}-hint`}
        aria-live="polite"
      >
        {error && <CircleAlert size={12} aria-hidden="true" />}
        {error || hint}
      </p>
    </div>
  );
}

export default function Contact() {
  const formRef = useRef(null);
  const statusRef = useRef(null);
  const sendingRef = useRef(false);
  const [form, setForm] = useState(() => emptyContact(selectedModel()));
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);
  const errors = validateContact(form);
  const essentials = ["nome", "email", "descricao", "aceite"];
  const completed = essentials.filter((key) => !errors[key]).length;
  const model = trabalhos.find((item) => item.slug === form.tipo);
  const formId = (import.meta.env.VITE_FORMSPREE_FORM_ID || "").trim();
  const isLive = /^[a-zA-Z0-9]{6,20}$/.test(formId);

  useEffect(() => {
    const update = (event) => {
      const candidate = event.detail || safeStorage.get("modo3_modelo");
      const tipo = trabalhos.some((item) => item.slug === candidate)
        ? candidate
        : "personalizado";
      setForm((old) => ({ ...old, tipo }));
    };
    window.addEventListener("modo3:modelo", update);
    return () => window.removeEventListener("modo3:modelo", update);
  }, []);

  useEffect(() => {
    if (status.message) statusRef.current?.focus();
  }, [status]);

  function update(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
    if (status.message) setStatus({ type: "", message: "" });
  }

  function fieldProps(name) {
    return {
      id: name,
      name,
      value: form[name],
      "aria-invalid": !!(touched[name] && errors[name]),
      "aria-describedby": `${name}-hint`,
      onChange: (event) => update(name, event.target.value),
      onBlur: () => setTouched((old) => ({ ...old, [name]: true })),
    };
  }

  function changePhone(event) {
    const input = event.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    let digits = phoneDigits(raw);
    let digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    if (raw.replace(/\D/g, "").length > 11 && /^\s*\+?55/.test(raw))
      digitsBeforeCaret -= 2;
    // Deleting a mask character also deletes its adjacent digit, so the caret never gets stuck.
    if (
      digits === phoneDigits(form.whatsapp) &&
      event.nativeEvent.inputType?.startsWith("delete")
    ) {
      const index =
        event.nativeEvent.inputType === "deleteContentBackward"
          ? digitsBeforeCaret - 1
          : digitsBeforeCaret;
      if (index >= 0) {
        digits = digits.slice(0, index) + digits.slice(index + 1);
        if (event.nativeEvent.inputType === "deleteContentBackward")
          digitsBeforeCaret--;
      }
    }
    const formatted = formatPhone(digits);
    update("whatsapp", formatted);
    requestAnimationFrame(() => {
      if (document.activeElement !== input || input.value !== formatted) return;
      let position = 0,
        count = 0;
      while (position < formatted.length && count < digitsBeforeCaret) {
        if (/\d/.test(formatted[position])) count++;
        position++;
      }
      input.setSelectionRange(position, position);
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    setStatus({ type: "", message: "" });
    setTouched(
      Object.fromEntries([...essentials, "whatsapp"].map((key) => [key, true])),
    );
    const invalid = Object.keys(errors)[0];
    if (invalid) {
      formRef.current.elements.namedItem(invalid)?.focus();
      return;
    }
    if (form.botField.trim()) {
      setStatus({
        type: "error",
        message: "Não foi possível validar o envio. Tente novamente.",
      });
      return;
    }
    if (!isLive) {
      setStatus({
        type: "preview",
        message:
          "O formulário está temporariamente indisponível. Seus dados continuam aqui; fale com a equipe pelo e-mail abaixo.",
      });
      return;
    }
    sendingRef.current = true;
    setSending(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const body = new FormData();
      body.append("nome", form.nome.trim());
      body.append("email", form.email.trim());
      body.append("whatsapp", phoneDigits(form.whatsapp));
      body.append("modelo", model?.nome || "Site do zero");
      body.append("mensagem", form.descricao.trim());
      body.append("prazo", form.prazo || "Não informado");
      body.append("investimento", form.investimento || "Não informado");
      body.append("consentimento", "Sim, para retorno sobre o orçamento");
      body.append("_subject", "Novo pedido de orçamento — CODIK DESIGN");
      body.append("_gotcha", form.botField);
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
        signal: controller.signal,
      });
      if (response.status === 429) {
        setStatus({
          type: "error",
          message:
            "Recebemos muitos envios em pouco tempo. Aguarde um pouco e tente novamente; seus dados continuam preenchidos.",
        });
        return;
      }
      if (!response.ok) throw new Error(`Falha no envio (${response.status})`);
      setForm(emptyContact());
      setTouched({});
      safeStorage.remove("modo3_modelo");
      setStatus({
        type: "success",
        message:
          "Sua ideia chegou até a gente! Vamos responder pelo e-mail ou WhatsApp que você informou.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.name === "AbortError"
            ? "O envio demorou mais que o esperado. Seus dados continuam aqui. Tente novamente em instantes ou fale com a equipe por e-mail."
            : "Não conseguimos enviar agora. Seus dados continuam aqui. Confira sua conexão e tente novamente, ou fale com a equipe por e-mail.",
      });
    } finally {
      clearTimeout(timeout);
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <section className="contact" id="contato">
      <div className="shell contact-grid" data-reveal>
        <div className="contact-intro">
          <span className="section-mini light">06 / CONTATO</span>
          <h2>
            <InteractiveText text="Uma boa ideia começa com um oi." />
          </h2>
          <p className="contact-copy">
            Pode chegar com um plano completo ou só uma ideia na cabeça. A gente
            encontra o próximo passo junto com você.
          </p>
          <div className="contact-conversation" aria-hidden="true">
            <span className="conversation-spark">✳</span>
            <span>
              Você imagina.
              <br />
              <em>A gente cria junto.</em>
            </span>
            <span className="conversation-line" />
          </div>
          <div className="contact-badges">
            <span>Design com a sua identidade</span>
            <span>Uma conversa antes da proposta</span>
            <span>Do primeiro rascunho à publicação</span>
          </div>
          <div className="contact-direct">
            <span>Prefere começar por um oi?</span>
            {studio.email && (
              <a
                className="contact-direct-link"
                href={`mailto:${studio.email}`}
              >
                {studio.email}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
            {studio.whatsapp && (
              <a
                className="contact-direct-link"
                href={`https://wa.me/${studio.whatsapp}?text=${encodeURIComponent("Oi! Conheci a CODIK DESIGN e queria conversar sobre um site.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chamar no WhatsApp
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        <form
          className="contact-form"
          name="orcamentos-codik"
          ref={formRef}
          onSubmit={submit}
          noValidate
          aria-label="Conte seu projeto"
          aria-busy={sending}
        >
          <div className="honeypot-field" aria-hidden="true">
            <label htmlFor="bot-field">Deixe este campo vazio</label>
            <input
              id="bot-field"
              name="_gotcha"
              tabIndex={-1}
              autoComplete="off"
              value={form.botField}
              onChange={(event) => update("botField", event.target.value)}
            />
          </div>
          <div className="contact-card-header">
            <div>
              <span className="contact-card-eyebrow">
                DO SEU JEITO, DESDE O COMEÇO
              </span>
              <h3>Conta pra gente.</h3>
              <p>O primeiro passo para tirar sua ideia do papel.</p>
            </div>
            <span className="contact-card-mark" aria-hidden="true">
              <Sparkles size={23} />
            </span>
          </div>
          <div className="contact-progress">
            <div>
              <span>
                {completed === 4
                  ? "Tudo pronto para conversar"
                  : completed > 0
                    ? "Sua ideia está tomando forma"
                    : "Vamos começar?"}
              </span>
              <span>{completed}/4 essenciais</span>
            </div>
            <div
              className="contact-progress-track"
              role="progressbar"
              aria-label="Campos obrigatórios preenchidos"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={completed}
            >
              <span style={{ width: `${completed * 25}%` }} />
            </div>
          </div>
          <fieldset className="contact-group" disabled={sending}>
            <legend>
              <span>01</span> Primeiro, você{" "}
              <small>* campos obrigatórios</small>
            </legend>
            <Field
              name="nome"
              label="Como podemos te chamar?"
              error={touched.nome && errors.nome}
            >
              <div className="contact-input-wrap">
                <UserRound size={17} aria-hidden="true" />
                <input
                  {...fieldProps("nome")}
                  autoComplete="name"
                  placeholder="Seu nome"
                  maxLength={100}
                  required
                />
              </div>
            </Field>
            <div className="contact-field-pair">
              <Field
                name="email"
                label="Seu e-mail"
                error={touched.email && errors.email}
              >
                <div className="contact-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    {...fieldProps("email")}
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="voce@empresa.com"
                    maxLength={180}
                    required
                  />
                </div>
              </Field>
              <Field
                name="whatsapp"
                label="WhatsApp"
                optional
                error={touched.whatsapp && errors.whatsapp}
                hint="Número brasileiro com DDD."
              >
                <div className="contact-input-wrap">
                  <Phone size={17} aria-hidden="true" />
                  <input
                    {...fieldProps("whatsapp")}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(11) 99999-9999"
                    pattern={String.raw`\([1-9]{2}\) [0-9]{4,5}-[0-9]{4}`}
                    maxLength={19}
                    onChange={changePhone}
                    onKeyDown={(event) => {
                      if (
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.altKey &&
                        event.key.length === 1 &&
                        !/^[0-9]$/.test(event.key)
                      )
                        event.preventDefault();
                    }}
                  />
                </div>
              </Field>
            </div>
          </fieldset>
          <fieldset className="contact-group" disabled={sending}>
            <legend>
              <span>02</span> Agora, sua ideia
            </legend>
            <Field name="tipo" label="Por onde vamos começar?" optional>
              <div className="contact-select-wrap">
                <select {...fieldProps("tipo")}>
                  <option value="personalizado">Criar um site do zero</option>
                  {trabalhos.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      Me inspirar no {item.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </Field>
            {model && (
              <p className="contact-model-note" key={model.slug}>
                <Check size={13} aria-hidden="true" />
                {model.nome} como inspiração, com a identidade da sua marca.
              </p>
            )}
            <Field
              name="descricao"
              label="O que você tem em mente?"
              error={touched.descricao && errors.descricao}
            >
              <div className="contact-textarea-wrap">
                <textarea
                  {...fieldProps("descricao")}
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Me conta sobre seu negócio, o que você quer criar e o que não pode faltar no seu site…"
                  required
                />
                <span className="contact-character-count" aria-hidden="true">
                  {form.descricao.length.toLocaleString("pt-BR")} / 2.000
                </span>
              </div>
            </Field>
          </fieldset>
          <fieldset
            className="contact-group contact-planning"
            disabled={sending}
          >
            <legend>
              <span>03</span> No seu ritmo <small>opcional</small>
            </legend>
            <p className="contact-group-copy">
              Se já souber, esses detalhes ajudam a planejar a proposta.
            </p>
            <div className="contact-field-pair">
              <Field name="prazo" label="Quando quer colocar no ar?" optional>
                <div className="contact-select-wrap">
                  <select {...fieldProps("prazo")}>
                    <option value="">Selecione o prazo</option>
                    {deadlines.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </div>
              </Field>
              <Field
                name="investimento"
                label="Investimento que tem em mente"
                optional
              >
                <div className="contact-select-wrap">
                  <select {...fieldProps("investimento")}>
                    <option value="">Selecione uma faixa</option>
                    {budgets.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden="true" />
                </div>
              </Field>
            </div>
            <p className="contact-budget-note">
              A faixa é só uma referência. O valor depende do escopo que
              definirmos juntos.
            </p>
          </fieldset>
          <div className="contact-form-footer">
            <label
              className={`consent-row ${touched.aceite && errors.aceite ? "has-error" : ""}`}
              htmlFor="aceite"
            >
              <input
                id="aceite"
                name="aceite"
                type="checkbox"
                checked={form.aceite}
                onChange={(event) => update("aceite", event.target.checked)}
                onBlur={() => setTouched((old) => ({ ...old, aceite: true }))}
                aria-describedby="aceite-hint"
                aria-invalid={!!(touched.aceite && errors.aceite)}
                required
                disabled={sending}
              />
              <span>
                Autorizo a CODIK DESIGN a usar meus dados para responder a este
                pedido de orçamento.
              </span>
            </label>
            <p
              className="field-note field-error"
              id="aceite-hint"
              aria-live="polite"
            >
              {touched.aceite && errors.aceite}
            </p>
            <button type="submit" className="contact-submit" disabled={sending}>
              <span>
                {sending
                  ? "Enviando sua ideia…"
                  : "Vamos tirar essa ideia do papel"}
              </span>
              <span className="contact-submit-icon">
                {sending ? (
                  <LoaderCircle
                    className="contact-spinner"
                    size={20}
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowUpRight size={21} aria-hidden="true" />
                )}
              </span>
            </button>
            <p className="form-privacy">
              <LockKeyhole size={12} aria-hidden="true" />
              Seus dados serão usados para responder sobre o projeto.
            </p>
            {!isLive && (
              <p className="preview-note">
                <CircleAlert size={14} aria-hidden="true" />O formulário está
                temporariamente indisponível. Você pode falar com a gente por
                e-mail
                {studio.email && (
                  <>
                    : <a href={`mailto:${studio.email}`}>{studio.email}</a>
                  </>
                )}
                .
              </p>
            )}
          </div>
          <div
            className="contact-status-region"
            aria-live="polite"
            aria-atomic="true"
          >
            {status.message && (
              <div
                className={`status-msg status-${status.type}`}
                ref={statusRef}
                tabIndex={-1}
                role="status"
              >
                {status.type === "success" ? (
                  <CheckCircle2 size={24} aria-hidden="true" />
                ) : (
                  <CircleAlert size={22} aria-hidden="true" />
                )}
                <div>
                  <strong>
                    {status.type === "success"
                      ? "Pronto. Agora é com a gente!"
                      : "Vamos tentar de outro jeito?"}
                  </strong>
                  <p>{status.message}</p>
                  {status.type !== "success" && studio.email && (
                    <a href={`mailto:${studio.email}`}>
                      Falar com a equipe{" "}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
