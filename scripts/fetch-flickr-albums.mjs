#!/usr/bin/env node
// Fetch Flickr album list for JOPT user and write flickr-albums.json.
// Walks pagination until empty page. Fails open: writes empty albums on any error.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "src/data/flickr-albums.json");

const USER_ID = (process.env.NEXT_PUBLIC_FLICKR_USER_ID || "190979093@N07").trim();
const BASE_URL = `https://www.flickr.com/photos/${USER_ID}/albums/`;
const MAX_PAGES = Number(process.env.FLICKR_MAX_PAGES || 20);
const PAGE_DELAY_MS = 400;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const EMPTY = { fetchedAt: new Date().toISOString(), albums: [] };

function decodeJsonStr(s) {
  return s.replace(/\\\//g, "/").replace(/\\u002F/gi, "/");
}

function parseAlbumsFromHtml(html) {
  const seen = new Set();
  const out = [];
  const idRe = /"id":"(\d{15,})"/g;
  let m;
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    const start = idRe.lastIndex;
    const window = html.substring(start, start + 800);
    const titleMatch = window.match(/"title":"([^"]{1,120})"/);
    if (!titleMatch) continue;
    const title = decodeJsonStr(titleMatch[1]).trim();
    if (!title) continue;
    const coverMatch = window.match(
      /"(?:coverPhoto|coverPhotoUrls|cover_photo)"[^"]*"(https:[^"]{20,200}\.(?:jpe?g|png))"/i
    );
    const coverUrl = coverMatch ? decodeJsonStr(coverMatch[1]) : null;
    seen.add(id);
    out.push({ id, title, coverUrl });
  }
  return out;
}

async function fetchPage(pageNum) {
  const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page${pageNum}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) {
    console.warn(`[flickr] page ${pageNum}: HTTP ${res.status}`);
    return null;
  }
  return await res.text();
}

async function writeOut(payload) {
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (process.env.SKIP_FLICKR_FETCH === "1") {
    console.log("[flickr] SKIP_FLICKR_FETCH=1 — keeping existing file");
    return;
  }

  try {
    const all = new Map();
    let prevSize = -1;
    let consecutiveEmpty = 0;

    for (let p = 1; p <= MAX_PAGES; p++) {
      const html = await fetchPage(p);
      if (!html) break;

      const albums = parseAlbumsFromHtml(html);
      let added = 0;
      for (const a of albums) {
        if (!all.has(a.id)) {
          all.set(a.id, a);
          added++;
        }
      }
      console.log(`[flickr] page ${p}: parsed=${albums.length}, new=${added}, total=${all.size}`);

      if (added === 0) {
        consecutiveEmpty++;
        if (consecutiveEmpty >= 2) {
          console.log(`[flickr] no new albums on 2 consecutive pages — stopping`);
          break;
        }
      } else {
        consecutiveEmpty = 0;
      }
      if (all.size === prevSize) break;
      prevSize = all.size;
      await sleep(PAGE_DELAY_MS);
    }

    if (all.size === 0) {
      console.warn("[flickr] No albums parsed across all pages — writing empty fallback");
      await writeOut(EMPTY);
      return;
    }

    const albumsArr = Array.from(all.values());
    await writeOut({ fetchedAt: new Date().toISOString(), albums: albumsArr });
    console.log(`[flickr] Wrote ${albumsArr.length} albums`);
  } catch (err) {
    console.warn(`[flickr] Unexpected error: ${err?.message ?? err}`);
    await writeOut(EMPTY);
  }
}

main().catch((err) => {
  console.error("[flickr] Fatal error, falling back:", err);
  writeOut(EMPTY).finally(() => process.exit(0));
});
