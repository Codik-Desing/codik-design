import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/CookieBanner.jsx", import.meta.url), "utf8")
  .replace(/^import .*;$/gm, "")
  .split("export default function CookieBanner")[0]
  .replace("export function openCookieSettings", "function openCookieSettings")
  .replaceAll("import.meta.env.VITE_GA_ID", "testId");
function setup(testId = "G-TEST123", blocked = false) {
  const storage = new Map();
  const scripts = [], removedCookies = [];
  const context = {
    testId, URL, Event, Date,
    window: {
      location: { hostname: "www.codik.com.br", origin: "https://www.codik.com.br", pathname: "/" },
      localStorage: {
        getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
        setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); },
      },
      dispatchEvent() {},
    },
    document: {
      referrer: "https://example.com/?private=value",
      createElement() { return { remove() {} }; },
      head: { appendChild(script) { scripts.push(script); } },
      get cookie() { return "_ga=old; _ga_TEST123=old; unrelated=keep"; },
      set cookie(value) { removedCookies.push(value); },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, storage, scripts, removedCookies, run: (code) => vm.runInContext(code, context) };
}
const first = setup();
assert.equal(first.run("readConsent()"), null);
first.run("disableAnalytics()");
assert.equal(first.scripts.length, 0);
assert.equal(first.context.window["ga-disable-G-TEST123"], true);
first.run("writeConsent(true); enableAnalytics(); enableAnalytics()");
assert.equal(first.scripts.length, 1);
assert.equal(first.run("readConsent().analytics"), true);
const config = first.context.window.dataLayer[1][2];
assert.equal(config.page_location, "https://www.codik.com.br/");
assert.equal(config.page_referrer, "https://example.com");
assert.equal(config.allow_google_signals, false);
first.run("writeConsent(false); disableAnalytics()");
assert.equal(first.run("readConsent().analytics"), false);
assert.equal(first.context.window["ga-disable-G-TEST123"], true);
assert.ok(first.removedCookies.some(value => value.includes("domain=.codik.com.br")));
assert.ok(first.removedCookies.every(value => !value.startsWith("unrelated=")));
const blocked = setup("G-TEST123", true);
blocked.run("writeConsent(false)");
assert.equal(blocked.run("readConsent().analytics"), false);
const invalid = setup("invalid");
invalid.run("enableAnalytics()");
assert.equal(invalid.scripts.length, 0);
for (const stored of ["broken", '{"analytics":true}', JSON.stringify({ analytics: true, at: "2020-01-01", v: 1 })]) {
  const fixture = setup();
  fixture.storage.set("codik:cookie-consent", stored);
  assert.equal(fixture.run("readConsent()"), null);
}
console.log("Cookie consent checks passed: opt-in, refusal, revocation, scopes, blocked storage, invalid/expired consent, sanitized URLs and no duplicate scripts.");
