#!/usr/bin/env node
// Fetch Flickr album list for JOPT user and write flickr-albums.json.
// Fails open: on any error, writes an empty albums array so build continues.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "src/data/flickr-albums.json");

// Flickr user id: env override (NEXT_PUBLIC_FLICKR_USER_ID) で上書き可
const USER_ID = (process.env.NEXT_PUBLIC_FLICKR_USER_ID || "190979093@N07").trim();
const ALBUMS_URL = `https://www.flickr.com/photos/${USER_ID}/albums/`;

const EMPTY = { fetchedAt: new Date().toISOString(), albums: [] };

async function writeOut(payload) {
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function main() {
  if (process.env.SKIP_FLICKR_FETCH === "1") {
    console.log("[flickr] SKIP_FLICKR_FETCH=1 — keeping existing file");
    return;
  }

  try {
    const res = await fetch(ALBUMS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      console.warn(
        `[flickr] Fetch failed: HTTP ${res.status} — writing empty fallback`
      );
      await writeOut(EMPTY);
      return;
    }

    const html = await res.text();

    // Flickr embeds its client model in a <script> that begins with "Y.ClientApp.init".
    // The album list is nested under photosets. We scan for album ids via regex as a
    // best-effort, since a full parse requires a sandboxed JS runtime.
    const albumRe =
      /"id"\s*:\s*"(\d{10,})"[^}]*?"title"\s*:\s*(?:"([^"]+)"|\{\s*"_content"\s*:\s*"([^"]+)"\s*\})/g;

    const seen = new Set();
    const albums = [];
    let m;
    while ((m = albumRe.exec(html)) !== null) {
      const id = m[1];
      const title = (m[2] ?? m[3] ?? "").trim();
      if (!id || !title) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      albums.push({ id, title, coverUrl: null });
    }

    if (albums.length === 0) {
      console.warn("[flickr] No albums parsed — writing empty fallback");
      await writeOut(EMPTY);
      return;
    }

    await writeOut({ fetchedAt: new Date().toISOString(), albums });
    console.log(`[flickr] Wrote ${albums.length} albums`);
  } catch (err) {
    console.warn(`[flickr] Unexpected error: ${err?.message ?? err}`);
    await writeOut(EMPTY);
  }
}

main().catch((err) => {
  console.error("[flickr] Fatal error, falling back:", err);
  writeOut(EMPTY).finally(() => process.exit(0));
});
