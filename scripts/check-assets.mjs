import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const failures = [];
let references = 0,
  pages = 0;
for (const entry of await readdir(root, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile() || !/\.(html|css)$/.test(entry.name)) continue;
  const file = path.join(entry.parentPath, entry.name);
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const text = await readFile(file, "utf8");
  if (file.endsWith(".html")) pages++;
  const refs = [...text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(
    (m) => m[1],
  );
  for (const match of text.matchAll(/\bsrcset=["']([^"']+)["']/g))
    refs.push(
      ...match[1].split(",").map((part) => part.trim().split(/\s+/)[0]),
    );
  refs.push(
    ...[...text.matchAll(/url\(["']?([^"'\s)]+)["']?\)/g)].map((m) => m[1]),
  );
  for (const ref of refs) {
    if (!ref || /^(?:[a-z]+:|\/\/|#)/i.test(ref) || ref.includes("${"))
      continue;
    const url = new URL(ref, `http://local/${relative}`);
    const target = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (target !== root && !target.startsWith(root + path.sep)) {
      failures.push(`${relative}: invalid path ${ref}`);
      continue;
    }
    references++;
    try {
      await stat(target);
    } catch {
      failures.push(`${relative}: missing ${ref}`);
    }
  }
}
const manifest = JSON.parse(
  await readFile(path.join(root, "demos/image-manifest.json"), "utf8"),
);
for (const [original, meta] of Object.entries(manifest)) {
  for (const asset of [original, ...meta.outputs]) {
    references++;
    try {
      await stat(path.join(root, "demos", asset));
    } catch {
      failures.push(`manifest: missing ${asset}`);
    }
  }
}
console.log(JSON.stringify({ pages, references, failures }, null, 2));
if (failures.length) process.exitCode = 1;
