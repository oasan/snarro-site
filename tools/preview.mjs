// Screenshots of the site at given scroll positions, through Chrome DevTools.
// node tools/preview.mjs <outDir> <width>x<height> <light|dark> <target>...
// target: a CSS selector (scrolls it to the middle of the screen) or a number (scrollY).
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [outDir, size, theme, ...targets] = process.argv.slice(2);
const [width, height] = size.split("x").map(Number);
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "snarro-preview-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pages;
for (let i = 0; i < 50 && !pages; i++) {
  await sleep(200);
  try { pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {}
}
const ws = new WebSocket(pages.find((p) => p.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const waiting = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: width < 600 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] });
await send("Page.enable");
await send("Page.navigate", { url: "file://" + resolve("index.html") });
await sleep(2500);
const errors = await send("Runtime.evaluate", { expression: "document.body.scrollWidth > innerWidth ? 'HORIZONTAL OVERFLOW ' + document.body.scrollWidth : 'ok'", returnByValue: true });
console.log("overflow check:", errors.result.result.value);

for (const [i, target] of targets.entries()) {
  const expr = isNaN(Number(target))
    ? `(() => { const el = document.querySelector(${JSON.stringify(target)}); const r = el.getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: "instant" }); })()`
    : `window.scrollTo({ top: ${Number(target)}, behavior: "instant" })`;
  await send("Runtime.evaluate", { expression: expr });
  await sleep(2600);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const file = join(outDir, `${theme}-${width}-${i}.png`);
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  console.log(file, target);
}
ws.close();
proc.kill();
