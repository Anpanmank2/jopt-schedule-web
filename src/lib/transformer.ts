/**
 * extract.json → display JSON transformer (TS port)
 *
 * 仕様: .company/engineering/docs/jopt-schedule-web-extract-mapping.md (Owner approved 2026-04-21)
 * Owner ポリシー決定:
 *   - lateRegClose: "21:30 (Lv.8)" 形式で統一
 *   - gameType: サブカテゴリ (FL/NL/10-Game MIX 等) をそのまま表示
 *   - 新規 7 event (ジュニア / STARS TABLE 等) 全部含める
 *   - multiDay: 現行 data.json の 13 event 値を eventNumber で merge
 *   - sponsor variant: is_sponsor_variant: true を優先採用
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TransformedLevel {
  level?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  time: number;
  break?: boolean;
}

export interface TransformedStructure {
  columns: string[];
  lateRegCloseAfterLevel: number | null;
  day2EndLevel: number | null;
  levels: TransformedLevel[];
}

export interface TransformedEvent {
  eventNumber: string;
  name: string;
  gameType: string;
  date: string | null;
  startTime: string | null;
  lateRegClose: string | null;
  lateRegLevel: number | null;
  startingChips: number | null;
  buyIn: number | null;
  buyInDisplay: string | null;
  gtd: number | null;
  gtdDisplay: string | null;
  isMainEvent: boolean;
  isSatellite: boolean;
  reentry: string | null;
  day2Condition: string | null;
  ruleNotes: string | null;
  structure: TransformedStructure | null;
  prize: { total: string | null; inPrize: string | null } | null;
  feeDetail: string | null;
  games: string[] | null;
  bounty: string | null;
  notes: string[] | null;
  award: unknown;
  multiDay: Record<string, unknown> | null;
}

export interface TransformedDay {
  date: string;
  dayLabel: string;
  events: TransformedEvent[];
}

export interface TransformedData {
  meta: {
    eventName: string;
    venue: string;
    totalEvents: number;
    extractedAt: string;
    source: string;
  };
  days: TransformedDay[];
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export function parseChips(str: string | null | undefined): number | null {
  if (!str || typeof str !== "string") return null;
  const xBefore = str.match(/^([\d,]+)\s*[×x]\s*(\d+)\s*Chips/i);
  if (xBefore) {
    const n = parseInt(xBefore[1].replace(/,/g, ""), 10);
    const m = parseInt(xBefore[2], 10);
    return Number.isFinite(n) && Number.isFinite(m) ? n * m : null;
  }
  const xAfter = str.match(/^([\d,]+)\s*Chips\s*[×x]\s*(\d+)/i);
  if (xAfter) {
    const n = parseInt(xAfter[1].replace(/,/g, ""), 10);
    const m = parseInt(xAfter[2], 10);
    return Number.isFinite(n) && Number.isFinite(m) ? n * m : null;
  }
  const m = str.match(/^([\d,]+)\s*Chips/i);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseFeeLines(feeLines: string[] | undefined): {
  buyIn: number | null;
  buyInDisplay: string | null;
  feeDetail: string | null;
} {
  if (!Array.isArray(feeLines) || feeLines.length === 0) {
    return { buyIn: null, buyInDisplay: null, feeDetail: null };
  }
  const feeDetail = feeLines.join("\n");
  let buyIn: number | null = null;
  let buyInDisplay: string | null = null;
  for (const line of feeLines) {
    if (/JOPT\s+Ticket/i.test(line)) continue;
    if (/Pre-registration/i.test(line)) {
      buyInDisplay = line;
      continue;
    }
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
  if (buyIn === null && !buyInDisplay) {
    const ticketLine = feeLines.find((l) => /JOPT\s+Ticket/i.test(l));
    if (ticketLine) buyInDisplay = ticketLine;
  }
  return { buyIn, buyInDisplay, feeDetail };
}

export function parseDate(str: string | undefined, year = 2026): string | null {
  if (!str) return null;
  const m = str.match(/^(\d{2})[./](\d{2})/);
  if (!m) return null;
  return `${year}-${m[1]}-${m[2]}`;
}

export function buildLateRegClose(
  regCloseTime: string | undefined,
  regCloseLevel: string | undefined
): string | null {
  const t = regCloseTime?.trim();
  const lv = regCloseLevel?.toString().trim();
  if (!t && !lv) return null;
  if (t && lv) return `${t} (Lv.${lv})`;
  if (t) return t;
  return null;
}

export function deriveIsMainEvent(t: any): boolean {
  return t.tab_name === "Main" || t.base_title === "Main Event";
}

export function deriveIsSatellite(t: any): boolean {
  if (typeof t.tab_name === "string" && t.tab_name.toLowerCase().startsWith("sate")) return true;
  if (typeof t.base_title === "string" && t.base_title.startsWith("(s")) return true;
  if (typeof t.event_title === "string" && t.event_title.includes("Satellite")) return true;
  return false;
}

export function deriveGameType(t: any, isSatellite: boolean): string {
  if (t.game_type) return t.game_type;
  if (isSatellite) return "SAT";
  return "";
}

export function transformStructure(
  rows: any[] | undefined,
  regCloseLevel: string | undefined
): TransformedStructure | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const levels: TransformedLevel[] = [];
  for (const row of rows) {
    const playMin =
      parseInt(row.play_minutes, 10) ||
      parseInt((row.minutes ?? "").split("/")[0], 10);
    const level: TransformedLevel = {
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
    day2EndLevel: null,
    levels,
  };
}

function transformPrize(p: any): { total: string | null; inPrize: string | null } | null {
  if (!p) return null;
  return { total: p.total || null, inPrize: p.in_prize || null };
}

function normalizeNotes(notes: string[] | undefined): string[] | null {
  if (!Array.isArray(notes) || notes.length === 0) return null;
  return notes;
}

function extractGames(games: any): string[] | null {
  if (!games || !Array.isArray(games.items) || games.items.length === 0) return null;
  return games.items;
}

// ---------------------------------------------------------------------------
// Main transformer
// ---------------------------------------------------------------------------

export function transformTournament(
  t: any,
  opts: { currentMultiDayMap?: Record<string, any>; year?: number } = {}
): TransformedEvent {
  const { currentMultiDayMap = {}, year = 2026 } = opts;

  const isMainEvent = deriveIsMainEvent(t);
  const isSatellite = deriveIsSatellite(t);
  const gameType = deriveGameType(t, isSatellite);
  const firstSchedule = t.schedules?.[0] || null;

  let eventNumber: string = t.number || "";
  if (!eventNumber) {
    const titleSrc: string = t.event_title || t.base_title || "";
    const satMatch = titleSrc.match(/^(\(s\d+\))/);
    const hashMatch = titleSrc.match(/^(#\d+)/);
    if (satMatch) eventNumber = satMatch[1];
    else if (hashMatch) eventNumber = hashMatch[1];
    else if (t.tab_name) eventNumber = t.tab_name;
  }

  const name =
    t.event_title?.replace(/^#\d+\s+/, "").replace(/^\(s\d+\)\s+/, "") ||
    t.base_title?.replace(/^\(s\d+\)\s+/, "") ||
    t.tab_name ||
    "";

  const { buyIn, buyInDisplay, feeDetail } = parseFeeLines(t.fee_chips?.fee_lines);

  return {
    eventNumber,
    name,
    gameType,
    date: firstSchedule ? parseDate(firstSchedule.start_date, year) : null,
    startTime: firstSchedule?.start_time || null,
    lateRegClose: firstSchedule
      ? buildLateRegClose(firstSchedule.reg_close_time, firstSchedule.reg_close_level)
      : null,
    lateRegLevel: firstSchedule?.reg_close_level
      ? parseInt(firstSchedule.reg_close_level, 10) || null
      : null,
    startingChips: parseChips(t.chips),
    buyIn,
    buyInDisplay,
    gtd: null,
    gtdDisplay: null,
    isMainEvent,
    isSatellite,
    reentry: t.re_entry_note?.trim() || null,
    day2Condition: t.day2_advance_note?.trim() || null,
    ruleNotes: null,
    structure: transformStructure(t.structure?.rows, firstSchedule?.reg_close_level),
    prize: transformPrize(t.prize),
    feeDetail,
    games: extractGames(t.games),
    bounty: null,
    notes: normalizeNotes(t.notes),
    award: null,
    multiDay: currentMultiDayMap[eventNumber] || null,
  };
}

function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dayObj = new Date(Date.UTC(y, m - 1, d));
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}/${d} ${weekdays[dayObj.getUTCDay()]}`;
}

export function transform(extract: any, currentData: any = null): TransformedData {
  const rawTournaments: any[] = (extract.tournaments || []).filter(
    (t: any) => t.category === "TOURNAMENT"
  );

  // sponsor variant dedup: 同じ number が複数あれば is_sponsor_variant: true を優先
  const byNumber = new Map<string, any>();
  for (const t of rawTournaments) {
    const key = t.number || `${t.tab_name}::${t.event_title}`;
    if (!byNumber.has(key)) {
      byNumber.set(key, t);
    } else {
      const existing = byNumber.get(key);
      if (!existing.is_sponsor_variant && t.is_sponsor_variant) {
        byNumber.set(key, t);
      }
    }
  }
  const tournaments = [...byNumber.values()];

  // multiDay merge map (現行 data.json の eventNumber → multiDay 値)
  const currentMultiDayMap: Record<string, any> = {};
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

  const events = tournaments.map((t) =>
    transformTournament(t, { currentMultiDayMap })
  );

  // 日別グルーピング
  const byDate: Record<string, TransformedEvent[]> = {};
  for (const e of events) {
    if (!e.date) continue;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const days: TransformedDay[] = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evts]) => ({
      date,
      dayLabel: formatDayLabel(date),
      events: evts.sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      ),
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
