// JOPT Official Rule PDF → PNG 一括変換 + manifest 生成
// 対象: JOPT 公式ルール PDF を rules ページで直接画像表示するため。
// iOS Safari は <iframe>/<embed> でインライン表示できないため PNG 化が必須。
//
// 使い方:
//   1. PDF を任意パス (例: ~/Downloads/jopt-official-rule-2026.pdf) に配置
//   2. pdf-to-png-converter を一時インストール:
//      cd /tmp && mkdir -p pdf-conv && cd pdf-conv && npm i pdf-to-png-converter
//   3. 環境変数で PDF パスを指定して実行:
//      SRC=~/Downloads/jopt-official-rule-2026.pdf NODE_PATH=/tmp/pdf-conv/node_modules \
//        node /path/to/this/script.mjs
//
// 出力:
//   - public/rule-pdfs/p{n}.png (1 始まり、2x viewport で PNG 化)
//   - public/jopt-official-rule-2026.pdf (download / print 配信用に同名でコピー)
//   - src/data/rule-pdf-manifest.json ({ pages: number, generatedAt: string })

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = process.env.SRC;
if (!SRC) {
  console.error("[ERR] SRC env var required. e.g. SRC=~/Downloads/jopt-official-rule-2026.pdf");
  process.exit(1);
}

const SRC_RESOLVED = SRC.replace(/^~/, process.env.HOME || "/");
const REPO = path.resolve(__dirname, "..");
const DST_IMG_DIR = path.join(REPO, "public", "rule-pdfs");
const DST_PDF = path.join(REPO, "public", "jopt-official-rule-2026.pdf");
const DST_MANIFEST = path.join(REPO, "src", "data", "rule-pdf-manifest.json");

const { pdfToPng } = await import("pdf-to-png-converter").catch((e) => {
  console.error("[ERR] pdf-to-png-converter not installed.");
  console.error("Install via: cd /tmp/pdf-conv && npm i pdf-to-png-converter");
  console.error("Then: NODE_PATH=/tmp/pdf-conv/node_modules SRC=...  node " + __filename);
  throw e;
});

await fs.mkdir(DST_IMG_DIR, { recursive: true });

// 既存 PNG 全削除 (前回より少ないページ数になった場合のゴミ残り防止)
const existing = await fs.readdir(DST_IMG_DIR).catch(() => []);
for (const f of existing) {
  if (f.endsWith(".png")) await fs.unlink(path.join(DST_IMG_DIR, f));
}

const buf = await fs.readFile(SRC_RESOLVED);
console.log(`[convert] reading ${SRC_RESOLVED} (${(buf.length / 1024).toFixed(1)} KB)`);
const pages = await pdfToPng(buf, { viewportScale: 2.0 });

for (let i = 0; i < pages.length; i++) {
  const out = path.join(DST_IMG_DIR, `p${i + 1}.png`);
  await fs.writeFile(out, pages[i].content);
}

// PDF 本体も public/ に配置 (download / print 用)
await fs.copyFile(SRC_RESOLVED, DST_PDF);

const manifest = { pages: pages.length, generatedAt: new Date().toISOString() };
await fs.writeFile(DST_MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

console.log(`[convert] ${pages.length} page(s) → ${DST_IMG_DIR}`);
console.log(`[convert] PDF copied → ${DST_PDF}`);
console.log(`[convert] manifest → ${DST_MANIFEST}`);
console.log(`[convert] done`);
