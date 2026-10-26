// Browser verification and real catalog screenshots using the installed Chrome.
// No extra runtime or automation dependencies are required.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { demoModels } from '../src/demo-models.js';
import { servePreview } from './serve-preview.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:4173';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9338;
const server = await servePreview();
const browser = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--ignore-certificate-errors', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(os.tmpdir(), `codik-review-${Date.now()}`)}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let browserError;
browser.on('error', (error) => { browserError = error; });
let socket;
let id = 0;
const pending = new Map();
const errors = [];
const failures = [];
let current = '';
function assert(value, message) { if (!value) { failures.push(`${current}: ${message}`); console.error(`FAIL ${current}: ${message}`); } }
try {
  let version;
  for (let i = 0; i < 100; i++) {
    if (browserError) throw browserError;
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (version.length) break; } catch {}
    await delay(100);
  }
  if (!version?.length) throw new Error('Chrome debugging endpoint unavailable');
  socket = new WebSocket(version.find((v) => v.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const packet = JSON.parse(data);
    if (packet.id) { const p = pending.get(packet.id); if (p) { clearTimeout(p.timer); pending.delete(packet.id); packet.error ? p.reject(new Error(JSON.stringify(packet.error))) : p.resolve(packet.result); } }
    else if (packet.method === 'Runtime.exceptionThrown') errors.push(`${current}: ${packet.params.exceptionDetails.exception?.description || packet.params.exceptionDetails.text}`);
    else if (packet.method === 'Network.responseReceived' && packet.params.response.status >= 400 && packet.params.response.url.startsWith(base)) errors.push(`${current}: HTTP ${packet.params.response.status} ${packet.params.response.url}`);
  });
  function call(method, params = {}) { const next = ++id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(next); reject(new Error(`Timeout: ${method}`)); }, 30000); pending.set(next, { resolve, reject, timer }); socket.send(JSON.stringify({ id: next, method, params })); }); }
  const evaluate = async (expression) => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const value = (selector, next) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(next)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  async function viewport(width, height = 1000) { await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); }
  async function visit(url, label) {
    current = label;
    await call('Page.navigate', { url });
    for (let i = 0; i < 100; i++) { try { if (await evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === "complete"`)) break; } catch {} await delay(80); }
    await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))])');
    await delay(150);
  }
  async function screenshot(name, full = false) {
    await evaluate('document.documentElement.setAttribute("data-capture","");document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-visible"));document.querySelectorAll("main>section,main>div").forEach(e=>e.classList.add("demo-seen"));document.querySelectorAll(".demo-dock").forEach(e=>e.style.display="none");document.images && Promise.allSettled([...document.images].map(i=>{i.loading="eager";return i.decode()}))');
    await delay(100);
    const { contentSize } = await call('Page.getLayoutMetrics');
    const { data } = await call('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: full ? Math.min(contentSize.height, 3800) : 1000, scale: 1 } });
    await writeFile(path.join(root, 'public/demos/previews', `${name}.jpg`), Buffer.from(data, 'base64'));
    await copyFile(path.join(root, 'public/demos/previews', `${name}.jpg`), path.join(root, 'dist/demos/previews', `${name}.jpg`));
  }
  await mkdir(path.join(root, 'public/demos/previews'), { recursive: true });
  await mkdir(path.join(root, 'dist/demos/previews'), { recursive: true });
  await mkdir(path.join(root, '.qa'), { recursive: true });
  const all = ['brasa', 'corte', 'morada', 'forma', 'flora', 'pixel', ...demoModels.map((m) => m.slug)];
  for (const slug of all) {
    await viewport(1440);
    await visit(`${base}/demos/${slug}.html`, slug);
    await evaluate('Promise.allSettled([...document.images].map(i=>{i.loading="eager";return i.decode()}))');
    const stats = await evaluate('({h1:document.querySelectorAll("h1").length,images:[...document.images].filter(i=>i.naturalWidth===0).map(i=>i.src),overflow:document.documentElement.scrollWidth>innerWidth+2})');
    assert(stats.h1 === 1, 'expected one h1'); assert(!stats.images.length, `broken images: ${stats.images.join(', ')}`); assert(!stats.overflow, 'desktop horizontal overflow');
    await screenshot(slug, true);
    if (demoModels.some((m) => m.slug === slug)) {
      if (await evaluate('!!document.querySelector("[data-filter]")')) {
        await click('[data-filter]:nth-child(2)');
        assert(await evaluate('[...document.querySelectorAll("[data-category]:not([hidden])")].every(c=>c.dataset.category===document.querySelector("[data-filter][aria-pressed=true]").dataset.filter)'), 'category filtering');
        await click('[data-filter="Todos"]');
      }
      if (await evaluate('!!document.querySelector("[data-detail]")')) { await click('[data-detail]'); assert(await evaluate('document.querySelector(".detail-dialog").open'), 'details open'); await click('.detail-dialog [data-close]'); }
      if (['objeto', 'cacau'].includes(slug)) {
        await click('[data-add="0"]'); await click('[data-add="0"]'); await click('[data-cart-open]');
        assert(await evaluate('document.querySelector("[data-cart-count]").textContent==="2"'), 'cart count');
        await click('[data-quantity][data-delta="-1"]');
        assert(await evaluate('document.querySelector("[data-cart-count]").textContent==="1"'), 'decrease quantity');
        await click('[data-cart-checkout]'); assert(await evaluate('document.querySelector("[data-cart-feedback]").textContent.includes("simulação")'), 'checkout simulation disclosure'); await click('.cart-dialog [data-close]');
      }
      if (slug === 'alba') { await click('[data-coffee="1"]'); assert(await evaluate('document.querySelector("[data-coffee-name]").textContent==="Coado do dia"'), 'coffee selection'); }
      if (['lume', 'vertice'].includes(slug)) { await click('[data-material="#9c6951"]'); assert(await evaluate('document.querySelector(".object-room").style.getPropertyValue("--material")==="#9c6951"'), 'material change'); }
      if (['pulse', 'serena', 'orbit'].includes(slug)) { await click('[data-billing="yearly"]'); assert(await evaluate('document.querySelector("[data-billing-note]").textContent.includes("por ano")'), 'annual pricing'); }
      if (slug === 'pulse') { await click('[data-day="1"]'); assert(await evaluate('document.querySelector("[data-schedule] h3").textContent==="Condition"'), 'class day selection'); }
      if (slug === 'serena') { await click('[data-breath-toggle]'); assert(await evaluate('document.querySelector(".object-breath").classList.contains("breathing")'), 'breathing start'); await click('[data-breath-toggle]'); }
      if (slug === 'orbit') { await click('[data-view="list"]'); assert(await evaluate('document.querySelector("[data-board]").classList.contains("list-view")'), 'dashboard list'); }
      if (slug === 'nexus') { await click('[data-solution="1"]'); assert(await evaluate('document.querySelector("[data-solution-name]").textContent==="Sistemas conectados"'), 'solution selector'); }
      if (!['objeto', 'cacau'].includes(slug)) {
        if (slug === 'orbit') await click('[data-booking]'); else await click('[data-primary]');
        assert(await evaluate('document.querySelector(".booking-dialog").open'), 'booking dialog opens');
        await value('#visitor-name', 'Pessoa de teste');
        if (['orbit', 'nexus'].includes(slug)) await value('#visitor-description', 'Projeto demonstrativo para testar a experiência.');
        await evaluate('document.querySelector("[data-booking-form]").requestSubmit()');
        assert(await evaluate('!document.querySelector(".booking-result").hidden'), 'booking simulation completes');
        await click('.booking-dialog [data-close]');
      }
    }
    await viewport(390, 844); await delay(100);
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), 'mobile horizontal overflow');
    if (demoModels.some((m) => m.slug === slug)) { await click('.menu-toggle'); assert(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="true"'), 'mobile menu'); await click('#demo-nav a'); }
    if (demoModels.some((m) => m.slug === slug)) {
      await evaluate('window.scrollTo({top:0,behavior:"instant"})'); await delay(50);
      const mobile = await call('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(root, '.qa', `${slug}-mobile.png`), Buffer.from(mobile.data, 'base64'));
      for (const width of [320, 768]) { await viewport(width, 900); assert(await evaluate('document.documentElement.scrollWidth <= innerWidth + 2'), `horizontal overflow at ${width}px`); }
    }
    console.log(`Reviewed ${slug}: desktop + mobile + interactions`);
  }
  await viewport(1440);
  await visit(base, 'home'); await delay(500);
  assert(await evaluate('document.querySelectorAll(".library-card").length === 18'), '18 models in gallery');
  await click('.library-segments button:nth-child(2)'); await delay(80);
  assert(await evaluate('document.querySelectorAll(".library-card").length === 3'), '3 gastronomy models');
  await click('.library-segments button:first-child'); await delay(80);
  await evaluate(`(() => { const input=document.querySelector('.library-search input'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,'aurea'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`); await delay(100);
  assert(await evaluate('document.querySelectorAll(".library-card").length === 1'), 'accent insensitive search');
  await click('.library-search button'); await delay(80);
  await click('.library-screenshot'); await delay(400);
  assert(await evaluate('document.querySelector(".site-preview-dialog").open'), 'gallery preview dialog');
  await click('[aria-label="Prévia no celular"]'); await delay(100);
  assert(await evaluate('document.querySelector(".preview-live-frame iframe").style.width==="390px"'), 'mobile preview mode');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await delay(100);
  assert(await evaluate('!document.querySelector(".site-preview-dialog") && document.activeElement.classList.contains("library-screenshot")'), 'Escape closes preview and restores focus');
  await click('.library-card-actions a:last-child'); await delay(100);
  assert(await evaluate('document.getElementById("tipo").value === "miso"'), 'model selection reaches contact form');
  await evaluate('window.scrollTo(0,document.querySelector("#modelos").offsetTop-110);document.querySelectorAll("[data-reveal]").forEach(e=>e.classList.add("is-visible"))'); await delay(700);
  const homeShot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(root, '.qa/catalog-desktop.png'), Buffer.from(homeShot.data, 'base64'));
  await viewport(390, 844); await delay(100);
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'gallery mobile horizontal overflow');
  await evaluate('document.querySelector("#modelos").scrollIntoView({behavior:"instant"})'); await delay(300);
  const mobileShot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(root, '.qa/catalog-mobile.png'), Buffer.from(mobileShot.data, 'base64'));
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await visit(`${base}/demos/orbit.html`, 'reduced-motion');
  assert(await evaluate('getComputedStyle(document.querySelector(".cube")).animationName === "none"'), 'reduced motion honored');
  const report = { pages: 19, demos: 18, newDemos: 12, screenshots: all.length, widths: [1440, 390], errors, failures };
  await writeFile(path.join(root, '.qa/report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || failures.length) process.exitCode = 1;
} finally {
  socket?.close();
  browser.kill();
  server.closeAllConnections(); server.close();
}
