// Offline bundle post-build: Vite emits module script tags by default; the production bundle is intentionally an IIFE so it can launch from file:// without a server.
import { readFile, writeFile } from "node:fs/promises";

const output = "dist/public/index.html";
let html = await readFile(output, "utf8");
html = html.replace(/<script\s+type="module"\s+crossorigin\s+src="([^"]+)"\s*><\/script>/, '<script defer src="$1"></script>');
html = html.replace(/\s*<script[^>]+src="\/__manus__\/debug-collector\.js"[^>]*><\/script>/g, "");
html = html.replace(/\s*<script id="manus-runtime">[\s\S]*?<\/script>/g, "");
await writeFile(output, html, "utf8");
