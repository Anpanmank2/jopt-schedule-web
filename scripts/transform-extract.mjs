#!/usr/bin/env node
/**
 * extract.json → display JSON transformer (prototype)
 *
 * Usage:
 *   node scripts/transform-extract.mjs <extract.json path> [<current data.json path>]
 *
 * Output: prints transformed JSON to stdout
 *
 * Mapping rules: see .company/engineering/docs/jopt-schedule-web-extract-mapping.md (Owner approved 2026-04-21)
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Parsers (pure functions)
// ---------------------------------------------------------------------------

/**
 * "50,000 Chips" → 50000
 * "20,000 × 3 Chips" → 60000
 * "10,000 Chips ×2 (Double Stack)" → 20000
 * "- Chips" → null
 */
export function parseChips(str) {
  if (!str || typeof str !== "string") return null;
  // × N 形式を先にキャッチ (× 3 または ×2)
  const xMatchBefore = str.match(/^([\d,]+)\s*[×x]\s*(\d+)\s*Chips/i);
  if (xMatchBefore) {
    const n = parseInt(xMatchBefore[1].replace(/,/g, ""), 10);
    const m = parseInt(xMatchBefore[2], 10);
    return Number.isFinite(n) && Number.isFinite(m) ? n * m : null;
  }
  const xMatchAfter = str.match(/^([\d,]+)\s*Chips\s*[×x]\s*(\d+)/i);
  if (xMatchAfter) {
    const n = parseInt(xMatchAfter[1].replace(/,/g, ""), 10);
    const m = parseInt(xMatchAfter[2], 10);
    return Number.isFinite(n) && Number.isFinite(m) ? n * m : null;
  }
  // 標準形式
  const m = str.match(/^([\d,]+)\s*Chips/i);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * fee_lines[] → {buyIn: number|null, buyInDisplay: string|null, feeDetail: string|null}
 * ルール:
 *   - JOPT Ticket を含む行はスキップして cash 代表値を優先
 *   - "¥0" → 0
 *   - "Pre-registration only" → null
 *   - feeDetail は全 lines を \n 結合で保持 (Ticket option も含める)
 */
export function parseFeeLines(feeLines) {
  if (!Array.isArray(feeLines) || feeLines.length === 0) {
    return { buyIn: null, buyInDisplay: null, feeDetail: null };
  }
  const feeDetail = feeLines.join("\n");

  // Cash-only line を探す (JOPT Ticket, Pre-registration 除外)
  let buyIn = null;
  let buyInDisplay = null;
  for (const line of feeLines) {
    if (/JOPT\s+Ticket/i.test(line)) continue;
    if (/Pre-registration/i.test(line)) {
      buyInDisplay = line; // "Pre-registration only" を表示用に保持
      continue;
    }
    // "¥0" or "¥12,000" or "¥120,000 (including ¥10,909 ...)"
    const m = line.match(/¥([\d,]+)/);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (Number.isFinite(n)) {
        buyIn = n;
        buyInDisplay = `¥${m[1]}`;
        break;
      }
    }
  }

  // Cash line 無し (Ticket only 等) → Ticket 行を表示用に採用
  if (buyIn === null && !buyInDisplay) {
    const ticketLine = feeLines.find((l) => /JOPT\s+Ticket/i.test(l));
    if (ticketLine) buyInDisplay = ticketLine;
  }

  return { buyIn, buyInDisplay, feeDetail };
}

/**
 * "05.02 Sat." / "05/04  Mon." → "2026-05-02"
 * 区切り文字はドット or スラッシュ、空白数は任意
 */
export function parseDate(str, year = 2026) {
  if (!str) return null;
  const m = str.match(/^(\d{2})[./](\d{2})/);
  if (!m) return null;
  return `${year}-${m[1]}-${m[2]}`;
}

/**
 * reg_close_time + reg_close_level → "18:15 (Lv.9)" | "18:15" | null
 */
export function buildLateRegClose(regCloseTime, regCloseLevel) {
  const t = regCloseTime?.trim();
  const lv = regCloseLevel?.toString().trim();
  if (!t && !lv) return null;
  if (t && lv) return `${t} (Lv.${lv})`;
  if (t) return t;
  return null;
}

/**
 * isMainEvent 推定
 */
export function deriveIsMainEvent(t) {
  return t.tab_name === "Main" || t.base_title === "Main Event";
}

/**
 * isSatellite 推定
 */
export function deriveIsSatellite(t) {
  if (t.tab_name?.toLowerCase().startsWith("sate")) return true;
  if (t.base_title?.startsWith("(s")) return true;
  if (t.event_title?.includes("Satellite")) return true;
  return false;
}

/**
 * gameType derive
 */
export function deriveGameType(t, isSatellite) {
  if (t.game_type) return t.game_type;
  if (isSatellite) return "SAT";
  return null;
}

/**
 * structure.rows[] → structure.levels[] + break 挿入
 */
export function transformStructure(rows, regCloseLevel) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const levels = [];
  for (const row of rows) {
    const playMin =
      parseInt(row.play_minutes, 10) ||
      parseInt((row.minutes ?? "").split("/")[0], 10);
    const level = {
      level: row.level,
      sb: row.small_blind ? parseInt(row.small_blind.replace(/,/g, ""), 10) : undefined,
      bb: row.big_blind ? parseInt(row.big_blind.replace(/,/g, ""), 10) : undefined,
      time: Number.isFinite(playMin) ? playMin : 0,
    };
    if (row.ante) {
      const ante = parseInt(row.ante.replace(/,/g, ""), 10);
      if (Number.isFinite(ante)) level.ante = ante;
    }
    levels.push(level);

    // break_after === true → 次の level 前に break エントリを挿入
    if (row.break_after) {
      const breakMin =
        parseInt(row.secondary_minutes, 10) ||
        parseInt((row.minutes ?? "").split("/")[1], 10) ||
        10;
      levels.push({ break: true, time: breakMin });
    }
  }

  const lateRegCloseAfterLevel = regCloseLevel
    ? parseInt(regCloseLevel, 10) || null
    : null;

  return {
    columns: ["Level", "Blinds", "BB Ante", "Minutes"],
    lateRegCloseAfterLevel,
    day2EndLevel: null, // TODO: Sheets 側列追加で対応検討
    levels,
  };
}

/**
 * prize オブジェクト → display Prize
 */
export function transformPrize(p) {
  if (!p) return null;
  return {
    total: p.total || null,
    inPrize: p.in_prize || null,
    // 現行 display Prize interface (EventDetail.tsx:22) には satellitePrize が optional
    // satellite_awards をそこに詰めるか要確認 — staging diff で判定
  };
}

/**
 * notes 正規化 (空配列 → null)
 */
export function normalizeNotes(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return null;
  return notes;
}

/**
 * games.items → string[] (Mixed game list)
 */
export function extractGames(games) {
  if (!games || !Array.isArray(games.items) || games.items.length === 0) return null;
  return games.items;
}

// ---------------------------------------------------------------------------
// Main transformer
// ---------------------------------------------------------------------------

/**
 * extract tournament → display event
 */
export function transformTournament(t, opts = {}) {
  const { currentMultiDayMap = {}, year = 2026 } = opts;

  const isMainEvent = deriveIsMainEvent(t);
  const isSatellite = deriveIsSatellite(t);
  const gameType = deriveGameType(t, isSatellite);

  // 最初の schedule が基本情報
  const firstSchedule = t.schedules?.[0] || null;
  const date = firstSchedule ? parseDate(firstSchedule.start_date, year) : null;
  const startTime = firstSchedule?.start_time || null;
  const lateRegClose = firstSchedule
    ? buildLateRegClose(firstSchedule.reg_close_time, firstSchedule.reg_close_level)
    : null;
  const lateRegLevel = firstSchedule?.reg_close_level
    ? parseInt(firstSchedule.reg_close_level, 10) || null
    : null;

  const startingChips = parseChips(t.chips);
  const { buyIn, buyInDisplay, feeDetail } = parseFeeLines(t.fee_chips?.fee_lines);

  const structure = transformStructure(t.structure?.rows, firstSchedule?.reg_close_level);
  const prize = transformPrize(t.prize);
  const notes = normalizeNotes(t.notes);
  const games = extractGames(t.games);

  // multiDay merge: 現行 data.json に該当 event の multiDay があれば流用
  const multiDay = currentMultiDayMap[t.number] || null;

  // eventNumber: extract の `number` が空なら event_title/base_title から "#XX" or "(sXX)" を抽出
  //   "(s01) Satellite to ..." → "(s01)"
  //   "#01 NLH Main Event" → "#01"
  let eventNumber = t.number || "";
  if (!eventNumber) {
    const titleSrc = t.event_title || t.base_title || "";
    const satMatch = titleSrc.match(/^(\(s\d+\))/);
    const hashMatch = titleSrc.match(/^(#\d+)/);
    if (satMatch) eventNumber = satMatch[1];
    else if (hashMatch) eventNumber = hashMatch[1];
    else if (t.tab_name) eventNumber = t.tab_name; // last resort
  }

  // name: "#01 NLH Main Event" / "(s01) Satellite..." → prefix 除去
  const name =
    t.event_title?.replace(/^#\d+\s+/, "").replace(/^\(s\d+\)\s+/, "") ||
    t.base_title?.replace(/^\(s\d+\)\s+/, "") ||
    t.tab_name ||
    "";

  return {
    eventNumber,
    name,
    gameType: gameType || "",
    date,
    startTime,
    lateRegClose,
    lateRegLevel,
    startingChips,
    buyIn,
    buyInDisplay,
    gtd: null,
    gtdDisplay: null,
    isMainEvent,
    isSatellite,
    reentry: t.re_entry_note?.trim() || null,
    day2Condition: t.day2_advance_note?.trim() || null,
    ruleNotes: null,
    structure,
    prize,
    feeDetail,
    games,
    bounty: null,
    notes,
    award: null, // TODO: award の構造変換は staging diff 後
    multiDay,
  };
}

/**
 * extract.json 全体 → display data.json 相当
 */
export function transform(extract, currentData = null) {
  const rawTournaments = (extract.tournaments || []).filter(
    (t) => t.category === "TOURNAMENT"
  );

  // sponsor variant dedup: 同じ number が複数あれば is_sponsor_variant: true を優先
  // (extract では冠スポンサー付き/無しが 2 entry になっているケースあり、計 14 組)
  const byNumber = new Map();
  for (const t of rawTournaments) {
    const key = t.number || `${t.tab_name}::${t.event_title}`; // satellite 等で number 空
    if (!byNumber.has(key)) {
      byNumber.set(key, t);
    } else {
      const existing = byNumber.get(key);
      if (!existing.is_sponsor_variant && t.is_sponsor_variant) {
        byNumber.set(key, t); // sponsor variant 勝ち
      }
      // 両方 sponsor variant or 両方非 sponsor なら先勝ち (Sheets 並び順維持)
    }
  }
  const tournaments = [...byNumber.values()];

  // 現行 data.json の multiDay を eventNumber でマップ化 (merge 用)
  const currentMultiDayMap = {};
  if (currentData?.meta?.multiDayEvents) {
    Object.assign(currentMultiDayMap, currentData.meta.multiDayEvents);
  }
  if (Array.isArray(currentData?.days)) {
    for (const d of currentData.days) {
      for (const e of d.events || []) {
        if (e.eventNumber && e.multiDay) {
          currentMultiDayMap[e.eventNumber] = e.multiDay;
        }
      }
    }
  }

  // 各 tournament → display event
  const events = tournaments.map((t) =>
    transformTournament(t, { currentMultiDayMap })
  );

  // 日別にグルーピング
  const byDate = {};
  for (const e of events) {
    if (!e.date) continue;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  // days 配列に整形
  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evts]) => ({
      date,
      dayLabel: formatDayLabel(date),
      events: evts.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || "")),
    }));

  return {
    meta: {
      eventName: extract.event?.eventName || "JOPT 2026 Grand Final",
      venue: "Bellesalle Takadanobaba",
      totalEvents: events.length,
      extractedAt: extract.event?.extracted_at || new Date().toISOString(),
      source: "extract.json transformer (feature/backend-split)",
    },
    days,
  };
}

function formatDayLabel(isoDate) {
  // "2026-04-24" → "4/24 金"
  const [y, m, d] = isoDate.split("-").map(Number);
  const dayObj = new Date(Date.UTC(y, m - 1, d));
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}/${d} ${weekdays[dayObj.getUTCDay()]}`;
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

// CLI entry (always run when executed directly)
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(path.basename(process.argv[1] || ""));

if (isMainModule) {
  const extractPath = process.argv[2];
  const currentDataPath = process.argv[3];
  if (!extractPath) {
    console.error("Usage: node transform-extract.mjs <extract.json> [<current data.json>]");
    process.exit(1);
  }
  const extract = JSON.parse(fs.readFileSync(extractPath, "utf8"));
  const currentData = currentDataPath
    ? JSON.parse(fs.readFileSync(currentDataPath, "utf8"))
    : null;
  const output = transform(extract, currentData);
  process.stdout.write(JSON.stringify(output, null, 2));
}
