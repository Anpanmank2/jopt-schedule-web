#!/usr/bin/env node
/**
 * Full-range audit report generator for transformer output vs current data.json
 *
 * Outputs:
 *  - Day-by-day event counts (new vs current)
 *  - Degradation events (new levels < current levels OR new notes < current notes)
 *  - Improvement events count
 *  - Newly added events
 *  - Removed events (critical — should be 0)
 *  - Day 2 Structure rows for target events (#01/#70/#145/#147)
 *
 * Usage:
 *   node scripts/audit-report.mjs <transformed.json> <current.json> <extract.json> > audit.md
 */

import fs from "node:fs";

function flattenEvents(data) {
  const events = [];
  for (const d of data.days || []) {
    for (const e of d.events || []) {
      events.push({ ...e, _day: d.date || d.dayLabel || d.dayName || d.label || "unknown" });
    }
  }
  return events;
}

function main() {
  const [transformedPath, currentPath, extractPath] = process.argv.slice(2);
  if (!transformedPath || !currentPath || !extractPath) {
    console.error("Usage: node audit-report.mjs <transformed.json> <current.json> <extract.json>");
    process.exit(1);
  }
  const transformed = JSON.parse(fs.readFileSync(transformedPath, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  const extract = JSON.parse(fs.readFileSync(extractPath, "utf8"));

  const tEvents = flattenEvents(transformed);
  const cEvents = flattenEvents(current);

  const tByNum = new Map(tEvents.map(e => [e.eventNumber, e]));
  const cByNum = new Map(cEvents.map(e => [e.eventNumber, e]));

  // Day-by-day counts
  const dayCount = (events) => {
    const m = new Map();
    for (const e of events) {
      const k = e._day;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };
  const tDayMap = dayCount(tEvents);
  const cDayMap = dayCount(cEvents);
  const allDays = [...new Set([...tDayMap.keys(), ...cDayMap.keys()])].sort();

  // Degradation / improvement
  const degraded = [];
  const improved = [];
  const unchanged = [];
  for (const [num, t] of tByNum.entries()) {
    const c = cByNum.get(num);
    if (!c) continue;
    const tLv = t.structure?.levels?.length ?? 0;
    const cLv = c.structure?.levels?.length ?? 0;
    const tNotes = t.notes?.length ?? 0;
    const cNotes = c.notes?.length ?? 0;
    if (tLv < cLv || tNotes < cNotes) {
      degraded.push({ num, tLv, cLv, tNotes, cNotes });
    } else if (tLv > cLv || tNotes > cNotes) {
      improved.push({ num, tLv, cLv, tNotes, cNotes });
    } else {
      unchanged.push(num);
    }
  }

  const added = [...tByNum.keys()].filter(n => !cByNum.has(n));
  const removed = [...cByNum.keys()].filter(n => !tByNum.has(n));

  // Day 2 Structure target events (filter to TOURNAMENT only, not Howto/EXCLUDE)
  const dayTargets = [
    { num: "#01", label: "Main Event" },
    { num: "#70", label: "Superstack" },
    { num: "#145", label: "PPC" },
    { num: "#147", label: "PLO CS" },
  ];
  const day2Report = [];
  for (const { num, label } of dayTargets) {
    const matches = extract.tournaments.filter(t =>
      t.category === "TOURNAMENT" && t.number === num
    );
    // Prefer most-rows variant (primary tab typically has fullest structure)
    matches.sort((a, b) => (b.structure?.rows?.length ?? 0) - (a.structure?.rows?.length ?? 0));
    const primary = matches[0];
    const rows = primary?.structure?.rows?.length ?? 0;
    const day1 = primary?.structure?.day1_rows?.length ?? 0;
    const day2 = primary?.structure?.day2_rows?.length ?? 0;
    day2Report.push({ num, label, rows, day1, day2, tab: primary?.tab_name, variantCount: matches.length });
  }

  // --- Markdown output ---
  const now = new Date().toISOString();
  let out = `# JOPT Schedule Web — Extract/Transform Audit\n\n`;
  out += `Generated: ${now}\n`;
  out += `- transformed: ${transformedPath}\n`;
  out += `- current:     ${currentPath}\n`;
  out += `- extract:     ${extractPath}\n\n`;
  out += `## Event totals\n\n`;
  out += `| | transformed | current | diff |\n|---|---|---|---|\n`;
  out += `| Events | ${tEvents.length} | ${cEvents.length} | ${tEvents.length - cEvents.length} |\n`;
  out += `| Days   | ${transformed.days?.length ?? 0} | ${current.days?.length ?? 0} | ${(transformed.days?.length ?? 0) - (current.days?.length ?? 0)} |\n`;
  out += `| Added  | ${added.length} | | |\n`;
  out += `| Removed (critical) | ${removed.length} | | |\n`;
  out += `| Degraded | ${degraded.length} | | |\n`;
  out += `| Improved | ${improved.length} | | |\n\n`;

  out += `## Day-by-day event counts\n\n`;
  out += `| Day | transformed | current | diff |\n|---|---|---|---|\n`;
  for (const d of allDays) {
    const t = tDayMap.get(d) || 0;
    const c = cDayMap.get(d) || 0;
    out += `| ${d} | ${t} | ${c} | ${t - c} |\n`;
  }
  out += `\n`;

  out += `## Day 2 Structure targets (from extract.json)\n\n`;
  out += `| event | label | tab | variants | rows | day1 | day2 |\n|---|---|---|---|---|---|---|\n`;
  for (const r of day2Report) {
    out += `| ${r.num} | ${r.label} | ${r.tab || "N/A"} | ${r.variantCount} | ${r.rows} | ${r.day1} | ${r.day2} |\n`;
  }
  out += `\n`;

  if (removed.length) {
    out += `## ⚠ REMOVED events (critical — must be 0 for Push Gate)\n\n`;
    for (const n of removed) out += `- ${n}\n`;
    out += `\n`;
  }

  if (degraded.length) {
    out += `## ⚠ Degraded events\n\n`;
    out += `| event | new levels | cur levels | new notes | cur notes |\n|---|---|---|---|---|\n`;
    for (const d of degraded) {
      out += `| ${d.num} | ${d.tLv} | ${d.cLv} | ${d.tNotes} | ${d.cNotes} |\n`;
    }
    out += `\n`;
  }

  if (added.length) {
    out += `## New events (added vs current)\n\n`;
    for (const n of added) out += `- ${n}\n`;
    out += `\n`;
  }

  out += `## Improved events (top 10 by level delta)\n\n`;
  const topImproved = [...improved].sort((a, b) => (b.tLv - b.cLv) - (a.tLv - a.cLv)).slice(0, 10);
  out += `| event | new levels | cur levels | Δ levels | new notes | cur notes |\n|---|---|---|---|---|---|\n`;
  for (const d of topImproved) {
    out += `| ${d.num} | ${d.tLv} | ${d.cLv} | +${d.tLv - d.cLv} | ${d.tNotes} | ${d.cNotes} |\n`;
  }
  out += `\n`;

  process.stdout.write(out);
}

main();
