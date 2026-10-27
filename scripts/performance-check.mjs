// Repeatable local lab measurements. These are not Lighthouse scores or field INP.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { chromeSession, delay } from "./chrome-session.mjs";
import { servePreview } from "./serve-preview.mjs";

const label = process.argv[2] || "current";
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error("Use a simple report label");
await mkdir(new URL("../.qa/", import.meta.url), { recursive: true });
const server = await servePreview(4174);
let chrome;
const report = {
  label,
  environment: {
    browser: "local Chrome headless",
    cpu: "native",
    network: "localhost; cache disabled; external fonts depend on network",
    widths: [1440, 375],
  },
  bundle: {},
  pages: [],
  errors: [],
};
try {
  for (const name of await readdir(
    new URL("../dist/assets/", import.meta.url),
  )) {
    const data = await readFile(
      new URL(`../dist/assets/${name}`, import.meta.url),
    );
    report.bundle[name] = {
      bytes: data.length,
      gzipBytes: gzipSync(data).length,
    };
  }
  chrome = await chromeSession();
  const { call, evaluate } = chrome;
  await call("Page.enable");
  await call("Network.enable");
  await call("Performance.enable");
  await call("Network.setCacheDisabled", { cacheDisabled: true });
  let current;
  chrome.onEvent((packet) => {
    if (packet.method === "Runtime.exceptionThrown")
      report.errors.push({
        page: current,
        error: packet.params.exceptionDetails.text,
      });
    if (packet.method === "Network.loadingFailed" && !packet.params.canceled)
      report.errors.push({ page: current, error: packet.params.errorText });
  });
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `
    window.__audit={lcp:0,cls:0,longTasks:[],letterRects:0};
    for (const [type,record] of [['largest-contentful-paint',e=>__audit.lcp=e.startTime],['layout-shift',e=>{if(!e.hadRecentInput)__audit.cls+=e.value}],['longtask',e=>__audit.longTasks.push(e.duration)]]) {
      try {new PerformanceObserver(list=>list.getEntries().forEach(record)).observe({type,buffered:true});} catch {}
    }
    const rect=Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect=function(){if(this.hasAttribute('data-weight-letter'))__audit.letterRects++;return rect.call(this)};
  `,
  });
  const metrics = async () =>
    Object.fromEntries(
      (await call("Performance.getMetrics")).metrics.map((m) => [
        m.name,
        m.value,
      ]),
    );
  for (const width of [1440, 375]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    for (const route of [
      "/",
      "/demos/pixel.html",
      "/demos/brasa.html",
      "/demos/miso.html",
    ]) {
      current = `${route}@${width}`;
      const url = `http://127.0.0.1:4174${route}`;
      await call("Page.navigate", { url });
      for (let i = 0; i < 120; i++) {
        try {
          if (
            await evaluate(
              `location.href===${JSON.stringify(url)}&&document.readyState==='complete'`,
            )
          )
            break;
        } catch {}
        await delay(100);
      }
      await delay(4300);
      const load = await evaluate(
        `(()=>{const n=performance.getEntriesByType('navigation')[0];return {...__audit,fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,ttfbMs:n.responseStart,resources:performance.getEntriesByType('resource').map(r=>({name:r.name.replace(location.origin,''),bytes:r.transferSize,durationMs:r.duration})),letters:document.querySelectorAll('[data-weight-letter]').length,overflow:document.documentElement.scrollWidth>innerWidth+1}})()`,
      );
      const before = await metrics();
      await evaluate(`__audit.letterRects=0;__audit.longTasks=[]`);
      if (route === "/") {
        // Identical 120-frame scroll sequence, then 120-frame pointer sequence.
        await evaluate(
          `new Promise(resolve=>{let i=0;const tick=()=>{scrollTo({top:++i*15,behavior:'instant'});i<120?requestAnimationFrame(tick):resolve()};requestAnimationFrame(tick)})`,
        );
        if (width === 1440)
          await evaluate(
            `new Promise(resolve=>{let i=0;const tick=()=>{const x=300+(i%60)*6,y=250;const el=document.elementFromPoint(x,y)||document.body;el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:x,clientY:y}));++i<120?requestAnimationFrame(tick):resolve()};requestAnimationFrame(tick)})`,
          );
      }
      await delay(700);
      const after = await metrics();
      const interaction = await evaluate("({...__audit})");
      const path = new URL(
        `../.qa/${label}-${width}-${route === "/" ? "home" : route.split("/").pop().split(".")[0]}.png`,
        import.meta.url,
      );
      const screenshot = await call("Page.captureScreenshot", {
        format: "png",
      });
      await writeFile(path, Buffer.from(screenshot.data, "base64"));
      const delta = {};
      for (const key of [
        "ScriptDuration",
        "LayoutDuration",
        "RecalcStyleDuration",
        "LayoutCount",
        "RecalcStyleCount",
        "TaskDuration",
      ])
        delta[key] = after[key] - before[key];
      report.pages.push({ route, width, load, interaction, delta });
      console.log(
        `${current}: FCP ${Math.round(load.fcpMs || 0)}ms, LCP ${Math.round(load.lcp)}ms, letter reads ${interaction.letterRects}, layout ${Math.round(delta.LayoutDuration * 1000)}ms`,
      );
    }
  }
} finally {
  await chrome?.close();
  server.closeAllConnections();
  server.close();
}
await writeFile(
  new URL(`../.qa/performance-${label}.json`, import.meta.url),
  JSON.stringify(report, null, 2),
);
console.log(
  `Saved .qa/performance-${label}.json; ${report.errors.length} resource/runtime errors`,
);
