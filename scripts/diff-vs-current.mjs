#!/usr/bin/env node
/**
 * Compare transformed output (from extract.json) vs current jopt_gf2026_data.json
 * Outputs a human-readable diff report for Owner review.
 *
 * Usage:
 *   node scripts/diff-vs-current.mjs <transformed.json> <current.json> [--json]
 */

import fs from "node:fs";

const FIELDS = [
  "eventNumber",
  "name",
  "gameType",
  "date",
  "startTime",
  "lateRegClose",
  "lateRegLevel",
  "startingChips",
  "buyIn",
  "buyInDisplay",
  "isMainEvent",
  "isSatellite",
  "reentry",
  "day2Condition",
];

function flattenEvents(data) {
  const map = new Map();
  for (const d of data.days || []) {
    for (const e of d.events || []) {
      if (e.eventNumber) map.set(e.eventNumber, e);
    }
  }
  return map;
}

function norm(v) {
  if (v === undefined || v === "") return null;
  return v;
}

function main() {
  const [transformedPath, currentPath, ...flags] = process.argv.slice(2);
  if (!transformedPath || !currentPath) {
    console.error("Usage: node diff-vs-current.mjs <transformed.json> <current.json>");
    process.exit(1);
  }
  const transformed = JSON.parse(fs.readFileSync(transformedPath, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));

  const tMap = flattenEvents(transformed);
  const cMap = flattenEvents(current);

  const added = [];
  const removed = [];
  const changed = []; // [eventNumber, [{field, from, to}]]

  for (const [en, tEvent] of tMap.entries()) {
    const cEvent = cMap.get(en);
    if (!cEvent) {
      added.push(tEvent);
      continue;
    }
    const diffs = [];
    for (const f of FIELDS) {
      const a = norm(cEvent[f]);
      const b = norm(tEvent[f]);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        diffs.push({ field: f, from: a, to: b });
      }
    }
    // structure.levels 数の差分
    const aLevels = cEvent.structure?.levels?.length ?? 0;
    const bLevels = tEvent.structure?.levels?.length ?? 0;
    if (aLevels !== bLevels) {
      diffs.push({ field: "structure.levels.count", from: aLevels, to: bLevels });
    }
    if (diffs.length > 0) changed.push({ eventNumber: en, diffs });
  }

  for (const [en, cEvent] of cMap.entries()) {
    if (!tMap.has(en)) removed.push(cEvent);
  }

  // === 出力 ===
  const isJsonMode = flags.includes("--json");
  if (isJsonMode) {
    process.stdout.write(JSON.stringify({ added, removed, changed }, null, 2));
    return;
  }

  console.log("================================================");
  console.log(" extract → display 変換 vs 現行 data.json 差分レポート");
  console.log("================================================");
  console.log("");
  console.log("## サマリ");
  console.log(`- 現行 event 数:         ${cMap.size}`);
  console.log(`- extract 変換後 event 数: ${tMap.size}`);
  console.log(`- 新規追加 (extract のみ): ${added.length}`);
  console.log(`- 削除 (現行のみ、消える): ${removed.length}`);
  console.log(`- 変更あり (両方あるが値違い): ${changed.length}`);
  console.log("");

  // フィールド別 変更カウント
  const fieldChangeCount = {};
  for (const c of changed) {
    for (const d of c.diffs) {
      fieldChangeCount[d.field] = (fieldChangeCount[d.field] || 0) + 1;
    }
  }
  console.log("## フィールド別 変更件数 (多い順)");
  Object.entries(fieldChangeCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([f, n]) => console.log(`  ${f.padEnd(28)} ${n} 件`));
  console.log("");

  console.log(`## 新規追加 (${added.length} 件) — 抜粋 10 件`);
  added.slice(0, 10).forEach((e) =>
    console.log(`  + ${e.eventNumber.padEnd(6)} ${e.name} (${e.date} ${e.startTime})`)
  );
  console.log("");

  console.log(`## 削除 (${removed.length} 件) — 抜粋 10 件`);
  removed.slice(0, 10).forEach((e) =>
    console.log(`  - ${e.eventNumber.padEnd(6)} ${e.name} (${e.date} ${e.startTime})`)
  );
  console.log("");

  console.log(`## 変更 (${changed.length} 件) — 抜粋 20 件、最大 3 フィールドまで表示`);
  changed.slice(0, 20).forEach((c) => {
    console.log(`  * ${c.eventNumber}`);
    c.diffs.slice(0, 3).forEach((d) => {
      const from = JSON.stringify(d.from);
      const to = JSON.stringify(d.to);
      console.log(`      ${d.field}: ${from}  →  ${to}`);
    });
  });
}

main();
