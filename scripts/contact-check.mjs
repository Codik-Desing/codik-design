// Exercises the actual React form in Chrome. Formspree requests are intercepted;
// no test messages are delivered and no local environment files are changed.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";
import { chromeSession, delay } from "./chrome-session.mjs";

const unconfigured = process.argv.includes("--unconfigured");
const server = await createServer({
  server: { host: "127.0.0.1", port: 4175, strictPort: true },
  define: {
    "import.meta.env.VITE_FORMSPREE_FORM_ID": JSON.stringify(
      unconfigured ? "" : "contactqa",
    ),
  },
});
let browser;
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
try {
  await server.listen();
  browser = await chromeSession(9342);
  const { call, evaluate } = browser;
  const exceptions = [];
  browser.onEvent((packet) => {
    if (packet.method === "Runtime.exceptionThrown")
      exceptions.push(packet.params.exceptionDetails.text);
  });
  await call("Page.enable");
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `
    window.__contactRequests = [];
    window.__contactMode = 'success';
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      if (String(input).startsWith('https://formspree.io/')) {
        if (input !== 'https://formspree.io/f/contactqa') throw new Error('Unexpected test endpoint');
        window.__contactRequests.push(Object.fromEntries(init.body.entries()));
        if (window.__contactMode === 'offline') return Promise.reject(new TypeError('Failed to fetch'));
        if (window.__contactMode === 'slow' || window.__contactMode === 'timeout') return new Promise((resolve, reject) => {
          window.__resolveContact = () => resolve(new Response('{}', {status: 200}));
          init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {once: true});
          if (window.__contactMode === 'timeout') setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 50);
        });
        const status = window.__contactMode === 'rate' ? 429 : window.__contactMode === 'error' ? 500 : 200;
        return Promise.resolve(new Response('{}', {status}));
      }
      return originalFetch.apply(this, arguments);
    };
  `,
  });
  await call("Page.navigate", {
    url: "http://127.0.0.1:4175/?modelo=brasa#contato",
  });
  async function waitFor(expression) {
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch {}
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  }
  await waitFor(
    '!!document.querySelector(".contact-form") && !document.querySelector(".intro-overlay")',
  );
  const setValue = async (selector, value) => {
    await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      const prototype = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', {bubbles:true}));
    })()`);
    await delay(40);
  };
  const click = async (selector) => {
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).click()`,
    );
    await delay(40);
  };
  const get = (selector) =>
    evaluate(`document.querySelector(${JSON.stringify(selector)}).value`);
  const submit = () => click(".contact-submit");
  async function validForm() {
    await setValue("#nome", "  Pessoa de Teste  ");
    await setValue("#email", "teste@example.com");
    await setValue("#descricao", "Quero um site para apresentar meu negócio.");
    if (!(await evaluate('document.querySelector("#aceite").checked')))
      await click("#aceite");
  }
  check((await get("#tipo")) === "brasa", "URL model populates the form");
  check(
    await evaluate(
      'document.querySelector(".contact-model-note").textContent.includes("Brasa")',
    ),
    "selected model has visible feedback",
  );
  await submit();
  check(
    await evaluate('document.activeElement.id === "nome"'),
    "empty submit focuses first invalid field",
  );
  check(
    await evaluate(
      'document.querySelectorAll("[aria-invalid=true]").length === 4',
    ),
    "all missing required fields have inline errors",
  );
  check(
    await evaluate("window.__contactRequests.length === 0"),
    "invalid forms are never sent",
  );
  await setValue("#nome", "   ");
  await setValue("#email", "nao-e-email");
  await setValue("#descricao", "          ");
  await submit();
  check(
    await evaluate(
      'document.querySelector("#nome").getAttribute("aria-invalid") === "true" && document.querySelector("#descricao").getAttribute("aria-invalid") === "true"',
    ),
    "whitespace does not satisfy required content",
  );

  // Real keyboard events check the key filter, and insertText checks the input /
  // paste path independently, including mobile keyboards that skip keydown.
  await evaluate('document.querySelector("#whatsapp").focus()');
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "a",
    text: "a",
    code: "KeyA",
    windowsVirtualKeyCode: 65,
  });
  check((await get("#whatsapp")) === "", "letter keystrokes are blocked");
  await call("Input.insertText", { text: "abc11def987654321" });
  await delay(50);
  check(
    (await get("#whatsapp")) === "(11) 98765-4321",
    "pasted text keeps only phone digits",
  );
  await evaluate('document.querySelector("#whatsapp").select()');
  await call("Input.insertText", { text: "+55 (21) 99876-5432" });
  await delay(50);
  check(
    (await get("#whatsapp")) === "(21) 99876-5432",
    "country prefix is normalized when pasting",
  );
  await setValue("#whatsapp", "(55) 99999-9999");
  await evaluate(
    'document.querySelector("#whatsapp").focus(); document.querySelector("#whatsapp").setSelectionRange(15,15)',
  );
  await call("Input.insertText", { text: "9" });
  await delay(50);
  check(
    (await get("#whatsapp")) === "(55) 99999-9999",
    "an extra digit preserves Brazilian area code 55",
  );
  await setValue("#whatsapp", "1134567890");
  check(
    (await get("#whatsapp")) === "(11) 3456-7890",
    "landlines use the shorter mask",
  );
  await evaluate(
    'document.querySelector("#whatsapp").focus(); document.querySelector("#whatsapp").setSelectionRange(10,10)',
  );
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
  await delay(50);
  check(
    (await get("#whatsapp")) === "(11) 3457-890",
    "backspace at the mask separator removes the adjacent digit",
  );
  check(
    await evaluate('document.querySelector("#whatsapp").selectionStart === 8'),
    "mask edit preserves the caret",
  );
  await setValue("#whatsapp", "11");
  await validForm();
  await submit();
  check(
    await evaluate(
      'document.activeElement.id === "whatsapp" && document.querySelector("#whatsapp").getAttribute("aria-invalid") === "true"',
    ),
    "incomplete optional phone blocks submission",
  );
  await setValue("#whatsapp", "");
  check(
    await evaluate('document.querySelector(".contact-form").checkValidity()'),
    "optional fields can all be left blank",
  );
  check(
    await evaluate(
      'document.querySelector("[role=progressbar]").getAttribute("aria-valuenow") === "4"',
    ),
    "progress follows required fields only",
  );

  await mkdir(new URL("../.qa/", import.meta.url), { recursive: true });
  async function capture(name) {
    await evaluate(
      'document.querySelectorAll("[data-reveal]").forEach(el=>el.classList.add("is-visible")); document.querySelector("#contato").scrollIntoView({behavior:"instant",block:"start"})',
    );
    await delay(100);
    const clip = await evaluate(
      '(()=>{ const r=document.querySelector("#contato").getBoundingClientRect(); return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}; })()',
    );
    const { data } = await call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip,
    });
    await writeFile(
      new URL(`../.qa/contact-${name}.png`, import.meta.url),
      Buffer.from(data, "base64"),
    );
  }
  await evaluate('document.documentElement.dataset.theme="light"');
  check(
    await evaluate(
      'getComputedStyle(document.querySelector(".contact-input-wrap input")).color === "rgb(20, 20, 20)"',
    ),
    "fields follow the light theme",
  );
  await capture("desktop");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await delay(80);
    check(
      await evaluate("document.documentElement.scrollWidth <= innerWidth"),
      `no horizontal overflow at ${width}px`,
    );
    check(
      await evaluate(
        '(()=>{const form=document.querySelector(".contact-form").getBoundingClientRect();return [...document.querySelectorAll(".contact-field input,.contact-field select,.contact-field textarea")].every(el=>{const r=el.getBoundingClientRect();return r.left>=form.left && r.right<=form.right;});})()',
      ),
      `fields fit the card at ${width}px`,
    );
    if (width === 390) {
      check(
        await evaluate(
          '[...document.querySelectorAll(".contact-field input,.contact-field select,.contact-field textarea")].every(el=>parseFloat(getComputedStyle(el).fontSize)>=16)',
        ),
        "mobile inputs avoid focus zoom",
      );
      await capture("mobile");
      await evaluate('document.documentElement.dataset.theme="dark"');
      await capture("mobile-dark");
      await evaluate('document.documentElement.dataset.theme="light"');
    }
  }
  await evaluate('document.documentElement.dataset.theme="dark"');
  await capture("dark");
  check(
    await evaluate(
      'getComputedStyle(document.querySelector(".contact-input-wrap input")).color !== "rgb(20, 20, 20)"',
    ),
    "fields follow the dark theme",
  );
  await evaluate('document.documentElement.dataset.theme="light"');
  check(
    await evaluate(
      'getComputedStyle(document.querySelector(".contact-progress-track > span")).transitionDuration === "0s"',
    ),
    "reduced motion disables progress animation",
  );
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  check(
    await evaluate(
      'getComputedStyle(document.querySelector(".contact-progress-track > span")).transitionDuration !== "0s"',
    ),
    "progress animates when motion is allowed",
  );
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  if (unconfigured) {
    await submit();
    check(
      await evaluate(
        '!!document.querySelector(".status-preview") && document.querySelector("#nome").value.includes("Pessoa")',
      ),
      "unconfigured submission explains availability and preserves data",
    );
    check(
      await evaluate("window.__contactRequests.length === 0"),
      "unconfigured form makes no network request",
    );
  } else {
    await setValue("#whatsapp", "11987654321");
    await setValue("#prazo", "De 1 a 3 meses");
    await setValue("#investimento", "Ainda não defini");
    await evaluate('window.__contactMode="slow"');
    await submit();
    check(
      await evaluate(
        'document.querySelector(".contact-submit").disabled && document.querySelector(".contact-form").getAttribute("aria-busy")==="true" && document.querySelector("#nome").matches(":disabled")',
      ),
      "sending locks inputs and announces busy state",
    );
    await evaluate(
      'document.querySelector(".contact-form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))',
    );
    check(
      await evaluate("window.__contactRequests.length === 1"),
      "duplicate submissions are blocked",
    );
    const payload = await evaluate("window.__contactRequests[0]");
    check(
      payload.nome === "Pessoa de Teste" &&
        payload.whatsapp === "11987654321" &&
        payload.prazo === "De 1 a 3 meses" &&
        payload.investimento === "Ainda não defini" &&
        payload.modelo === "Brasa",
      "payload carries normalized contact details, model and planning",
    );
    await evaluate("window.__resolveContact()");
    await waitFor('!!document.querySelector(".status-success")');
    check(
      (await get("#nome")) === "" &&
        (await get("#whatsapp")) === "" &&
        (await get("#prazo")) === "" &&
        (await get("#investimento")) === "",
      "successful send resets the form",
    );
    check(
      await evaluate(
        'document.activeElement.classList.contains("status-success")',
      ),
      "success is focused for keyboard and screen readers",
    );
    for (const mode of ["error", "rate", "offline", "timeout"]) {
      await validForm();
      await evaluate(`window.__contactMode=${JSON.stringify(mode)}`);
      await submit();
      await waitFor(
        '!!document.querySelector(".status-error") && !document.querySelector(".contact-submit").disabled',
      );
      check(
        (await get("#email")) === "teste@example.com" &&
          (await get("#descricao")) !== "",
        `${mode} preserves entered data and allows retry`,
      );
      if (mode === "rate")
        check(
          await evaluate(
            'document.querySelector(".status-error").textContent.includes("muitos envios")',
          ),
          "rate limiting has a specific recovery message",
        );
      if (mode === "timeout")
        check(
          await evaluate(
            'document.querySelector(".status-error").textContent.includes("demorou")',
          ),
          "timeout has a specific recovery message",
        );
    }
    await evaluate('window.__contactMode="success"');
    await submit();
    await waitFor('!!document.querySelector(".status-success")');
    check(
      await evaluate(
        '(()=>{const p=window.__contactRequests.at(-1);return p.whatsapp===""&&p.prazo==="Não informado"&&p.investimento==="Não informado";})()',
      ),
      "optional planning and phone are omitted safely",
    );
    await validForm();
    await setValue("#bot-field", "bot");
    const before = await evaluate("window.__contactRequests.length");
    await submit();
    check(
      (await evaluate("window.__contactRequests.length")) === before,
      "honeypot blocks bot submissions",
    );
  }
  check(
    exceptions.length === 0,
    `no browser exceptions: ${exceptions.join(", ")}`,
  );
  console.log(
    `Contact: ${checks} checks passed (${unconfigured ? "unconfigured" : "mocked delivery"}). Screenshots saved in .qa/.`,
  );
} finally {
  await browser?.close();
  await server.close();
}
