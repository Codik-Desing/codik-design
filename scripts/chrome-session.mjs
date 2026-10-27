// Small CDP client for local audits and image preparation; no npm dependency.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function chromeSession(port = 9340) {
  const profile = await mkdtemp(path.join(os.tmpdir(), "codik-perf-"));
  const browser = spawn(
    process.env.CHROME_PATH ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let launchError,
    socket,
    id = 0;
  const pending = new Map(),
    listeners = new Set();
  browser.on("error", (error) => {
    launchError = error;
  });
  async function close() {
    socket?.close();
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error("Chrome closed"));
    }
    pending.clear();
    if (browser.exitCode === null && !launchError) {
      const exited = new Promise((resolve) => browser.once("exit", resolve));
      browser.kill();
      await exited;
    }
    // Only remove the fresh temporary profile created by this process.
    await rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 150,
    }).catch(() => {});
  }
  try {
    let pages;
    for (let i = 0; i < 100; i++) {
      if (launchError) throw launchError;
      try {
        pages = await (
          await fetch(`http://127.0.0.1:${port}/json/list`)
        ).json();
      } catch {}
      if (pages?.some((p) => p.type === "page")) break;
      await delay(100);
    }
    if (!pages?.length)
      throw new Error("Chrome debugging endpoint unavailable");
    socket = new WebSocket(
      pages.find((p) => p.type === "page").webSocketDebuggerUrl,
    );
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    socket.addEventListener("message", ({ data }) => {
      const packet = JSON.parse(data),
        item = pending.get(packet.id);
      if (item) {
        clearTimeout(item.timer);
        pending.delete(packet.id);
        packet.error
          ? item.reject(new Error(JSON.stringify(packet.error)))
          : item.resolve(packet.result);
      } else if (packet.method)
        for (const listener of listeners) listener(packet);
    });
    function call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const next = ++id;
        const timer = setTimeout(() => {
          pending.delete(next);
          reject(new Error(`Timeout: ${method}`));
        }, 30000);
        pending.set(next, { resolve, reject, timer });
        socket.send(JSON.stringify({ id: next, method, params }));
      });
    }
    async function evaluate(expression) {
      const result = await call("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw new Error(
          result.exceptionDetails.exception?.description ||
            result.exceptionDetails.text,
        );
      return result.result.value;
    }
    await call("Runtime.enable");
    return {
      call,
      evaluate,
      close,
      onEvent: (listener) => listeners.add(listener),
    };
  } catch (error) {
    await close();
    throw error;
  }
}
