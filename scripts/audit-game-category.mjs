#!/usr/bin/env node
// Mirror of src/lib/transformer.ts deriveIsSatellite / deriveGameType / deriveGameCategory
// Used to capture pre-fix and post-fix gameCategory snapshots for the NL-variant fix.
// Run with: node scripts/audit-game-category.mjs <mode> <out.json>
//   mode = "current" -> current rule (NL/^NL\s also Hold'em)
//   mode = "fixed"   -> proposed rule (only NLH or title regex -> Hold'em)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] || "current";
const out = process.argv[3] || `audit-${mode}.json`;

const extractPath = resolve(process.cwd(), "src/data/extract.json");
const data = JSON.parse(readFileSync(extractPath, "utf8"));
const tournaments = data.tournaments || [];

function deriveIsSatellite(t) {
  if (typeof t.tab_name === "string" && t.tab_name.toLowerCase().startsWith("sate")) return true;
  if (typeof t.base_title === "string" && t.base_title.startsWith("(s")) return true;
  if (typeof t.event_title === "string" && t.event_title.includes("Satellite")) return true;
  return false;
}

function deriveGameType(t, isSat) {
  if (t.game_type) return t.game_type;
  if (isSat) return "SAT";
  return "";
}

function deriveGameCategoryCurrent(t, isSat, gameType) {
  if (isSat) return "Satellite";
  const title = String(t.event_title || t.base_title || t.tab_name || "");
  if (/ジュニア|STARS\s*TABLE/i.test(title)) return "Hold'em";
  if (/NLH|Hold'?em/i.test(title)) return "Hold'em";
  const gt = gameType.trim();
  if (gt === "NLH" || gt === "NL" || /^NL\s/.test(gt)) return "Hold'em";
  if (gt === "PLO" || gt === "PLO8") return "Omaha";
  return "Other";
}

function deriveGameCategoryFixed(t, isSat, gameType) {
  if (isSat) return "Satellite";
  const title = String(t.event_title || t.base_title || t.tab_name || "");
  if (/ジュニア|STARS\s*TABLE/i.test(title)) return "Hold'em";
  if (/NLH|Hold'?em/i.test(title)) return "Hold'em";
  const gt = gameType.trim();
  if (gt === "NLH") return "Hold'em";
  if (gt === "PLO" || gt === "PLO8") return "Omaha";
  return "Other";
}

const deriveCat = mode === "fixed" ? deriveGameCategoryFixed : deriveGameCategoryCurrent;

const audit = tournaments.map((t) => {
  const isSat = deriveIsSatellite(t);
  const gt = deriveGameType(t, isSat);
  const cat = deriveCat(t, isSat, gt);
  const sched = (t.schedules || [])[0] || {};
  return {
    number: t.number ?? null,
    no: t.no ?? null,
    event_title: t.event_title ?? "",
    tab_name: t.tab_name ?? "",
    is_sponsor_variant: !!t.is_sponsor_variant,
    isSatellite: isSat,
    gameType: gt,
    gameCategory: cat,
    start_date: sched.start_date ?? "",
    start_time: sched.start_time ?? "",
  };
});

writeFileSync(out, JSON.stringify(audit, null, 2));
const counts = audit.reduce((m, e) => {
  m[e.gameCategory] = (m[e.gameCategory] || 0) + 1;
  return m;
}, {});
console.log(`mode=${mode}  events=${audit.length}  out=${out}`);
console.log("category counts:", counts);
