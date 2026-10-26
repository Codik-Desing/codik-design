// Browser verification and real catalog screenshots using the installed Chrome.
// No extra runtime or automation dependencies are required.
import { spawn } from "node:child_process";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { demoModels } from "../src/demo-models.js";
import { servePreview } from "./serve-preview.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const base = "http://127.0.0.1:4173";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9338;
const server = await servePreview();
const browser = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--ignore-certificate-errors",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.join(os.tmpdir(), `codik-review-${Date.now()}`)}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let browserError;
browser.on("error", (error) => {
  browserError = error;
});
let socket;
let id = 0;
const pending = new Map();
const errors = [];
const failures = [];
let current = "";
function assert(value, message) {
  if (!value) {
    failures.push(`${current}: ${message}`);
    console.error(`FAIL ${current}: ${message}`);
  }
}
try {
  let version;
  for (let i = 0; i < 100; i++) {
    if (browserError) throw browserError;
    try {
      version = await (
        await fetch(`http://127.0.0.1:${port}/json/list`)
      ).json();
      if (version.length) break;
    } catch {}
    await delay(100);
  }
  if (!version?.length)
    throw new Error("Chrome debugging endpoint unavailable");
  socket = new WebSocket(
    version.find((v) => v.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", ({ data }) => {
    const packet = JSON.parse(data);
    if (packet.id) {
      const p = pending.get(packet.id);
      if (p) {
        clearTimeout(p.timer);
        pending.delete(packet.id);
        packet.error
          ? p.reject(new Error(JSON.stringify(packet.error)))
          : p.resolve(packet.result);
      }
    } else if (packet.method === "Runtime.exceptionThrown")
      errors.push(
        `${current}: ${packet.params.exceptionDetails.exception?.description || packet.params.exceptionDetails.text}`,
      );
    else if (
      packet.method === "Network.responseReceived" &&
      packet.params.response.status >= 400 &&
      packet.params.response.url.startsWith(base)
    )
      errors.push(
        `${current}: HTTP ${packet.params.response.status} ${packet.params.response.url}`,
      );
  });
  function call(method, params = {}) {
    const next = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(next);
        reject(new Error(`Timeout: ${method}`));
      }, 30000);
      pending.set(next, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: next, method, params }));
    });
  }
  const evaluate = async (expression) => {
    const r = await call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description || r.exceptionDetails.text,
      );
    return r.result.value;
  };
  const click = (selector) =>
    evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const value = (selector, next) =>
    evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(next)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`,
    );
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Network.enable");
  async function viewport(width, height = 1000) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
  }
  async function visit(url, label) {
    current = label;
    url = new URL(url).href;
    await call("Page.navigate", { url });
    for (let i = 0; i < 100; i++) {
      try {
        if (
          await evaluate(
            `location.href === ${JSON.stringify(url)} && document.readyState === "complete"`,
          )
        )
          break;
      } catch {}
      await delay(80);
    }
    await evaluate(
      "Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))])",
    );
    await delay(150);
  }
  async function screenshot(name, full = false) {
    if (process.argv.includes("--no-captures")) return;
    await evaluate(
      'document.documentElement.setAttribute("data-capture","");document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-visible"));document.querySelectorAll("main>section,main>div").forEach(e=>e.classList.add("demo-seen"));document.querySelectorAll(".demo-dock").forEach(e=>e.style.display="none");document.images && Promise.allSettled([...document.images].map(i=>{i.loading="eager";return i.decode()}))',
    );
    await delay(100);
    const { contentSize } = await call("Page.getLayoutMetrics");
    const { data } = await call("Page.captureScreenshot", {
      format: "jpeg",
      quality: 80,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: full ? Math.min(contentSize.height, 3800) : 1000,
        scale: 1,
      },
    });
    await writeFile(
      path.join(root, "public/demos/previews", `${name}.jpg`),
      Buffer.from(data, "base64"),
    );
    await copyFile(
      path.join(root, "public/demos/previews", `${name}.jpg`),
      path.join(root, "dist/demos/previews", `${name}.jpg`),
    );
  }
  await mkdir(path.join(root, "public/demos/previews"), { recursive: true });
  await mkdir(path.join(root, "dist/demos/previews"), { recursive: true });
  await mkdir(path.join(root, ".qa"), { recursive: true });
  const all = process.argv.includes("--home-only")
    ? []
    : [
        "brasa",
        "corte",
        "morada",
        "forma",
        "flora",
        "pixel",
        ...demoModels.map((m) => m.slug),
      ];
  for (const slug of all) {
    await viewport(1440);
    await visit(`${base}/demos/${slug}.html`, slug);
    await evaluate(
      'Promise.allSettled([...document.images].map(i=>{i.loading="eager";return i.decode()}))',
    );
    const stats = await evaluate(
      '({h1:document.querySelectorAll("h1").length,images:[...document.images].filter(i=>i.naturalWidth===0).map(i=>i.src),overflow:document.documentElement.scrollWidth>innerWidth+2})',
    );
    assert(stats.h1 === 1, "expected one h1");
    assert(!stats.images.length, `broken images: ${stats.images.join(", ")}`);
    assert(!stats.overflow, "desktop horizontal overflow");
    await screenshot(slug, true);
    if (demoModels.some((m) => m.slug === slug)) {
      if (await evaluate('!!document.querySelector("[data-filter]")')) {
        await click("[data-filter]:nth-child(2)");
        assert(
          await evaluate(
            '[...document.querySelectorAll("[data-category]:not([hidden])")].every(c=>c.dataset.category===document.querySelector("[data-filter][aria-pressed=true]").dataset.filter)',
          ),
          "category filtering",
        );
        await click('[data-filter="Todos"]');
      }
      if (await evaluate('!!document.querySelector("[data-detail]")')) {
        await click("[data-detail]");
        assert(
          await evaluate('document.querySelector(".detail-dialog").open'),
          "details open",
        );
        await click(".detail-dialog [data-close]");
      }
      if (["objeto", "cacau"].includes(slug)) {
        await click('[data-add="0"]');
        await click('[data-add="0"]');
        await click("[data-cart-open]");
        assert(
          await evaluate(
            'document.querySelector("[data-cart-count]").textContent==="2"',
          ),
          "cart count",
        );
        await click('[data-quantity][data-delta="-1"]');
        assert(
          await evaluate(
            'document.querySelector("[data-cart-count]").textContent==="1"',
          ),
          "decrease quantity",
        );
        await click("[data-cart-checkout]");
        assert(
          await evaluate(
            'document.querySelector("[data-cart-feedback]").textContent.includes("simulação")',
          ),
          "checkout simulation disclosure",
        );
        await click(".cart-dialog [data-close]");
      }
      if (slug === "alba") {
        await click('[data-coffee="1"]');
        assert(
          await evaluate(
            'document.querySelector("[data-coffee-name]").textContent==="Coado do dia"',
          ),
          "coffee selection",
        );
      }
      if (["lume", "vertice"].includes(slug)) {
        await click('[data-material="#9c6951"]');
        assert(
          await evaluate(
            'document.querySelector(".object-room").style.getPropertyValue("--material")==="#9c6951"',
          ),
          "material change",
        );
      }
      if (["pulse", "serena", "orbit"].includes(slug)) {
        await click('[data-billing="yearly"]');
        assert(
          await evaluate(
            'document.querySelector("[data-billing-note]").textContent.includes("por ano")',
          ),
          "annual pricing",
        );
      }
      if (slug === "pulse") {
        await click('[data-day="1"]');
        assert(
          await evaluate(
            'document.querySelector("[data-schedule] h3").textContent==="Condition"',
          ),
          "class day selection",
        );
      }
      if (slug === "serena") {
        await click("[data-breath-toggle]");
        assert(
          await evaluate(
            'document.querySelector(".object-breath").classList.contains("breathing")',
          ),
          "breathing start",
        );
        await click("[data-breath-toggle]");
      }
      if (slug === "orbit") {
        await click('[data-view="list"]');
        assert(
          await evaluate(
            'document.querySelector("[data-board]").classList.contains("list-view")',
          ),
          "dashboard list",
        );
      }
      if (slug === "nexus") {
        await click('[data-solution="1"]');
        assert(
          await evaluate(
            'document.querySelector("[data-solution-name]").textContent==="Sistemas conectados"',
          ),
          "solution selector",
        );
      }
      if (!["objeto", "cacau"].includes(slug)) {
        if (slug === "orbit") await click("[data-booking]");
        else await click("[data-primary]");
        assert(
          await evaluate('document.querySelector(".booking-dialog").open'),
          "booking dialog opens",
        );
        await value("#visitor-name", "Pessoa de teste");
        if (["orbit", "nexus"].includes(slug))
          await value(
            "#visitor-description",
            "Projeto demonstrativo para testar a experiência.",
          );
        await evaluate(
          'document.querySelector("[data-booking-form]").requestSubmit()',
        );
        assert(
          await evaluate('!document.querySelector(".booking-result").hidden'),
          "booking simulation completes",
        );
        await click(".booking-dialog [data-close]");
      }
    }
    await viewport(390, 844);
    await delay(100);
    assert(
      await evaluate("document.documentElement.scrollWidth <= innerWidth + 2"),
      "mobile horizontal overflow",
    );
    if (demoModels.some((m) => m.slug === slug)) {
      await click(".menu-toggle");
      assert(
        await evaluate(
          'document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="true"',
        ),
        "mobile menu",
      );
      await click("#demo-nav a");
    }
    if (demoModels.some((m) => m.slug === slug)) {
      await evaluate('window.scrollTo({top:0,behavior:"instant"})');
      await delay(50);
      const mobile = await call("Page.captureScreenshot", { format: "png" });
      await writeFile(
        path.join(root, ".qa", `${slug}-mobile.png`),
        Buffer.from(mobile.data, "base64"),
      );
      for (const width of [320, 768]) {
        await viewport(width, 900);
        assert(
          await evaluate(
            "document.documentElement.scrollWidth <= innerWidth + 2",
          ),
          `horizontal overflow at ${width}px`,
        );
      }
    }
    console.log(`Reviewed ${slug}: desktop + mobile + interactions`);
  }
  await viewport(1440);
  await visit(base, "redesign-home");
  assert(
    await evaluate('document.querySelectorAll("h1").length === 1'),
    "one primary heading",
  );
  assert(
    await evaluate('!!document.querySelector(".intro-overlay")'),
    "introduction on initial page load",
  );
  assert(
    await evaluate(
      'document.querySelector(".site-content").inert && document.body.style.overflow === "hidden"',
    ),
    "introduction isolates focus and scroll",
  );
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await delay(150);
  assert(
    await evaluate(
      '!document.querySelector(".intro-overlay") && document.body.style.overflow !== "hidden"',
    ),
    "Escape skips introduction",
  );
  await click(".replay-button");
  await delay(500);
  const introShot = await call("Page.captureScreenshot", { format: "png" });
  await writeFile(
    path.join(root, ".qa/redesign-intro.png"),
    Buffer.from(introShot.data, "base64"),
  );
  await delay(3500);
  assert(
    await evaluate(
      '!document.querySelector(".intro-overlay") && document.querySelector(".redesign-app").classList.contains("hero-ready")',
    ),
    "complete introduction and reveal",
  );
  await evaluate('sessionStorage.setItem("codik-intro-seen","1")');
  await call("Page.reload", { ignoreCache: true });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if (await evaluate('!!document.querySelector(".intro-overlay")')) break;
    } catch {
      /* Navigation may replace the execution context. */
    }
    await delay(80);
  }
  assert(
    await evaluate('!!document.querySelector(".intro-overlay")'),
    "introduction replays on reload despite a previous visit",
  );
  await click(".intro-skip");
  await delay(150);
  await evaluate('history.replaceState(null,"","#modelos")');
  await call("Page.reload", { ignoreCache: true });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if (await evaluate('!!document.querySelector(".intro-overlay")')) break;
    } catch {
      /* Navigation may replace the execution context. */
    }
    await delay(80);
  }
  assert(
    await evaluate('!!document.querySelector(".intro-overlay")'),
    "introduction replays on reload with an anchor",
  );
  await click(".intro-skip");
  await delay(150);
  assert(
    await evaluate(
      'Math.abs(document.querySelector("#modelos").getBoundingClientRect().top - 24) < 3',
    ),
    "anchor destination is preserved after the introduction",
  );
  await evaluate(
    'history.replaceState(null,"",location.pathname);window.scrollTo({top:0,behavior:"instant"})',
  );
  await evaluate('document.documentElement.dataset.theme="light"');
  const lightShot = await call("Page.captureScreenshot", { format: "png" });
  await writeFile(
    path.join(root, ".qa/redesign-hero-light.png"),
    Buffer.from(lightShot.data, "base64"),
  );
  await click(".theme-toggle");
  await delay(100);
  // The button follows its own state, so verify a second click also toggles it.
  const clickedTheme = await evaluate("document.documentElement.dataset.theme");
  await click(".theme-toggle");
  await delay(100);
  assert(
    await evaluate(
      `document.documentElement.dataset.theme !== ${JSON.stringify(clickedTheme)}`,
    ),
    "theme toggle",
  );
  await evaluate('document.documentElement.dataset.theme="dark"');
  const darkShot = await call("Page.captureScreenshot", { format: "png" });
  await writeFile(
    path.join(root, ".qa/redesign-hero-dark.png"),
    Buffer.from(darkShot.data, "base64"),
  );
  await evaluate('document.documentElement.dataset.theme="light"');
  const fine = await evaluate(
    'matchMedia("(hover:hover) and (pointer:fine)").matches',
  );
  if (fine) {
    const position = await evaluate(
      '(()=>{const r=document.querySelector("[data-weight-letter]").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()',
    );
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", ...position });
    await delay(450);
    assert(
      await evaluate(
        'Number(getComputedStyle(document.querySelector("[data-weight-letter]")).fontWeight)>400',
      ),
      "title responds to pointer",
    );
    assert(
      await evaluate('getComputedStyle(document.body).cursor==="none"'),
      "custom fine pointer",
    );
  }
  assert(
    await evaluate('document.querySelectorAll(".work-entry").length===18'),
    "18 real demo links",
  );
  await click(".work-filters button:nth-child(2)");
  await delay(80);
  assert(
    await evaluate('document.querySelectorAll(".work-entry").length===3'),
    "segment filtering",
  );
  await click(".work-filters button:first-child");
  await delay(80);
  await evaluate(
    `(()=>{const input=document.querySelector('.work-search-bar input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'aurea');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await delay(100);
  assert(
    await evaluate('document.querySelectorAll(".work-entry").length===1'),
    "accent-insensitive search",
  );
  await click('[aria-label="Limpar busca"]');
  await delay(100);
  await evaluate(
    'document.querySelector("#modelos").scrollIntoView({behavior:"instant"});document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-visible"))',
  );
  await delay(250);
  if (fine) {
    const position = await evaluate(
      '(()=>{const r=document.querySelector(".work-row").getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()',
    );
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", ...position });
    await delay(250);
    assert(
      await evaluate(
        'document.querySelector(".work-hover-preview").classList.contains("is-on") && document.querySelector(".work-hover-preview img").src.includes("brasa.jpg")',
      ),
      "floating preview uses real screenshot",
    );
    const hoverShot = await call("Page.captureScreenshot", { format: "png" });
    await writeFile(
      path.join(root, ".qa/redesign-work-hover.png"),
      Buffer.from(hoverShot.data, "base64"),
    );
    await call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 4, y: 4 });
  }
  await click(".work-preview-button");
  await delay(300);
  assert(
    await evaluate('document.querySelector(".site-preview-dialog").open'),
    "interactive preview dialog",
  );
  await click(".device-switch button:last-child");
  await delay(100);
  assert(
    await evaluate(
      'document.querySelector(".preview-live-frame iframe").style.width==="390px"',
    ),
    "mobile preview mode",
  );
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await delay(100);
  assert(
    await evaluate(
      '!document.querySelector(".site-preview-dialog") && document.activeElement.classList.contains("work-preview-button")',
    ),
    "preview restores focus",
  );
  await click(".work-choose");
  await delay(100);
  assert(
    await evaluate('document.getElementById("tipo").value==="brasa"'),
    "model selection reaches existing contact form",
  );
  assert(
    await evaluate(
      'document.querySelector(".contact-direct-link").href==="mailto:codikdev@gmail.com"',
    ),
    "real contact retained",
  );
  assert(
    await evaluate('!document.querySelector(".contact-form").checkValidity()'),
    "contact form validates required fields",
  );
  await evaluate('document.querySelector(".type-tab").focus()');
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowRight",
    code: "ArrowRight",
    windowsVirtualKeyCode: 39,
  });
  assert(
    await evaluate(
      'document.querySelector("[role=tab][aria-selected=true]").id==="type-tab-landing"',
    ),
    "keyboard navigation of site types",
  );
  const anchors = await evaluate(
    '[...document.querySelectorAll("a[href^=\\"#\\"]")].map(a=>a.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))',
  );
  assert(!anchors.length, `missing anchor targets: ${anchors.join(",")}`);
  await evaluate(
    'document.querySelector("#sobre").scrollIntoView({behavior:"instant"})',
  );
  await delay(100);
  const teamShot = await call("Page.captureScreenshot", { format: "png" });
  await writeFile(
    path.join(root, ".qa/redesign-studio.png"),
    Buffer.from(teamShot.data, "base64"),
  );
  for (const width of [375, 768, 1440]) {
    await viewport(width, width === 375 ? 812 : 1000);
    await call("Emulation.setTouchEmulationEnabled", {
      enabled: width === 375,
    });
    await delay(100);
    await evaluate('window.scrollTo({top:0,behavior:"instant"})');
    await delay(150);
    assert(
      await evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
      `layout fits ${width}px`,
    );
    if (width === 375) {
      assert(
        await evaluate(
          'getComputedStyle(document.querySelector(".work-hover-preview")).display==="none"',
        ),
        "no floating preview on touch",
      );
      assert(
        await evaluate(
          'getComputedStyle(document.querySelector(".custom-cursor")).display==="none"',
        ),
        "no custom cursor on touch",
      );
      assert(
        await evaluate(
          'Number(getComputedStyle(document.querySelector("[data-weight-letter]")).fontWeight)===800',
        ),
        "fixed title weight on touch",
      );
    }
    let shot = await call("Page.captureScreenshot", { format: "png" });
    await writeFile(
      path.join(root, ".qa", `redesign-${width}.png`),
      Buffer.from(shot.data, "base64"),
    );
    await evaluate(
      'document.querySelector("#modelos").scrollIntoView({behavior:"instant"})',
    );
    await delay(150);
    shot = await call("Page.captureScreenshot", { format: "png" });
    await writeFile(
      path.join(root, ".qa", `redesign-works-${width}.png`),
      Buffer.from(shot.data, "base64"),
    );
  }
  await call("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-color-scheme", value: "dark" },
    ],
  });
  await evaluate(
    'sessionStorage.removeItem("codik-intro-seen");localStorage.removeItem("codik-theme")',
  );
  await visit(base, "redesign-reduced-motion");
  assert(
    await evaluate(
      '!document.querySelector(".intro-overlay") && document.querySelector(".replay-button").disabled',
    ),
    "reduced motion skips introduction and replay",
  );
  assert(
    await evaluate(
      'getComputedStyle(document.querySelector(".editorial-marquee>div")).animationName==="none"',
    ),
    "reduced motion stops marquee",
  );
  assert(
    await evaluate('document.documentElement.dataset.theme==="dark"'),
    "system color scheme respected",
  );
  const storageBlock = await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Blocked','SecurityError')}});Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}});`,
  });
  await visit(base, "redesign-storage-unavailable");
  assert(
    await evaluate(
      'document.querySelectorAll(".work-entry").length===18 && !!document.querySelector(".contact-form")',
    ),
    "site works without browser storage",
  );
  await call("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: storageBlock.identifier,
  });
  const report = {
    pages: all.length + 1,
    demos: all.length,
    screenshots: process.argv.includes("--no-captures") ? 0 : all.length,
    widths: [375, 768, 1440],
    redesign: true,
    errors,
    failures,
  };
  await writeFile(
    path.join(root, ".qa/report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || failures.length) process.exitCode = 1;
} finally {
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  server.close();
}
