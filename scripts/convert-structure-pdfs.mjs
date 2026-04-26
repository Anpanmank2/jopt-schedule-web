// Structure PDF → PNG 一括変換 + manifest 生成
// 対象: rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E.) 等で
// Apps Script の blind/minutes 抽出が不完全な event の Players Guide PDF を
// EventDetail.tsx の Structure タブで直接画像表示するため。
//
// 使い方:
//   1. PDF を任意ディレクトリ (例: ~/Downloads/2026_gf_structure/) に配置
//      ファイル名: #{eventNumber}.pdf (例: #46.pdf, #131.pdf)
//   2. pdf-to-png-converter を一時インストール:
//      cd /tmp && mkdir -p pdf-conv && cd pdf-conv && npm i pdf-to-png-converter
//   3. 環境変数で PDF ディレクトリを指定して実行:
//      SRC_DIR=~/Downloads/2026_gf_structure node /path/to/this/script.mjs
//
// 出力:
//   - public/structure-pdfs/{eventNum}-p{page}.png (各 PDF を 2x viewport で PNG 化)
//   - src/data/structure-pdf-manifest.json (eventNumber → page 数)

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = process.env.SRC_DIR || path.join(process.env.HOME || "/", "Downloads", "2026_gf_structure");
const REPO = path.resolve(__dirname, "..");
const DST_IMG = path.join(REPO, "public", "structure-pdfs");
const DST_MANIFEST = path.join(REPO, "src", "data", "structure-pdf-manifest.json");

const { pdfToPng } = await import("pdf-to-png-converter").catch((e) => {
  console.error("[ERR] pdf-to-png-converter not installed.");
  console.error("Install via: cd /tmp/pdf-conv && npm i pdf-to-png-converter");
  console.error("Then: NODE_PATH=/tmp/pdf-conv/node_modules SRC_DIR=...  node " + __filename);
  throw e;
});

await fs.mkdir(DST_IMG, { recursive: true });
const files = (await fs.readdir(SRC_DIR)).filter((f) => f.endsWith(".pdf"));
console.log(`[convert] ${files.length} PDFs in ${SRC_DIR}`);

const manifest = {};
for (const f of files) {
  const evNum = f.replace(/^#/, "").replace(/\.pdf$/, "");
  const buf = await fs.readFile(path.join(SRC_DIR, f));
  const pages = await pdfToPng(buf, { viewportScale: 2.0 });
  manifest[evNum] = pages.length;
  for (let i = 0; i < pages.length; i++) {
    const out = path.join(DST_IMG, `${evNum}-p${i + 1}.png`);
    await fs.writeFile(out, pages[i].content);
  }
  console.log(`[convert] #${evNum} → ${pages.length} page(s)`);
}
await fs.writeFile(DST_MANIFEST, JSON.stringify(manifest));
console.log(`[convert] manifest written: ${DST_MANIFEST}`);
console.log(`[convert] done`);
