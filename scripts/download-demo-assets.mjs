import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { demoImages } from '../src/demo-models.js';
const dir = new URL('../public/demos/assets/', import.meta.url);
await mkdir(dir, { recursive: true });
let failures = 0;
for (const [key, [id]] of Object.entries(demoImages)) {
  const target = new URL(`${key}.jpg`, dir);
  try { await access(target); continue; } catch {}
  try {
    const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=82`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(target, buffer);
    console.log(`${key}: ${Math.round(buffer.length / 1024)} KB`);
  } catch (error) { failures++; console.error(`${key}: ${error.message}`); }
}
if (failures) process.exitCode = 1;

// Keep original demos self-contained as well, preserving their compositions.
for (const slug of ['brasa', 'corte', 'morada', 'forma', 'flora', 'pixel']) {
  const file = new URL(`../public/demos/${slug}.html`, import.meta.url);
  let html = await readFile(file, 'utf8');
  const sources = [...new Set(html.match(/https:\/\/images\.unsplash\.com\/[^"'\s)]+/g) || [])];
  for (const source of sources) {
    const id = source.match(/photo-[\w-]+/)[0];
    const name = `original-${id}.jpg`;
    const target = new URL(name, dir);
    try {
      try { await access(target); } catch {
        const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await writeFile(target, Buffer.from(await response.arrayBuffer()));
        console.log(`${slug}: ${name}`);
      }
      html = html.replaceAll(source, `assets/${name}`);
    } catch (error) { process.exitCode = 1; console.error(`${slug} / ${id}: ${error.message}`); }
  }
  await writeFile(file, html, 'utf8');
}
