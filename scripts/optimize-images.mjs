// Prepare derivatives with the installed Chrome encoder. Originals stay intact.
// Run after replacing photos or refreshing catalog screenshots, then rebuild.
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { chromeSession } from "./chrome-session.mjs";

const root = new URL("../public/demos/", import.meta.url);
const manifestUrl = new URL("image-manifest.json", root);
let previous = {};
try {
  previous = JSON.parse(await readFile(manifestUrl, "utf8"));
} catch {}
const manifest = {};
const chrome = await chromeSession(9341);
let saved = 0;
try {
  for (const folder of ["assets", "previews"]) {
    for (const name of (await readdir(new URL(`${folder}/`, root))).sort()) {
      if (!name.endsWith(".jpg") || /-\d+\.jpg$/.test(name)) continue;
      const key = `${folder}/${name}`;
      const data = await readFile(new URL(key, root));
      const hash = createHash("sha256").update(data).digest("hex");
      const old = previous[key];
      if (
        old?.hash === hash &&
        old.version === 1 &&
        (await Promise.all(
          old.outputs.map((p) =>
            readFile(new URL(p, root)).then(
              () => true,
              () => false,
            ),
          ),
        ).then((ok) => ok.every(Boolean)))
      ) {
        manifest[key] = old;
        continue;
      }
      const result = await chrome.evaluate(`(async()=>{
        const binary=atob(${JSON.stringify(data.toString("base64"))});
        const bitmap=await createImageBitmap(new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type:'image/jpeg'}));
        const outputs=[];
        const preview=${folder === "previews"};
        for(const width of preview?[260,520]:[bitmap.width]){
          const height=Math.round(bitmap.height*width/bitmap.width);
          const canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d');
          ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,width,height);
          for(const type of preview?['image/jpeg','image/webp']:['image/webp']){
            const blob=await canvas.convertToBlob({type,quality:preview?.92:.90});
            const bytes=new Uint8Array(await blob.arrayBuffer());
            let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
            outputs.push({width,height,type,data:btoa(binary)});
          }
        }
        const size={width:bitmap.width,height:bitmap.height};bitmap.close();return {...size,outputs};
      })()`);
      const outputs = [];
      for (const output of result.outputs) {
        const bytes = Buffer.from(output.data, "base64");
        // Full-size WebP must be smaller; otherwise use the original JPEG.
        if (folder === "assets" && bytes.length >= data.length) continue;
        const destination = key.replace(
          /\.jpg$/,
          `${folder === "previews" ? `-${output.width}` : ""}.${output.type === "image/webp" ? "webp" : "jpg"}`,
        );
        await writeFile(new URL(destination, root), bytes);
        outputs.push(destination);
        if (folder === "assets") saved += data.length - bytes.length;
      }
      manifest[key] = {
        hash,
        version: 1,
        width: result.width,
        height: result.height,
        bytes: data.length,
        outputs,
      };
      console.log(`${key}: ${outputs.length} derivatives`);
    }
  }
  // The same 2000px logo was also being downloaded for a tiny browser tab.
  // Preserve its full composition and transparency in a 64px PNG derivative.
  const logo = await readFile(new URL('../codik-logo.png', root));
  const icon = await chrome.evaluate(`(async()=>{
    const blob=await (await fetch('data:image/png;base64,${logo.toString('base64')}')).blob();
    const bitmap=await createImageBitmap(blob);
    const canvas=new OffscreenCanvas(64,64),ctx=canvas.getContext('2d');
    ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,64,64);bitmap.close();
    const bytes=new Uint8Array(await (await canvas.convertToBlob({type:'image/png'})).arrayBuffer());
    return btoa(String.fromCharCode(...bytes));
  })()`);
  await writeFile(new URL('../codik-icon.png', root), Buffer.from(icon, 'base64'));
} finally {
  await chrome.close();
}
await writeFile(manifestUrl, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Originals preserved. New full-size WebP savings: ${saved} bytes.`);
