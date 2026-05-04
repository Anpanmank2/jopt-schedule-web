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

import { EVENT_CONFIG } from "@/config/eventConfig";
import pdfOverrides from "@/data/pdf-overrides.json";

/** Photo タブで表示する外部リンク (Owner 指示 2026-04-28: event ごとに遷移先を override 可能に) */
export interface PhotoLink {
  /** 遷移先サービス名 (例: "Flickr" / "Instagram" / "X") */
  label: string;
  /** 完全 URL (target="_blank" で開く) */
  url: string;
}

export interface GameVariant {
  /** "FL" | "STUD" | "PL / NL" | "PL/NL" 等 (PDF Type 列の表記をそのまま) */
  type: string;
  /** transformer で完成形 string 化済み. 例: "-", "100", "- / 300" (PL/NL の SB/BB ante 形式) */
  ante: string;
  /** transformer で完成形 string 化済み. 例: "300 - 500" (FL の low/high), "200 - 500" (STUD bring-in/completion), "100 - 200" (PL/NL SB/BB). UI 側での再 format 禁止 (memory feedback_format_responsibility_split.md) */
  blinds: string;
}

export interface TransformedLevel {
  level?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  /** Stud event 用: Bring-in 額 (1st street の最低 bet) */
  bringIn?: number;
  /** Stud event 用: Completion 額 (Bring-in に対して complete bet するときの上限) */
  completion?: number;
  time: number;
  break?: boolean;
  /** rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) で 1 level 内に 2-3 game variant が並ぶ場合の variant 配列 */
  gameVariants?: GameVariant[];
}

export interface TransformedStructure {
  columns: string[];
  lateRegCloseAfterLevel: number | null;
  day2EndLevel: number | null;
  isMultiDay: boolean;
  /** Stud 系 (FL Stud / NL Seven Card Stud 等). UI で Bring-in/Completion 列を表示する */
  isStud?: boolean;
  /** rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等). UI で Lv./Type/Ante/Blinds/Min. の 5 列構造 + variant rowSpan で表示 */
  isMixRotation?: boolean;
  /** day1Turbo phase 用の break 位置 override。pdf-overrides.json で event 別に [Lv.X, Lv.Y] 配列で指定。
   *  指定が無い event は従来通り reg close level 直後 1 回だけ synthetic break (UI 側 fallback) */
  turboBreakAfterLevels?: number[];
  levels: TransformedLevel[];
}

export interface TransformedEvent {
  eventNumber: string;
  name: string;
  gameType: string;
  gameCategory: "Hold'em" | "Omaha" | "Other" | "Satellite";
  date: string;
  startTime: string;
  lateRegClose: string | null;
  lateRegLevel: number | null;
  startingChips: number | null;
  buyIn: number | null;
  buyInDisplay: string | null;
  gtd: number | null;
  gtdDisplay: string | null;
  isMainEvent: boolean;
  isSatellite: boolean;
  seatRatio: string | null;
  reentry: string | null;
  day2Condition: string | null;
  ruleNotes: string | null;
  structure: TransformedStructure | null;
  prize: {
    total: string | null;
    inPrize: string | null;
    satellitePrize: string | null;
    note: string | null;
    rankPrizes: { rank: string; description: string }[];
  } | null;
  feeDetail: string | null;
  /** card 用 短縮チケットエントリ表記 (例: "1 Ticket + ¥8,000"). チケット非対応 event は null */
  ticketEntry: string | null;
  games: string[] | null;
  bounty: { label: string; items: { rank: string; description: string }[] } | null;
  notes: string[] | null;
  award: AwardData | null;
  /** ジュニア event 等の「景品リスト」(Sheets master の Awards / Benefits 由来) */
  awards: { label: string; sections: { header: string; items: string[] }[] } | null;
  benefits: { label: string; sections: { header: string; items: string[] }[] } | null;
  sponsorship: { label: string; items: { rank: string; description: string }[] } | null;
  multiDay: Record<string, unknown> | null;
  stackPerRound: { label: string; rounds: string[] } | null;
  /** Photo タブの遷移先 manual override. 配列空 or null の場合は Flickr matching → 公式 fallback の順 */
  photoOverride: PhotoLink[] | null;
  /** ディレイ等で当日に開始時間が変更された旨を Card / Detail に赤字 ※注記表示する文言 (Owner 指示 2026-05-01) */
  delayNotice: string | null;
  /** Registration オープン時刻 (Card / Detail で Start の前段に表示). 通常は extract.json に source 無しで pdf-overrides.json 経由のみ (Owner 指示 2026-05-01) */
  regOpen: string | null;
  /** 早朝 (hour < 9) の event を前日 day group に backstep する page.tsx 営業日 grouping を skip する flag. 火災報知器ディレイ等で startTime が 23:00→00:00 跨日した event が前日 day section に shift してしまう副作用を回避するため (Owner 指示 2026-05-04) */
  skipPrevDayGrouping?: boolean;
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

/**
 * チケットエントリ表記を card 用に短縮整形 (Owner 指示 2026-04-26)。
 * 例: "1 JOPT Ticket + ¥8,000(including ¥727 consumption tax)" → "1 Ticket + ¥8,000"
 *     "3 JOPT Tickets + ¥8,000 (including ¥727 consumption tax)" → "3 Tickets + ¥8,000"
 * 消費税注記は detail 側 feeDetail で別途表示するため card では削除。
 */
function buildTicketEntry(line: string): string {
  // "JOPT " 部分を除去 (重複表現の冗長さを削減)、tax 注記カット
  return line
    .replace(/JOPT\s+/i, "")
    .replace(/\s*\(including[^)]*\)/i, "")
    .trim();
}

export function parseFeeLines(feeLines: string[] | undefined): {
  buyIn: number | null;
  buyInDisplay: string | null;
  feeDetail: string | null;
  ticketEntry: string | null;
} {
  if (!Array.isArray(feeLines) || feeLines.length === 0) {
    return { buyIn: null, buyInDisplay: null, feeDetail: null, ticketEntry: null };
  }
  const feeDetail = feeLines.join("\n");
  let buyIn: number | null = null;
  let buyInDisplay: string | null = null;
  let ticketEntry: string | null = null;
  for (const line of feeLines) {
    if (/JOPT\s+Ticket/i.test(line)) {
      // 最初に出現したチケットエントリ行を card 表示用に短縮形で保持
      if (ticketEntry === null) ticketEntry = buildTicketEntry(line);
      continue;
    }
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
  return { buyIn, buyInDisplay, feeDetail, ticketEntry };
}

export function parseDate(str: string | undefined, year = EVENT_CONFIG.year): string | null {
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

/**
 * gameCategory: 4 バケット (Hold'em / Omaha / Other / Satellite) に正規化。
 * Owner 指示 (2026-04-22 / 2026-05-02 修正):
 *  - NLH / ジュニア / STARS TABLE / title に "Hold'em" を含む → Hold'em
 *  - PLO / PLO8 のみ → Omaha (FLO は Other)
 *  - extract.json の game_type === "NL" は NLH 以外の NL variant
 *    (NL Stud / NL Draw / NL 2-7 / NL Archie 等) を指すため Other 扱い。
 *    "NL Super Hold'em" 等 Hold'em 系は title regex で先に救済する。
 *  - その他 (FL, FLO, MIX, PL, 10-Game MIX, Stud, HORSE 等) → Other
 *  - Satellite は最優先で Satellite カテゴリ
 */
export function deriveGameCategory(
  t: any,
  isSatellite: boolean,
  gameType: string
): "Hold'em" | "Omaha" | "Other" | "Satellite" {
  if (isSatellite) return "Satellite";
  const title = String(t.event_title || t.base_title || t.tab_name || "");
  if (/ジュニア|STARS\s*TABLE/i.test(title)) return "Hold'em";
  if (/NLH|Hold'?em/i.test(title)) return "Hold'em";
  const gt = gameType.trim();
  if (gt === "NLH") return "Hold'em";
  if (gt === "PLO" || gt === "PLO8") return "Omaha";
  return "Other";
}

/**
 * Sheets master の Awards / Benefits セクション (label + sections[{header, items}])
 * を取り込む。"0" や空文字は noise として filter (Sheets の merged cell や
 * 空行が "0" として export されるため)。ジュニア event 等で利用される。
 */
export function transformAwardsList(
  src: any
): { label: string; sections: { header: string; items: string[] }[] } | null {
  if (!src || typeof src !== "object") return null;
  const rawSections = Array.isArray(src.sections) ? src.sections : [];
  const cleanSections = rawSections
    .map((s: any) => ({
      header: typeof s?.header === "string" ? s.header : "",
      items: Array.isArray(s?.items)
        ? s.items.filter(
            (it: any) =>
              typeof it === "string" && it.trim() !== "" && it.trim() !== "0"
          )
        : [],
    }))
    .filter((s: { header: string; items: string[] }) => s.items.length > 0);
  if (cleanSections.length === 0) return null;
  return {
    label: typeof src.label === "string" && src.label.trim() ? src.label : "Awards",
    sections: cleanSections,
  };
}

/**
 * rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) の 1 variant の blinds を
 * PDF Players Guide 表記に揃えて完成形 string で返す.
 * - val1 / val2 はカンマ区切り済み生 string (extract.json の games[].val1 / val2)
 * - val2 が空文字の場合 (一部 STUD 系で 1 値しか持たない) は val1 のみ返す
 * UI 側での再 format は禁止 (memory feedback_format_responsibility_split.md).
 */
function formatRotationBlinds(val1: string | null | undefined, val2: string | null | undefined): string {
  const v1 = (val1 ?? "").trim();
  const v2 = (val2 ?? "").trim();
  if (!v1 && !v2) return "-";
  if (!v2) return v1;
  if (!v1) return v2;
  return `${v1} - ${v2}`;
}

export function transformStructure(
  rows: any[] | undefined,
  regCloseLevel: string | undefined,
  isMultiDay: boolean = false
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
    // FL Stud 用: raw_cols から Bring-in / Completion を抽出 (Owner 仕様 2026-04-25)
    // 判定 gate: row.cells に "Bring-in/Completion" key が存在する場合のみ。
    // NL Stud (cells が All Ante / Minutes) では raw_cols[5] に別 column のゴミ (chips
    // 等) が混入するため、cells key で FL Stud だけを限定する
    if (level.sb == null && level.bb == null && row.cells && Array.isArray(row.raw_cols)) {
      const cellKeys = Object.keys(row.cells);
      const isFlStudRow = cellKeys.includes("Bring-in/Completion");
      if (isFlStudRow) {
        const cols = row.raw_cols as string[];
        const bi = cols[2] ? parseInt(String(cols[2]).replace(/,/g, ""), 10) : NaN;
        const co = cols[5] ? parseInt(String(cols[5]).replace(/,/g, ""), 10) : NaN;
        if (Number.isFinite(bi)) level.bringIn = bi;
        if (Number.isFinite(co)) level.completion = co;
      }
    }
    // rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) の variant 抽出 (Owner 指示 2026-04-26):
    //   1 level 内に複数 game type (FL / STUD / PL / NL 等) が並ぶ MIX 系 event。
    //   row.games 配列に各 variant の {type, ante, val1, val2, minutes} が入っている。
    //   sb/bb/ante/bringIn が直下に無く games[] のみ持つ row が rotation level。
    //   level.time は最初の game の minutes (PDF 上 1 level 単位の duration)
    if (
      Array.isArray(row.games) &&
      row.games.length > 0 &&
      level.sb == null &&
      level.bb == null &&
      level.ante == null &&
      level.bringIn == null
    ) {
      const variants = (row.games as any[]).map((g) => ({
        type: String(g.type ?? "").trim(),
        ante: String(g.ante ?? "").trim() || "-",
        blinds: formatRotationBlinds(g.val1, g.val2),
      }));
      level.gameVariants = variants;
      // rotation row の Min. は最初の variant の minutes 列に記載 (PDF 仕様)。
      // 末尾の "*" (break marker) は parseInt で自然に剥がれる。
      if (level.time === 0 && row.games[0]?.minutes) {
        const m = parseInt(String(row.games[0].minutes), 10);
        if (Number.isFinite(m)) level.time = m;
      }
    }
    levels.push(level);
    if (row.break_after) {
      // JOPT 全 event break = 10 分固定 (Owner 確認 2026-04-26)。
      // 旧コードは secondary_minutes / minutes split[1] を break 時間と誤解釈していたが、
      // それらは Day 2+ play pace (例: '30*/20' の 20 = Day 2 短縮レベル時間) であり
      // break 時間ではない。#33 Colossus / #01 Main / #03 Mini Main / #71 Millions /
      // #145 PPC で Lv.X 後の break が誤って 20 分表示されていた問題を修正。
      levels.push({ break: true, time: 10 });
    }
  }
  // 健全性チェック (Owner 指示 2026-04-26):
  // Apps Script が FL/Stud/MIX/PLO Bombpot 系シートの blind/ante 列を抽出
  // 失敗した event (#12 #15 #31 #35 #46 #60 #68 #75 #86 #88 #108 #113 #116
  // #122 #131 #143 #148 #151 #162 #179 等) では rows に {level: N} のみが
  // 並び sb/bb/ante 全て空となり、UI で「Lv1 — — 0min」のような壊れた
  // テーブルが表示される。全 level で sb/bb/ante いずれも無い場合は
  // structure 自体を null にして UI 側で「Structure not available」と
  // 表示させる (Apps Script 側修正までの暫定対応)。
  const hasAnyBlindData = levels.some(
    (l) =>
      !l.break &&
      (l.sb != null ||
        l.bb != null ||
        l.ante != null ||
        l.bringIn != null ||
        (l.gameVariants && l.gameVariants.length > 0))
  );
  if (!hasAnyBlindData) return null;
  // 構造判定優先順:
  //   1. rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E.): gameVariants を持つ level が 1 つでも有り
  //      → 5 列 (Lv./Type/Ante/Blinds/Min.). UI で variant を rowSpan 描画
  //   2. FL Stud: sb/bb 全 null && bringIn or completion 存在 → 4 列 (Lv./Ante/Bring-in-Completion/Min.)
  //   3. NL Stud (ALL Ante): sb/bb 全 null && bringIn/completion 無し && ante 存在 → 3 列 (Lv./ALL Ante/Min.)
  //   4. 通常 Hold'em / PLO: 既存 4 列 (Lv./Blinds/BB Ante/Min.)
  // Owner 確認 2026-04-25 / 2026-04-26
  const nonBreak = levels.filter((l) => !l.break);
  const isMixRotation = nonBreak.some(
    (l) => l.gameVariants && l.gameVariants.length > 0
  );
  const allBlindsNull =
    nonBreak.length > 0 && nonBreak.every((l) => l.sb == null && l.bb == null);
  const hasStudLimits =
    nonBreak.some((l) => l.bringIn != null || l.completion != null);
  const hasAnte = nonBreak.some((l) => l.ante != null);
  const isFlStud = !isMixRotation && allBlindsNull && hasStudLimits;
  const isAllAnte = !isMixRotation && allBlindsNull && !hasStudLimits && hasAnte;
  const isStud = isFlStud || isAllAnte;
  const lateRegCloseAfterLevel = regCloseLevel
    ? parseInt(regCloseLevel, 10) || null
    : null;
  let columns: string[];
  if (isMixRotation) columns = ["Level", "Type", "Ante", "Blinds", "Minutes"];
  else if (isFlStud) columns = ["Level", "Ante", "Bring-in/Completion", "Minutes"];
  else if (isAllAnte) columns = ["Level", "ALL Ante", "Minutes"];
  else columns = ["Level", "Blinds", "BB Ante", "Minutes"];
  return {
    columns,
    lateRegCloseAfterLevel,
    day2EndLevel: null,
    isMultiDay,
    isStud,
    isMixRotation,
    levels,
  };
}

function transformPrize(
  p: any
): {
  total: string | null;
  inPrize: string | null;
  satellitePrize: string | null;
  note: string | null;
  rankPrizes: { rank: string; description: string }[];
} | null {
  if (!p) return null;
  let satellitePrize: string | null = null;
  const sat = Array.isArray(p.satellite_awards) ? p.satellite_awards[0] : null;
  if (sat && (sat.award || sat.target)) {
    const award = (sat.award || "").replace(/\s+/g, " ").trim();
    const target = (sat.target || "").replace(/\s+/g, " ").trim();
    satellitePrize = target ? `${award} - ${target}` : award;
  }
  // rank_prizes: 通常 event は未入力、ジュニア等は rank 別の豪華賞品リスト
  // (例: "1st: ・お食事券 40,000円分\n・図書カード ...")。description は
  // 改行区切りの箇条書きなので UI 側で whitespace-pre-wrap で表示する。
  const rankPrizes = Array.isArray(p.rank_prizes)
    ? p.rank_prizes
        .map((x: any) => ({
          rank: String(x.rank || "").trim(),
          description: String(x.description || "").trim(),
        }))
        .filter((x: { rank: string; description: string }) => x.rank && x.description)
    : [];
  return {
    total: p.total || null,
    inPrize: p.in_prize || null,
    satellitePrize,
    note: typeof p.note === "string" && p.note.trim() ? p.note.trim() : null,
    rankPrizes,
  };
}

/**
 * Bounty section を transformer 出力形式に整形。Sheets の Bounty 欄は rank/description
 * 型で sponsorship と同一構造のため、共通整形関数を流用せず専用関数に分離している
 * (将来 rank/description 以外の形式が来た時に拡張しやすい)。Owner 指示 2026-04-24。
 */
function transformBounty(
  b: any
): { label: string; items: { rank: string; description: string }[] } | null {
  if (!b) return null;
  const items = Array.isArray(b.items)
    ? b.items
        .map((it: any) => ({
          rank: String(it.rank || "").trim(),
          description: String(it.description || "").trim(),
        }))
        .filter((it: any) => it.rank || it.description)
    : [];
  if (items.length === 0) return null;
  return { label: (b.label || "Bounty").trim(), items };
}

function normalizeNotes(
  notes: string[] | undefined,
  eventTitle?: string,
): string[] | null {
  if (!Array.isArray(notes) || notes.length === 0) return null;
  // (s17) Flipout Satellite to Bounty Hunter は festival 内 NLH Bounty Hunter
  // 限定の Voucher。他 satellite (次回 JOPT Tokyo #02 まで使える generic voucher)
  // とは異なり、今大会の対象トーナメントでのみ使用可能が正。
  // Owner 指示 2026-04-30 (カスタマーチーム指摘)。Sheets master 反映待ち。
  const isS17 = !!eventTitle && /\(s17\)/.test(eventTitle);
  return notes.map((n) => {
    if (typeof n !== "string") return n;
    // 行頭の全角スペース (Ideographic Space U+3000) を除去。
    // 元データ (extract/legacy) でインデント目的に全角スペースが 1-2 個混入しており、
    // UI 上で 1 文字ぶん字下がりに見える違和感を除去する。Owner 指摘 2026-04-24。
    let out = n.replace(/^\u3000+/, "");
    // Satellite voucher 有効期限の文言を上流仕様に合わせる。
    // Owner 確認 2026-04-26 (カスタマーチーム指摘): プレイヤーズガイド表記「1 年」は誤り。
    if (isS17) {
      out = out.replace(
        /Voucherの有効期限は1年間です。JOPT\s*Tokyoでのみご使用いただけます。?/g,
        "取得した Voucher は今大会の対象トーナメントでのみご使用いただけます。",
      );
    } else {
      out = out.replace(
        /Voucherの有効期限は1年間です。JOPT\s*Tokyoでのみご使用いただけます。?/g,
        "取得した Voucher は次回 JOPT Tokyo #02 までご使用いただけます。JOPT Tokyo でのみご使用いただけます。",
      );
    }
    return out;
  });
}

/**
 * Satellite name の末尾 "at X/Y" から seat 付与率 (X/Y) を抽出。
 * 例: "Satellite to NLH Good Game 500 at 1/12" → "1/12"。
 * 1/12 は「12 エントリーにつき 1 Seat」の仕様。Owner 指示 2026-04-24。
 */
function extractSeatRatio(name: string | undefined, isSatellite: boolean): string | null {
  if (!isSatellite || !name) return null;
  const m = name.match(/at (\d+)\/(\d+)\b/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function extractGames(games: any): string[] | null {
  if (!games || !Array.isArray(games.items) || games.items.length === 0) return null;
  // Sheets セルが「1,FL 2-7 Triple Draw」「2,FL Badugi」のように先頭に順序番号
  // ("N,") を含む形式で入っている。UI に "1,FL ..." と表示されると違和感があるため
  // transformer 側で先頭の `数字,(空白)*` を除去する。Owner 指示 2026-04-24。
  //
  // さらに 2026-04-25: Sheets のセルズレで "1,000" 等の「数字とカンマのみ」の
  // ゴースト item が混入するケースがある (#46 / #131 で実例)。N, prefix 除去後の
  // 残りが空 or 数字のみなら item 自体を filter して UI 混乱を防ぐ。
  const normalized: string[] = games.items
    .map((g: any) =>
      typeof g === "string" ? g.replace(/^\s*\d+\s*,\s*/, "").trim() : g
    )
    .filter(
      (g: any) => typeof g === "string" && g.length > 0 && !/^[\d,\s]+$/.test(g)
    );
  return normalized.length > 0 ? normalized : null;
}

function transformSponsorship(
  sp: any
): { label: string; items: { rank: string; description: string }[] } | null {
  if (!sp) return null;
  const label: string = (sp.label || "").replace(/Sponsoredship/i, "Sponsorship").trim();
  const items = Array.isArray(sp.items)
    ? sp.items
        .map((it: any) => ({
          rank: String(it.rank || "").trim(),
          description: String(it.description || "").trim(),
        }))
        .filter((it: any) => it.rank || it.description)
    : [];
  if (!label && items.length === 0) return null;
  return { label: label || "Sponsorship", items };
}

function transformStackPerRound(spr: any): { label: string; rounds: string[] } | null {
  if (!spr) return null;
  const rounds: string[] = Array.isArray(spr.rounds) ? spr.rounds.filter((r: any) => typeof r === "string" && r.trim()) : [];
  if (rounds.length === 0) return null;
  return { label: spr.label?.trim() || "Stack Per Round", rounds };
}

export interface AwardSectionData {
  header: string;
  subsectionLeft: string;
  subsectionDay2: string;
  allDay1: { rank: string; prize: string }[];
  day2: { rank: string; prize: string }[];
  description: string;
}

export interface AwardData {
  chipLeader: AwardSectionData | null;
  sprinter: AwardSectionData | null;
  currencyNote: string | null;
}

function transformAwardSection(s: any): AwardSectionData | null {
  if (!s) return null;
  const pick = (arr: any): { rank: string; prize: string }[] =>
    Array.isArray(arr)
      ? arr
          .map((x: any) => ({ rank: (x.rank || "").trim(), prize: (x.prize || "").trim() }))
          .filter((x) => x.rank || x.prize)
      : [];
  const allDay1 = pick(s.all_day1);
  const day2 = pick(s.day2);
  const header = (s.header || "").trim();
  if (!header && allDay1.length === 0 && day2.length === 0) return null;
  return {
    header,
    subsectionLeft: (s.subsection_header_left || "").trim(),
    subsectionDay2: (s.subsection_header_day2 || "").trim(),
    allDay1,
    day2,
    description: (s.description || "").trim(),
  };
}

function transformAward(a: any): AwardData | null {
  if (!a) return null;
  const chipLeader = transformAwardSection(a.chip_leader);
  const sprinter = transformAwardSection(a.sprinter);
  // 2026-04-26 インシデント対応:
  // Sheets `award.currency_note` セルに Bounty event の notes 全文が
  // コピペされているケースがあり (#47 Knockout Legends / #164 Climax Bounty
  // 等)、chip_leader / sprinter が中身空 (header のみ) でも currency_note
  // だけ非空のため UI で「Award セクションに notes コピペ」が表示される
  // 障害が発生した。
  // 対策: chip/sprint 主要 section に中身がない event では currency_note も
  // ghost と判定して採用しない。Award の本来の意味から逸脱しない event のみ
  // currencyNote が表示される。
  const hasContent = (s: AwardSectionData | null) =>
    !!s && (s.allDay1.length > 0 || s.day2.length > 0 || s.description.trim().length > 0);
  const currencyNote =
    hasContent(chipLeader) || hasContent(sprinter)
      ? (a.currency_note || "").trim() || null
      : null;
  if (!chipLeader && !sprinter && !currencyNote) return null;
  return { chipLeader, sprinter, currencyNote };
}

// ---------------------------------------------------------------------------
// Main transformer
// ---------------------------------------------------------------------------

/**
 * 1 tournament → 1 entry (single day) or N entries (multi-day, schedules ごとに分離)
 * Owner 指示 (2026-04-21): Day ごと別 entry に展開 (Day 1A / Day 1B / Day 2 等を個別 event として表示)
 */
export function transformTournament(
  t: any,
  opts: { currentMultiDayMap?: Record<string, any>; year?: number } = {}
): TransformedEvent[] {
  const { currentMultiDayMap = {}, year = EVENT_CONFIG.year } = opts;

  // メタタブ skip (Owner 指示 2026-04-24): number 空の tab はテンプレート / 設定タブ
  // で event ではない (例: 2Day4Flight, アンティなし, FL&Stud, FL&NL, FL&PL/NL, PL/NL,
  // Stud, サテ)。schedules を持つと UI に紛れ込み 7/21 等のゴースト日付を生む。
  // 判定強化: event_title が空 / "#" placeholder / 日付のみ (例 "05.02 Sat.") の
  // いずれかなら metadata tab として早期 return。
  const titleStr = (t.event_title || t.base_title || "").trim();
  const isDateOnlyTitle = /^\d{1,2}\.\d{1,2}(\s+[A-Za-z]{3}\.?)?$/.test(titleStr);
  const isMetadataTab = !t.number && (!titleStr || titleStr === "#" || isDateOnlyTitle);
  if (isMetadataTab) return [];

  const isMainEvent = deriveIsMainEvent(t);
  const isSatellite = deriveIsSatellite(t);
  const gameType = deriveGameType(t, isSatellite);
  const gameCategory = deriveGameCategory(t, isSatellite, gameType);

  let eventNumber: string = t.number || "";
  if (!eventNumber) {
    const titleSrc: string = t.event_title || t.base_title || "";
    const satMatch = titleSrc.match(/^(\(s\d+\))/);
    const hashMatch = titleSrc.match(/^(#\d+)/);
    if (satMatch) eventNumber = satMatch[1];
    else if (hashMatch) eventNumber = hashMatch[1];
    else if (t.tab_name) eventNumber = t.tab_name;
  }

  const baseName =
    t.event_title?.replace(/^#\d+\s+/, "").replace(/^\(s\d+\)\s+/, "") ||
    t.base_title?.replace(/^\(s\d+\)\s+/, "") ||
    t.tab_name ||
    "";

  const { buyIn, buyInDisplay, feeDetail, ticketEntry } = parseFeeLines(t.fee_chips?.fee_lines);
  const schedules: any[] = Array.isArray(t.schedules) ? t.schedules : [];
  const multiDay = currentMultiDayMap[eventNumber] || null;

  // schedules 空なら 1 entry (date/startTime 空)
  if (schedules.length === 0) {
    return [
      {
        eventNumber,
        name: baseName,
        gameType,
        gameCategory,
        date: "",
        startTime: "",
        lateRegClose: null,
        lateRegLevel: null,
        startingChips: parseChips(t.chips),
        buyIn,
        buyInDisplay,
        gtd: null,
        gtdDisplay: null,
        isMainEvent,
        isSatellite,
        seatRatio: extractSeatRatio(baseName, isSatellite),
        reentry: t.re_entry_note?.trim() || null,
        day2Condition: t.day2_advance_note?.trim() || null,
        ruleNotes: null,
        structure: transformStructure(
          t.structure?.rows,
          undefined,
          !!t.is_multi_day
        ),
        prize: transformPrize(t.prize),
        feeDetail,
        ticketEntry,
        games: extractGames(t.games),
        bounty: transformBounty(t.bounty),
        notes: normalizeNotes(t.notes, t.event_title),
        award: transformAward(t.award),
        awards: transformAwardsList(t.awards),
        benefits: transformAwardsList(t.benefits),
        sponsorship: transformSponsorship(t.sponsorship),
        multiDay,
        stackPerRound: transformStackPerRound(t.stack_per_round),
        photoOverride: null,
        delayNotice: null,
        regOpen: null,
      },
    ];
  }

  // schedules 複数 → 各 Day を個別 entry に展開
  // schedules 1件 → 1 entry (従来通り、name に Day suffix 無し)
  return schedules.map((sched) => {
    const isMultiDay = schedules.length > 1;
    const dayLabel = sched.day_name?.trim() || "";
    const displayName = isMultiDay && dayLabel ? `${baseName} / ${dayLabel}` : baseName;
    // Day 2 / Day 3 etc. は Day 1 通過者の継続 day。
    // 新規エントリは受け付けないため fee / ticket / buyIn は表示しない (Owner 指示 2026-04-26)
    const isContinuationDay = /^Day\s*[2-9]/i.test(dayLabel);

    return {
      eventNumber,
      name: displayName,
      gameType,
      gameCategory,
      date: parseDate(sched.start_date, year) ?? "",
      startTime: sched.start_time || "",
      lateRegClose: buildLateRegClose(sched.reg_close_time, sched.reg_close_level),
      lateRegLevel: sched.reg_close_level
        ? parseInt(sched.reg_close_level, 10) || null
        : null,
      startingChips: parseChips(t.chips),
      buyIn: isContinuationDay ? null : buyIn,
      buyInDisplay: isContinuationDay ? null : buyInDisplay,
      gtd: null,
      gtdDisplay: null,
      isMainEvent,
      isSatellite,
      seatRatio: extractSeatRatio(baseName, isSatellite),
      reentry: t.re_entry_note?.trim() || null,
      day2Condition: t.day2_advance_note?.trim() || null,
      ruleNotes: null,
      structure: transformStructure(
        t.structure?.rows,
        sched.reg_close_level,
        isMultiDay || !!t.is_multi_day
      ),
      prize: transformPrize(t.prize),
      feeDetail: isContinuationDay ? null : feeDetail,
      ticketEntry: isContinuationDay ? null : ticketEntry,
      games: extractGames(t.games),
      bounty: transformBounty(t.bounty),
      notes: normalizeNotes(t.notes, t.event_title),
      award: transformAward(t.award),
      awards: transformAwardsList(t.awards),
      benefits: transformAwardsList(t.benefits),
      sponsorship: transformSponsorship(t.sponsorship),
      multiDay,
      stackPerRound: transformStackPerRound(t.stack_per_round),
      photoOverride: null,
      delayNotice: null,
      regOpen: null,
    };
  });
}

function formatDayLabel(isoDate: string): string {
  // weekday は UI 側 (page.tsx) で locale 別 Intl.DateTimeFormat により表示する。
  // transformer は month/day のみ生成し locale 非依存に保つ。
  const [, m, d] = isoDate.split("-").map(Number);
  return `${m}/${d}`;
}

/**
 * 同じ eventNumber を持つ tournament 群 (例: #01 の tab:Main + tab:2Day4Flight) を 1 つに merge:
 *  - structure.rows: 多い方を採用 (display に必要な full blind structure を失わない)
 *  - schedules:      多い方を採用 (全 Day を失わない)
 *  - fee_chips:      空でない方を採用
 *  - sponsor_variant: true を優先 (冠スポンサー名を保つ)
 *  - その他フィールド: 優先 entry からコピー、欠けていれば他 entry で補完
 */
function mergeTournamentsSameNumber(group: any[]): any {
  if (group.length === 1) return group[0];
  // primary: sponsor_variant 優先 → 先頭採用
  const primary =
    group.find((t) => t.is_sponsor_variant) || group[0];
  const longestStructure = group.reduce((best, t) =>
    (t.structure?.rows?.length ?? 0) > (best.structure?.rows?.length ?? 0) ? t : best,
    group[0]
  );
  const longestSchedules = group.reduce((best, t) =>
    (t.schedules?.length ?? 0) > (best.schedules?.length ?? 0) ? t : best,
    group[0]
  );
  const hasFee = group.find((t) => t.fee_chips?.fee_lines?.length);
  return {
    ...primary,
    structure: longestStructure.structure ?? primary.structure,
    schedules: longestSchedules.schedules ?? primary.schedules,
    fee_chips: hasFee?.fee_chips ?? primary.fee_chips,
    notes: primary.notes?.length ? primary.notes : (group.find((t) => t.notes?.length)?.notes ?? primary.notes),
  };
}

export function transform(extract: any, currentData: any = null): TransformedData {
  const rawTournaments: any[] = (extract.tournaments || []).filter(
    (t: any) => t.category === "TOURNAMENT"
  );

  // 同一 number の entry 群を merge (sponsor variant + 2Day4Flight 等をデータ結合)
  const grouped = new Map<string, any[]>();
  for (const t of rawTournaments) {
    const key = t.number || `${t.tab_name}::${t.event_title}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }
  const tournaments = [...grouped.values()].map(mergeTournamentsSameNumber);

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

  // 各 tournament を 1〜N entry に展開 (multi-day は Day ごと)
  const events: TransformedEvent[] = tournaments.flatMap((t) =>
    transformTournament(t, { currentMultiDayMap })
  );

  // Legacy fallback: extract.json 側で structure / notes / lateRegClose が欠落している event に対して
  // currentData(jopt_gf2026_data.json) の対応フィールドを採用する。
  // 根本解決は Apps Script 側 (Day 2 anchor 検出 / extractNotes の入れ子対応 / reg_close_time extraction) だが、
  // GF Day 1 まで時間が無いため transformer 側で暫定 post-processing する。
  // 条件: legacy の値 > 現 transformer 出力の値 (欠落 null) の場合のみ legacy を採用
  if (Array.isArray(currentData?.days)) {
    const legacyStructure = new Map<string, TransformedStructure>();
    const legacyNotes = new Map<string, string[]>();
    // lateRegClose は (eventNumber, startTime) をキーにする (multi-flight 対応)
    const legacyLateRegClose = new Map<string, { lateRegClose: string; lateRegLevel: number | null }>();
    for (const d of currentData.days) {
      for (const e of d.events || []) {
        if (!e.eventNumber) continue;
        // structure (non-break level 数が最大のものを保持)
        if (Array.isArray(e.structure?.levels) && e.structure.levels.length) {
          const nonBreakCount = e.structure.levels.filter(
            (l: any) => !l.break
          ).length;
          const existing = legacyStructure.get(e.eventNumber);
          const existingCount = existing
            ? existing.levels.filter((l: any) => !l.break).length
            : 0;
          if (!existing || nonBreakCount > existingCount) {
            legacyStructure.set(e.eventNumber, e.structure);
          }
        }
        // notes (件数が最大のものを保持)
        if (Array.isArray(e.notes) && e.notes.length) {
          const existing = legacyNotes.get(e.eventNumber);
          if (!existing || e.notes.length > existing.length) {
            legacyNotes.set(e.eventNumber, e.notes);
          }
        }
        // lateRegClose (eventNumber + startTime がキー)
        if (typeof e.lateRegClose === "string" && e.lateRegClose.trim()) {
          const key = `${e.eventNumber}@${e.startTime || ""}`;
          legacyLateRegClose.set(key, {
            lateRegClose: e.lateRegClose,
            lateRegLevel: e.lateRegLevel ?? null,
          });
        }
      }
    }
    for (const e of events) {
      // structure fallback
      const legacyStr = legacyStructure.get(e.eventNumber);
      if (legacyStr) {
        const cur = e.structure;
        const curCount = cur
          ? cur.levels.filter((l: any) => !l.break).length
          : 0;
        const legCount = legacyStr.levels.filter((l: any) => !l.break).length;
        // Stud event (FL Stud / NL Stud) と rotation MIX (HORSE / B.E.A.S.T. /
        // T.O.R.S.E. / 8-Game / 10-Game / Triple Draw 等) は transformer が
        // raw_cols / games[] から正しく抽出しているため legacy fallback で
        // 上書きしない (Owner 確認 2026-04-25 / 2026-04-26)。legacy data.json は
        // Hold'em 用の sb/bb/ante しか持たないため上書きすると Stud / rotation
        // の列表記が壊れる。
        if (legCount > curCount && !cur?.isStud && !cur?.isMixRotation) {
          e.structure = {
            ...legacyStr,
            lateRegCloseAfterLevel:
              cur?.lateRegCloseAfterLevel ?? legacyStr.lateRegCloseAfterLevel ?? null,
            // legacy data.json 側には isMultiDay フィールドが無いので、
            // multiDay 情報有無 / day2EndLevel 有無から判定して保持
            isMultiDay:
              cur?.isMultiDay ??
              !!(
                legacyStr.day2EndLevel != null ||
                currentData?.meta?.multiDayEvents?.[e.eventNumber]?.day2StartLevel != null
              ),
          };
        }
      }
      // notes の legacy fallback は撤去 (2026-04-26 インシデント対応):
      // 2026-04-09 snapshot の jopt_gf2026_data.json には現仕様と乖離した notes
      // (例: #141 PLO Hi/Lo 8 or better に「・最大7maxで進行します。」が含まれる
      // が現 Sheets には無い) が残っており、件数比較で legacy を採用すると
      // 本番に誤情報が混入する。lateRegClose と同じ理由で削除。
      // 正しい notes は extract.json (Sheets 由来) のみを source of truth とする。
      // memory: feedback_legacy_fallback_risk.md
      void legacyNotes;
      // lateRegClose の legacy fallback は撤去 (Owner 指示 2026-04-23):
      // legacy data.json は 2026-04-09 snapshot で誤値が残っている。
      // extract null のとき legacy を持ち上げると誤値が表示されるため撤去。
      // 正しい値は PDF override (下記) or extract から供給される。
      // 参考: 以前の実装は #07 PLO HU を 20:10、#62 3on3 を 20:20 として復元していたが、
      // Owner により両方とも誤値と判明。
      void legacyLateRegClose;
      // day2EndLevel enrichment: meta.multiDayEvents から structure へ流す
      // (EventDetail.tsx の isDay2End は structure.day2EndLevel を参照する)
      if (e.structure && e.structure.day2EndLevel == null) {
        const mde = currentData?.meta?.multiDayEvents?.[e.eventNumber];
        if (mde?.day2EndLevel != null) {
          e.structure = { ...e.structure, day2EndLevel: mde.day2EndLevel };
        }
      }
    }
  }

  // PDF override 適用 (Owner 指示 2026-04-23):
  // src/data/pdf-overrides.json に転記した正式 PDF 値 (structure / reg close) を
  // extract/legacy より優先して event に反映。Sheets 側の誤値や Day 2 未登録を上書き。
  const pdfEvents: Record<string, any> = (pdfOverrides as any).events || {};
  for (const e of events) {
    const ov = pdfEvents[e.eventNumber];
    if (!ov) continue;
    // structure override (Day 1+2 通しの levels)
    if (ov.structure && Array.isArray(ov.structure.levels)) {
      e.structure = {
        columns: ov.structure.columns || ["Level", "Blinds", "BB Ante", "Minutes"],
        lateRegCloseAfterLevel: ov.structure.lateRegCloseAfterLevel ?? null,
        day2EndLevel: ov.structure.day2EndLevel ?? null,
        isMultiDay: true,
        levels: ov.structure.levels,
        ...(Array.isArray(ov.structure.turboBreakAfterLevels) &&
        ov.structure.turboBreakAfterLevels.length > 0
          ? { turboBreakAfterLevels: ov.structure.turboBreakAfterLevels.slice() }
          : {}),
      };
    }
    // notes override (extract 側 source data が他 event の notes と混線した場合の復元)
    if (Array.isArray(ov.notes)) {
      e.notes = ov.notes.slice();
    }
    // single-event 用 reg close 直接 override (flight 無 event 例: #07 PLO Heads-up)
    // approx: true 指定時は "HH:MM ごろ (Lv.N)" 形式で曖昧表記 (Owner 指示 2026-05-04 火災報知器対応)
    if (ov.regClose && typeof ov.regClose === "object") {
      const rc = ov.regClose as { time?: string; level?: number | null; approx?: boolean };
      if (rc.time) {
        e.lateRegClose = rc.approx
          ? `${rc.time} ごろ${rc.level != null ? ` (Lv.${rc.level})` : ""}`
          : buildLateRegClose(rc.time, rc.level != null ? String(rc.level) : "");
        e.lateRegLevel = rc.level ?? null;
      }
    }
    // reg close override (flight suffix で dispatch)
    const flightMatch = (e.name || "").match(/\/\s*(Day\s*\d+[A-Z]?(?:\s*Turbo)?|Day\s*\d+)\s*$/i);
    const flightKey = flightMatch ? flightMatch[1].trim() : null;
    if (ov.regCloseByFlight && typeof ov.regCloseByFlight === "object") {
      if (flightKey && flightKey in ov.regCloseByFlight) {
        const rc = ov.regCloseByFlight[flightKey];
        if (rc && typeof rc === "object") {
          const rcA = rc as { time: string; level?: number | null; approx?: boolean };
          e.lateRegClose = rcA.approx
            ? `${rcA.time} ごろ${rcA.level != null ? ` (Lv.${rcA.level})` : ""}`
            : buildLateRegClose(rc.time, rc.level != null ? String(rc.level) : "");
          e.lateRegLevel = rc.level ?? null;
          // StructureTable の CLOSE バッジは structure.lateRegCloseAfterLevel を見るため
          // flight 別に structure を clone して上書き (Owner 確認 2026-04-25)
          if (rc.level != null && e.structure) {
            e.structure = { ...e.structure, lateRegCloseAfterLevel: rc.level };
          }
        } else if (rc === null) {
          e.lateRegClose = null;
          e.lateRegLevel = null;
          if (e.structure) {
            e.structure = { ...e.structure, lateRegCloseAfterLevel: null };
          }
        }
      }
    }
    // startTime override (flight suffix で dispatch, Owner 指示 2026-04-29):
    // extract.json (Sheets master) の start_time が誤りの場合に PDF 由来の正値で上書き。
    // 例: #33 Colossus Day 2 を 13:30 → 14:00 に訂正。Sheets master 訂正と extract.json
    // re-sync が反映されるまでの暫定 override。
    if (ov.startTimeByFlight && typeof ov.startTimeByFlight === "object") {
      if (flightKey && flightKey in ov.startTimeByFlight) {
        const newStart = ov.startTimeByFlight[flightKey];
        if (typeof newStart === "string" && newStart.trim()) {
          e.startTime = newStart.trim();
        }
      }
    }
    // single-flight startTime override (Owner 指示 2026-05-01):
    // single-day event の Start 時刻を直接上書き。例: #109 21:00 → 22:00。
    // delayNotice と組合せて使うことで「ディレイにより開始時間変更」を Card / Detail に
    // 赤字 ※ 注記表示する。
    if (typeof ov.startTime === "string" && ov.startTime.trim()) {
      e.startTime = ov.startTime.trim();
    }
    // delayNotice override (Owner 指示 2026-05-01):
    // Card / Detail の Start 時刻直下に赤字 ※ で表示する遅延注記。
    if (typeof ov.delayNotice === "string" && ov.delayNotice.trim()) {
      e.delayNotice = ov.delayNotice.trim();
    }
    // delayNoticeByFlight (Owner 指示 2026-05-04 火災報知器対応):
    // multi-day で flight 別に異なる delayNotice 文言を出す。global delayNotice より優先。
    // 指定 flight に該当しない (or null) なら delayNotice 非表示。
    // 例: #01 Day 1A-D / Day 2 は注記なし、Day 3 のみ注記、または #145 Day 1A は
    // 「受付締切のみ変更」、Day 1B/C/D は「スケジュール変更」で文言を分ける。
    if (ov.delayNoticeByFlight && typeof ov.delayNoticeByFlight === "object") {
      if (flightKey && flightKey in ov.delayNoticeByFlight) {
        const dn = ov.delayNoticeByFlight[flightKey];
        e.delayNotice = (typeof dn === "string" && dn.trim()) ? dn.trim() : null;
      } else {
        e.delayNotice = null;
      }
    }
    // regOpen override (Owner 指示 2026-05-01):
    // Registration オープン時刻 (Start の前段表示用)。extract.json に source 無し
    // のため pdf-overrides.json で個別指定する。例: #109 Reg.Open 21:45。
    if (typeof ov.regOpen === "string" && ov.regOpen.trim()) {
      e.regOpen = ov.regOpen.trim();
    }
    // skipPrevDayGrouping override (Owner 指示 2026-05-04 火災報知器対応):
    // 早朝 (hour < 9) の event を前日 day group に backstep する page.tsx の営業日
    // grouping を skip する flag。火災報知器ディレイで #156 startTime 23:00→00:00
    // 跨日した結果、UI 上 5/3 day section に shift してしまった副作用回避。
    // true 指定 event は startTime が深夜でも自分の date の day group に固定表示。
    if (ov.skipPrevDayGrouping === true) {
      e.skipPrevDayGrouping = true;
    }
    // award override (Owner 指示 2026-04-25): Apps Script の sprinter 抽出漏れ
    // に対する手動上書き。chipLeader / sprinter / currencyNote を section 別に
    // partial merge する。camelCase (transformer 後の形) で記述することに注意。
    if (ov.award && typeof ov.award === "object") {
      const cur = e.award || { chipLeader: null, sprinter: null, currencyNote: null };
      if (ov.award.chipLeader !== undefined) cur.chipLeader = ov.award.chipLeader;
      if (ov.award.sprinter !== undefined) cur.sprinter = ov.award.sprinter;
      if (ov.award.currencyNote !== undefined) cur.currencyNote = ov.award.currencyNote;
      e.award = cur;
    }
    // sponsorship override (Owner 指示 2026-04-30): Apps Script の Sponsoredship 抽出が
    // 1st のみ / 短縮文言になる場合に正規 prize description (コラボグッズ込み等) を
    // PDF / Owner 提供画像から手動上書き。例: #30 VITAS / #84 BURGER KING Whopper Stack
    if (ov.sponsorship && typeof ov.sponsorship === "object" && Array.isArray(ov.sponsorship.items)) {
      e.sponsorship = {
        label: typeof ov.sponsorship.label === "string" && ov.sponsorship.label.trim()
          ? ov.sponsorship.label
          : (e.sponsorship?.label ?? "Sponsorship"),
        items: ov.sponsorship.items.map((it: any) => ({
          rank: String(it.rank ?? "").trim(),
          description: String(it.description ?? "").trim(),
        })),
      };
    }
    // photoOverride (Owner 指示 2026-04-28): event ごとに Photo タブ遷移先 URL を直接指定。
    // 単一 object も配列も受け付ける。何も指定がなければ null のまま (Flickr matching に委譲)。
    if (ov.photoOverride !== undefined && ov.photoOverride !== null) {
      const raw = ov.photoOverride;
      const arr = Array.isArray(raw) ? raw : [raw];
      const links: PhotoLink[] = arr
        .filter((x: any) => x && typeof x.url === "string" && x.url.trim())
        .map((x: any) => ({
          label: typeof x.label === "string" && x.label.trim() ? x.label.trim() : "Flickr",
          url: x.url.trim(),
        }));
      if (links.length > 0) e.photoOverride = links;
    }

    // turbo flight override (Owner 指示 2026-04-26): Day 1D Turbo 等の特殊 flight が
    // 同じ structure を共有しつつ「特定 level から開始」「level time 短縮」する場合の
    // 上書き。例: #03 Mini Main の Day 1D Turbo は Lv.4 開始 / 各 level 20 分
    // (Sheets master notes に記載されているが extract.json には structure に
    // 反映されないため override で対応)。
    if (ov.turboFlight && typeof ov.turboFlight === "object" && e.structure) {
      const tf = ov.turboFlight as {
        matchSuffix?: string;
        startLevel?: number;
        levelTime?: number;
      };
      if (
        typeof tf.matchSuffix === "string" &&
        (e.name || "").endsWith(tf.matchSuffix) &&
        Array.isArray(e.structure.levels)
      ) {
        const startLv = tf.startLevel;
        const startIdx =
          startLv != null
            ? e.structure.levels.findIndex((l) => l.level === startLv)
            : -1;
        const sliced = startIdx > 0 ? e.structure.levels.slice(startIdx) : e.structure.levels;
        e.structure = {
          ...e.structure,
          levels: sliced.map((l) =>
            l.break || tf.levelTime == null ? l : { ...l, time: tf.levelTime }
          ),
        };
      }
    }
  }

  // Re-entry / Day2Condition と Notes の重複除去 (Owner 指示 2026-04-24):
  // Sheets の `re_entry_note` / `day2_advance_note` と `notes` に同一文字列が両方
  // 入っている event (Tag Team / Main / Mini Main 等) で UI で 2 重表示されていた
  // 問題を解消。補足 field 側を null にして notes を唯一の出典とする。
  for (const e of events) {
    if (e.reentry && Array.isArray(e.notes) && e.notes.includes(e.reentry)) {
      e.reentry = null;
    }
    if (e.day2Condition && Array.isArray(e.notes) && e.notes.includes(e.day2Condition)) {
      e.day2Condition = null;
    }
  }

  // 単日トーナメント: structure を 30 non-break level + その間に挟まる break で slice
  // Owner 指示 (2026-04-22): ペルソナは JOPT 顧客、単日は 30 levels までで十分
  // Multi-day は phase filter (Day 1/2/3) で既に区切られているため対象外
  const SINGLE_DAY_LEVEL_CAP = EVENT_CONFIG.SINGLE_DAY_LEVEL_CAP;
  for (const e of events) {
    if (!e.structure || e.structure.isMultiDay) continue;
    const levels = e.structure.levels;
    let nonBreakCount = 0;
    let cutIdx = levels.length;
    for (let i = 0; i < levels.length; i++) {
      if (!levels[i].break) nonBreakCount++;
      if (nonBreakCount > SINGLE_DAY_LEVEL_CAP) {
        cutIdx = i;
        break;
      }
    }
    // 末尾 break 行は削ぎ落とす (視覚的に break で終わるのは不自然)
    while (cutIdx > 0 && levels[cutIdx - 1]?.break) cutIdx--;
    if (cutIdx < levels.length) {
      e.structure = { ...e.structure, levels: levels.slice(0, cutIdx) };
    }
  }

  // extraEvents inject (緊急 event 追加用、Sheets master 再 extract 反映待ち):
  // pdf-overrides.json の "extraEvents" 配列を読み込み、events に push する。
  // templateFromName が指定された場合、既存 event を find して structure /
  // startingChips / notes / prize / feeDetail / reentry を継承する。
  // 個別 field は extra 側で override 可能。
  const extraEvents = (pdfOverrides as any).extraEvents;
  if (Array.isArray(extraEvents)) {
    for (const extra of extraEvents) {
      if (!extra || typeof extra !== "object") continue;
      let template: TransformedEvent | undefined;
      if (typeof extra.templateFromName === "string") {
        const escaped = extra.templateFromName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        template = events.find((ev) => new RegExp(escaped).test(ev.name));
      }
      const buyIn = typeof extra.buyIn === "number" ? extra.buyIn : null;
      events.push({
        eventNumber: extra.eventNumber || "",
        name: extra.name || "",
        gameType: extra.gameType ?? template?.gameType ?? "SAT",
        gameCategory: extra.gameCategory ?? template?.gameCategory ?? "Satellite",
        date: extra.date || "",
        startTime: extra.startTime || "",
        lateRegClose: extra.lateRegClose ?? null,
        lateRegLevel: extra.lateRegLevel ?? null,
        startingChips: extra.startingChips ?? template?.startingChips ?? null,
        buyIn,
        buyInDisplay:
          extra.buyInDisplay ??
          (buyIn != null ? `¥${buyIn.toLocaleString()}` : null),
        gtd: extra.gtd ?? null,
        gtdDisplay: extra.gtdDisplay ?? null,
        isMainEvent: !!extra.isMainEvent,
        isSatellite: extra.isSatellite ?? true,
        seatRatio: extra.seatRatio ?? template?.seatRatio ?? null,
        reentry: extra.reentry ?? template?.reentry ?? null,
        day2Condition: extra.day2Condition ?? null,
        ruleNotes: extra.ruleNotes ?? null,
        structure: extra.structure ?? template?.structure ?? null,
        prize: extra.prize ?? template?.prize ?? null,
        feeDetail: extra.feeDetail ?? template?.feeDetail ?? null,
        ticketEntry: extra.ticketEntry ?? template?.ticketEntry ?? null,
        games: extra.games ?? null,
        bounty: extra.bounty ?? null,
        notes: extra.notes ?? template?.notes ?? null,
        award: extra.award ?? null,
        awards: extra.awards ?? null,
        benefits: extra.benefits ?? null,
        sponsorship: extra.sponsorship ?? null,
        multiDay: extra.multiDay ?? null,
        stackPerRound: extra.stackPerRound ?? null,
        photoOverride: null,
        delayNotice: null,
        regOpen: extra.regOpen ?? null,
      });
    }
  }

  // 日別グルーピング
  const byDate: Record<string, TransformedEvent[]> = {};
  for (const e of events) {
    if (!e.date) continue;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  // 同一 startTime 内の sort 規則 (Owner 決定 2026-04-22):
  //   1. Main (#NN)      ← 先頭、eventNumber 昇順
  //   2. Satellite (sNN)  ← 次、eventNumber 昇順
  //   3. 特殊 (ジュニア等) ← 最後、名前順
  // categoryOrd: カテゴリ [0=Main, 1=Satellite, 2=Special], 内部順 [eventNumber 数値 or 0]
  const eventSortKey = (en: string): [number, number] => {
    const mHash = en.match(/^#(\d+)$/);
    if (mHash) return [0, parseInt(mHash[1], 10)];
    const mSat = en.match(/^\(s(\d+)\)$/);
    if (mSat) return [1, parseInt(mSat[1], 10)];
    return [2, Number.MAX_SAFE_INTEGER];
  };
  const days: TransformedDay[] = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, evts]) => ({
      date,
      dayLabel: formatDayLabel(date),
      events: evts.sort((a, b) => {
        const t = (a.startTime || "").localeCompare(b.startTime || "");
        if (t !== 0) return t;
        const [ca, oa] = eventSortKey(a.eventNumber);
        const [cb, ob] = eventSortKey(b.eventNumber);
        if (ca !== cb) return ca - cb;
        if (oa !== ob) return oa - ob;
        return (a.eventNumber || "").localeCompare(b.eventNumber || "");
      }),
    }));

  return {
    meta: {
      eventName: extract.event?.eventName || EVENT_CONFIG.eventName,
      venue: EVENT_CONFIG.venue,
      totalEvents: events.length,
      extractedAt: extract.event?.extracted_at || new Date().toISOString(),
      source: "extract.json transformer (feature/backend-split)",
    },
    days,
  };
}
