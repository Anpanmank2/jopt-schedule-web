"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhotoPanel from "./PhotoPanel";
import { EVENT_CONFIG } from "@/config/eventConfig";
import structurePdfManifest from "@/data/structure-pdf-manifest.json";
import { localizeText, localizeArray } from "@/lib/i18n-data";

// rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) で
// 上流 Apps Script の blind/minutes 抽出が不完全な event は PDF Players Guide を
// PNG 画像化して直接表示する (Owner 指示 2026-04-26)。
// 値: 各 event の page 数 (1 PDF = 1-3 page)。
// 画像: public/structure-pdfs/{eventNumber}-p{page}.png (例: 46-p1.png, 46-p2.png, 46-p3.png)
// manifest 更新は scripts/convert-structure-pdfs.mjs を再実行 (PDF 追加/差替時)
const STRUCTURE_PDF_PAGES = structurePdfManifest as Record<string, number>;

export interface GameVariant {
  /** "FL" | "STUD" | "PL / NL" | "PL/NL" 等 */
  type: string;
  /** transformer で完成形 string 化済み (例: "-", "100", "- / 300") */
  ante: string;
  /** transformer で完成形 string 化済み (例: "300 - 500", "100 - 200")。UI 側での再 format 禁止 */
  blinds: string;
}

export interface Level {
  level?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  /** Stud event 用: Bring-in 額 */
  bringIn?: number;
  /** Stud event 用: Completion 額 */
  completion?: number;
  time: number;
  break?: boolean;
  /** rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) で 1 level 内に複数 game variant が並ぶ場合の variant 配列 */
  gameVariants?: GameVariant[];
}

export interface Structure {
  columns: string[];
  lateRegCloseAfterLevel: number | null;
  day2EndLevel: number | null;
  isMultiDay?: boolean;
  /** Stud 系 (FL Stud / NL Seven Card Stud 等). UI で Bring-in/Completion 列を表示 */
  isStud?: boolean;
  /** rotation game (MIX / HORSE 等). UI で Lv./Type/Ante/Blinds/Min. の 5 列構造 + variant rowSpan で表示 */
  isMixRotation?: boolean;
  /** day1Turbo phase 用の break 位置 override (Lv.X 後に break)。pdf-overrides.json で event 別に指定。
   *  指定が無い event は従来通り reg close level 直後 1 回だけ synthetic break (Owner 仕様 v2.6.5)。 */
  turboBreakAfterLevels?: number[];
  levels: Level[];
}

export interface Prize {
  total: string | null;
  inPrize: string | null;
  satellitePrize?: string | null;
  note?: string | null;
  rankPrizes?: { rank: string; description: string }[];
}

export interface AwardEntry {
  rank: string;
  prize: string;
}

export interface AwardSection {
  header: string;
  subsectionLeft: string;
  subsectionDay2: string;
  allDay1: AwardEntry[];
  day2: AwardEntry[];
  description: string;
}

export interface AwardData {
  chipLeader: AwardSection | null;
  sprinter: AwardSection | null;
  currencyNote: string | null;
}

// Legacy flat-list form (existing data.json). Kept for backward compat but
// new transformer output uses AwardData instead.
export interface Award {
  rank: string;
  amount: string;
}

export interface MultiDayInfo {
  day1EndLevel?: number | null;
  day1EndBlinds?: string | null;
  day2StartLevel?: number | null;
  day2StartBlinds?: string | null;
  day2LevelTime?: number | null;
  day2EndLevel?: number | null;
  day2EndBlinds?: string | null;
  day2RestartNote?: string | null;
  day3StartLevel?: number | null;
  day3StartBlinds?: string | null;
  day3LevelTime?: number | null;
  /**
   * Day 1 Turbo flight (例: Day 1F Turbo) の特殊仕様。
   * transformer が legacy data の event-level multiDay (nested) からそのまま渡す。
   * 旧 flat 表現 (`day1TurboLabel`, `day1TurboStartLevel` 等) は API から廃止済 (2026-04-25)。
   */
  turbo?: {
    label?: string | null;
    startLevel?: number | null;
    levelTime?: number | null;
    endLevel?: number | null;
    endBlinds?: string | null;
    endCondition?: string | null;
  } | null;
  totalLevels?: number | null;
}

export interface PhotoLink {
  label: string;
  url: string;
}

export interface EventData {
  eventNumber: string;
  name: string;
  gameType: string;
  gameCategory?: "Hold'em" | "Omaha" | "Other" | "Satellite";
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
  structure: Structure | null;
  prize: Prize | null;
  feeDetail: string | null;
  /** card 用 短縮チケットエントリ表記 (例: "1 Ticket + ¥8,000"). チケット非対応 event は null */
  ticketEntry: string | null;
  games: string[] | null;
  bounty: { label: string; items: { rank: string; description: string }[] } | null;
  notes: string[] | null;
  award: AwardData | null;
  /** ジュニア event 等の景品リスト (Sheets master の Awards / Benefits 由来) */
  awards?: { label: string; sections: { header: string; items: string[] }[] } | null;
  benefits?: { label: string; sections: { header: string; items: string[] }[] } | null;
  sponsorship?: { label: string; items: { rank: string; description: string }[] } | null;
  multiDay?: MultiDayInfo | null;
  stackPerRound?: { label: string; rounds: string[] } | null;
  /** ディレイ等で当日に開始時間が変更された旨を Card / Detail に赤字 ※注記表示する文言 (Owner 指示 2026-05-01) */
  delayNotice?: string | null;
  /** Registration オープン時刻 (Card / Detail で Start の前段に表示). pdf-overrides.json 経由 (Owner 指示 2026-05-01) */
  regOpen?: string | null;
  /** Photo タブの遷移先 manual override (Owner 指示 2026-04-28). null 時は Flickr matching → 公式 fallback */
  photoOverride?: PhotoLink[] | null;
}

export const BADGE_STYLES: Record<string, string> = {
  // 具体 gameType → 専用色
  NLH: "bg-blue-700 text-white",
  NL: "bg-blue-700 text-white",
  PLO: "bg-purple-600 text-white",
  PLO8: "bg-purple-600 text-white",
  PL: "bg-amber-600 text-white",
  MIX: "bg-amber-500 text-white",
  "10-Game MIX": "bg-amber-500 text-white",
  "Big Bet MIX": "bg-amber-500 text-white",
  FL: "bg-amber-600 text-white",
  FLO: "bg-amber-600 text-white",
  FLO8: "bg-amber-600 text-white",
  Stud: "bg-amber-600 text-white",
  "PL Badugi": "bg-amber-600 text-white",
  SAT: "bg-sky-200 text-blue-900 border border-blue-300",
  // gameCategory fallback (gameType が空のときの badge 色)
  "Hold'em": "bg-blue-700 text-white",
  Omaha: "bg-purple-600 text-white",
  Other: "bg-amber-500 text-white",
  Satellite: "bg-sky-200 text-blue-900 border border-blue-300",
};

export function gameTypeLabel(gameType: string): string {
  return gameType === "SAT" ? "Satellite" : gameType;
}

/**
 * event 用 badge ラベル + スタイルを決定する。
 * gameType が空 (extract から取れなかった特殊 event) の場合は gameCategory を表示。
 * Owner 決定 (2026-04-22): ジュニア / STARS TABLE / FL&PL/NL 等で badge 白抜きを防ぐ。
 */
export function resolveEventBadge(event: EventData): { label: string; style: string } {
  const keySpecific: string = event.gameType || "";
  const keyCategory: string = event.gameCategory || "";
  const hasSpecific = keySpecific.trim().length > 0;
  const effectiveKey: string = hasSpecific ? keySpecific : keyCategory;
  const style = BADGE_STYLES[effectiveKey] || "bg-blue-100 text-blue-900";
  const label = hasSpecific ? gameTypeLabel(keySpecific) : keyCategory;
  return { label, style };
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Prize の数値文字列を $ 付きカンマ区切り整数に整形する。
 * Owner 指示 (2026-04-22): 通貨は $ 表記、小数点第一位繰上げ = ceil で整数化。
 * 例: "13699.66" → "$13,700", "3206.58" → "$3,207"
 * 入力が非数値・空なら原文を返す。
 */
export function formatPrize(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(n)) return trimmed;
  return `$${Math.ceil(n).toLocaleString("en-US")}`;
}

export function isHighRoller(buyIn: number | null): boolean {
  return buyIn != null && buyIn >= EVENT_CONFIG.HIGH_ROLLER_THRESHOLD;
}

export function isMultiDayEvent(event: EventData): boolean {
  if (event.day2Condition) return true;
  if (event.multiDay && event.multiDay.day2StartLevel != null) return true;
  if (/\/\s*Day/i.test(event.name)) return true;
  return false;
}

type PhaseKind = "day1" | "day1Turbo" | "day2" | "day3";

interface Phase {
  kind: PhaseKind;
  startLevel: number;
  endLevel: number | null;
  label: string;
}

function getEventPhase(event: EventData): Phase | null {
  const md = event.multiDay;
  if (!md) return null;
  const n = event.name ?? "";

  if (/\/\s*Day\s*3\s*$/i.test(n) && md.day3StartLevel != null) {
    return {
      kind: "day3",
      startLevel: md.day3StartLevel,
      endLevel: null,
      label: "Day 3",
    };
  }
  if (/\/\s*Day\s*2\s*$/i.test(n) && md.day2StartLevel != null) {
    return {
      kind: "day2",
      startLevel: md.day2StartLevel,
      endLevel: md.day2EndLevel ?? null,
      label: "Day 2",
    };
  }
  if (/\/\s*Day\s*1[A-Z]?\s*Turbo\s*$/i.test(n)) {
    return {
      kind: "day1Turbo",
      startLevel: md.turbo?.startLevel ?? 1,
      endLevel: md.turbo?.endLevel ?? md.day1EndLevel ?? null,
      label: md.turbo?.label ?? "Day 1 Turbo",
    };
  }
  if (/\/\s*Day\s*1[A-Z]?\s*$/i.test(n)) {
    return {
      kind: "day1",
      startLevel: 1,
      endLevel: md.day1EndLevel ?? null,
      label: "Day 1",
    };
  }
  return null;
}

function formatBlinds(sb: number | null | undefined, bb: number | null | undefined): string {
  if (sb == null || bb == null) return "—";
  return `${formatNumber(sb)}/${formatNumber(bb)}`;
}

function getLimitedLevels(levels: Level[], maxLevels: number): Level[] {
  const result: Level[] = [];
  let levelCount = 0;
  for (const lv of levels) {
    if (lv.break) {
      result.push(lv);
      continue;
    }
    if (levelCount >= maxLevels) break;
    result.push(lv);
    levelCount++;
  }
  return result;
}

function calcBBAtLevel(
  structure: Structure,
  startingChips: number | null
): number | null {
  if (startingChips == null || structure.lateRegCloseAfterLevel == null) return null;

  const regLevel = structure.levels.find(
    (lv) => !lv.break && lv.level === structure.lateRegCloseAfterLevel
  );
  if (!regLevel || !regLevel.bb || regLevel.bb === 0) return null;

  return Math.floor(startingChips / regLevel.bb);
}

function StructureTable({
  structure,
  startingChips,
  multiDay,
  isMultiDay,
  phase,
}: {
  structure: Structure;
  startingChips: number | null;
  multiDay?: MultiDayInfo | null;
  isMultiDay: boolean;
  phase: Phase | null;
}) {
  const isStud = !!structure.isStud;
  // NL Stud は ALL Ante 1 列のみの 3 列構造 (Owner 仕様 2026-04-25)
  const isAllAnte = structure.columns.includes("ALL Ante");
  // FL Stud は Ante + Bring-in/Completion の 4 列。Hold'em/Omaha は BB Ante 列の有無で 3 or 4 列
  const hasAnte = !isAllAnte && (isStud || structure.columns.includes("BB Ante"));

  const filteredRaw: Level[] = phase
    ? structure.levels.filter((lv) => {
        // Day 1 Turbo: 元 30 分 structure の break (Lv.4/Lv.8 後 等) は不要。
        // 代わりに reg close level 直後に 10 分 break を合成挿入する (下記 displayLevels)
        if (phase.kind === "day1Turbo" && lv.break) return false;
        if (lv.break) return true;
        if (lv.level == null) return false;
        if (lv.level < phase.startLevel) return false;
        if (phase.endLevel != null && lv.level > phase.endLevel) return false;
        return true;
      })
    : structure.levels;

  const trimmed = [...filteredRaw];
  while (trimmed.length && trimmed[0].break) trimmed.shift();
  while (trimmed.length && trimmed[trimmed.length - 1].break) trimmed.pop();

  // Day 1 Turbo phase は level time を turbo.levelTime で上書き (例: 30 → 20 分)
  // 加えて reg close level (= structure.lateRegCloseAfterLevel) 直後に 10 分 break を
  // 合成挿入する (Owner 仕様 2026-04-25: 「Lv.9 後で 10 分ブレイク」)
  const turboLevelTime =
    phase?.kind === "day1Turbo" ? multiDay?.turbo?.levelTime ?? null : null;
  const turboRegCloseLevel =
    phase?.kind === "day1Turbo" ? structure.lateRegCloseAfterLevel ?? null : null;
  // event 別 turbo break 位置 override (PDF 通りに Lv.X 後 break を複数挿入する場合に使用)
  // 例: #01 Main Event Day 1D Turbo は Lv.6 / Lv.12 後 break (PDF 仕様)
  const turboBreakAfterLevels =
    phase?.kind === "day1Turbo" ? structure.turboBreakAfterLevels ?? null : null;

  // Owner 指示 (2026-04-22): 単日トーナメントは 30 レベルまで記載。
  // Multi-day は phase filter (Day 1/2/3) で Day 範囲に絞られるため phase 基準で cap 決定。
  // 単日 cap は transformer 側でも slice 済 (SINGLE_DAY_LEVEL_CAP=30) のため二重保険。
  const maxLevels =
    phase && (phase.kind === "day2" || phase.kind === "day3")
      ? 50
      : isMultiDay
      ? 50
      : 30;
  const displayLevels = (() => {
    const base = getLimitedLevels(trimmed, maxLevels).map((lv) =>
      lv.break || turboLevelTime == null ? lv : { ...lv, time: turboLevelTime }
    );
    // Day 1 Turbo: event 別 turboBreakAfterLevels 指定があればそれを優先
    // (例: #01 Main は PDF で Lv.6/Lv.12 後 break)。
    // 指定が無ければ従来通り reg close level (例: Lv.9) 直後に 1 回だけ synthetic break。
    const breakAfterSet =
      turboBreakAfterLevels && turboBreakAfterLevels.length > 0
        ? new Set(turboBreakAfterLevels)
        : turboRegCloseLevel != null
        ? new Set([turboRegCloseLevel])
        : null;
    if (!breakAfterSet) return base;
    const result: Level[] = [];
    for (const lv of base) {
      result.push(lv);
      if (!lv.break && lv.level != null && breakAfterSet.has(lv.level)) {
        result.push({ break: true, time: 10 } as Level);
      }
    }
    return result;
  })();
  const bbCount = calcBBAtLevel(structure, startingChips);
  const day2StartLevel = multiDay?.day2StartLevel ?? null;
  const day2StartBlinds = multiDay?.day2StartBlinds ?? null;
  const day3StartLevel = multiDay?.day3StartLevel ?? null;
  const day3StartBlinds = multiDay?.day3StartBlinds ?? null;
  const day2StartExistsInTable =
    day2StartLevel != null &&
    displayLevels.some((lv) => !lv.break && lv.level === day2StartLevel);
  const showD2Synth =
    phase?.kind !== "day2" &&
    phase?.kind !== "day3" &&
    day2StartLevel != null &&
    !day2StartExistsInTable;
  const showD3Synth = phase?.kind !== "day3" && day3StartLevel != null;
  const colCount = hasAnte ? 4 : 3;

  const hasAnyLevel = displayLevels.some((l) => !l.break);
  if (phase && (phase.kind === "day2" || phase.kind === "day3") && !hasAnyLevel) {
    const startBlinds =
      phase.kind === "day2" ? day2StartBlinds : day3StartBlinds;
    return (
      <div className="py-4 px-3 text-center text-xs text-text-secondary rounded-md border border-dashed border-amber-300 bg-amber-50">
        <p className="font-bold text-amber-900 mb-1">
          {phase.label} starts at Lv.{phase.startLevel}
          {startBlinds ? ` (${startBlinds})` : ""}
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Full {phase.label} blind schedule is not provided in this data.
          <br />
          See any Day 1 row for the complete blind progression.
        </p>
      </div>
    );
  }

  // rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E. 等) は 5 列 + variant rowSpan で別描画
  // 通常 Hold'em / PLO / Stud branch (下記 main return) と完全分離 (Owner 仕様 2026-04-26)
  if (structure.isMixRotation) {
    const rotationColCount = 5;
    return (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-center py-1 px-1 font-medium text-text-muted">Lv.</th>
              <th className="text-center py-1 px-1 font-medium text-text-muted">Type</th>
              <th className="text-center py-1 px-1 font-medium text-text-muted">Ante</th>
              <th className="text-center py-1 px-1 font-medium text-text-muted">Blinds</th>
              <th className="text-center py-1 px-1 font-medium text-text-muted">Min.</th>
            </tr>
          </thead>
          <tbody>
            {displayLevels.map((lv, i) => {
              if (lv.break) {
                return (
                  <tr key={`break-${i}`} className="bg-bg-tertiary">
                    <td
                      colSpan={rotationColCount}
                      className="text-center py-1 px-1 text-text-muted italic"
                    >
                      Break — {lv.time} min.
                    </td>
                  </tr>
                );
              }
              const variants = lv.gameVariants && lv.gameVariants.length > 0
                ? lv.gameVariants
                : [{ type: "—", ante: "—", blinds: "—" }];
              const rowSpan = variants.length;
              const isLateRegClose =
                structure.lateRegCloseAfterLevel != null &&
                lv.level === structure.lateRegCloseAfterLevel;
              const isDay2End =
                structure.day2EndLevel != null && lv.level === structure.day2EndLevel;
              const isDay2Start =
                day2StartLevel != null && lv.level === day2StartLevel;
              const isDay1End =
                phase?.kind === "day1" &&
                phase.endLevel != null &&
                lv.level === phase.endLevel;
              const isDay3Start =
                phase?.kind === "day3" &&
                day3StartLevel != null &&
                lv.level === day3StartLevel;
              const rowBg =
                isDay1End || isDay2Start || isDay3Start
                  ? "bg-amber-50"
                  : isLateRegClose
                  ? "bg-blue-50"
                  : "";
              return variants.map((v, vi) => (
                <tr
                  key={`lv-${lv.level}-${i}-${vi}`}
                  className={`${vi === variants.length - 1 ? "border-b border-border-light" : ""} ${rowBg}`}
                >
                  {vi === 0 && (
                    <td
                      rowSpan={rowSpan}
                      className="py-1 px-1 text-center text-text-secondary tabular-nums align-top"
                    >
                      {lv.level}
                      {isLateRegClose && (
                        <span className="ml-1 text-[8px] text-blue-700 font-bold">
                          {bbCount != null ? `CLOSE ${bbCount}BB` : "CLOSE"}
                        </span>
                      )}
                      {isDay1End && (
                        <span className="ml-1 text-[8px] text-amber-800 font-bold">
                          D1 END
                        </span>
                      )}
                      {isDay2Start && (
                        <span className="ml-1 text-[8px] text-amber-700 font-bold">
                          D2 START
                        </span>
                      )}
                      {isDay2End && (
                        <span className="ml-1 text-[8px] text-blue-900 font-bold">
                          D2 END
                        </span>
                      )}
                      {isDay3Start && (
                        <span className="ml-1 text-[8px] text-amber-700 font-bold">
                          D3 START
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-1 px-1 text-center text-text-primary font-medium whitespace-nowrap">
                    {v.type}
                  </td>
                  <td className="py-1 px-1 text-center text-text-secondary tabular-nums whitespace-nowrap">
                    {v.ante}
                  </td>
                  <td className="py-1 px-1 text-center text-text-primary font-medium tabular-nums whitespace-nowrap">
                    {v.blinds}
                  </td>
                  {vi === 0 && (
                    <td
                      rowSpan={rowSpan}
                      className="py-1 px-1 text-center text-text-secondary tabular-nums align-top"
                    >
                      {lv.time > 0 ? lv.time : "—"}
                    </td>
                  )}
                </tr>
              ));
            })}
            {showD2Synth && (
              <tr className="bg-amber-50 border-t-2 border-amber-300">
                <td
                  colSpan={rotationColCount}
                  className="text-center py-1.5 px-1 text-amber-900 font-semibold text-[10px]"
                >
                  ▶ D2 START — Lv.{day2StartLevel}
                  {day2StartBlinds ? ` (${day2StartBlinds})` : ""}
                </td>
              </tr>
            )}
            {showD3Synth && (
              <tr className="bg-amber-100/70 border-t border-amber-300">
                <td
                  colSpan={rotationColCount}
                  className="text-center py-1.5 px-1 text-amber-900 font-semibold text-[10px]"
                >
                  ▶ D3 START — Lv.{day3StartLevel}
                  {day3StartBlinds ? ` (${day3StartBlinds})` : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-center py-1 px-1 font-medium text-text-muted">Lv.</th>
            <th className="text-center py-1 px-1 font-medium text-text-muted">
              {isAllAnte ? "ALL Ante" : isStud ? "Ante" : "Blinds"}
            </th>
            {hasAnte && (
              <th className="text-center py-1 px-1 font-medium text-text-muted">
                {isStud ? "Bring-in/Completion" : "Ante"}
              </th>
            )}
            <th className="text-center py-1 px-1 font-medium text-text-muted">Min.</th>
          </tr>
        </thead>
        <tbody>
          {displayLevels.map((lv, i) => {
            if (lv.break) {
              return (
                <tr key={`break-${i}`} className="bg-bg-tertiary">
                  <td
                    colSpan={colCount}
                    className="text-center py-1 px-1 text-text-muted italic"
                  >
                    Break — {lv.time} min.
                  </td>
                </tr>
              );
            }

            const isLateRegClose =
              structure.lateRegCloseAfterLevel != null &&
              lv.level === structure.lateRegCloseAfterLevel;
            const isDay2End =
              structure.day2EndLevel != null && lv.level === structure.day2EndLevel;
            const isDay2Start =
              day2StartLevel != null && lv.level === day2StartLevel;
            // Day 1 End: phase=day1 のとき最終 Level を amber でマーク (Owner 指示 2026-04-22)
            const isDay1End =
              phase?.kind === "day1" &&
              phase.endLevel != null &&
              lv.level === phase.endLevel;
            // Day 3 Start: phase=day3 のとき開始 Level を amber でマーク
            const isDay3Start =
              phase?.kind === "day3" &&
              day3StartLevel != null &&
              lv.level === day3StartLevel;

            const rowBg =
              isDay1End || isDay2Start || isDay3Start
                ? "bg-amber-50"
                : isLateRegClose
                ? "bg-blue-50"
                : "";

            return (
              <tr
                key={`lv-${lv.level}-${i}`}
                className={`border-b border-border-light ${rowBg}`}
              >
                <td className="py-1 px-1 text-center text-text-secondary tabular-nums">
                  {lv.level}
                  {/* CLOSE marker は bb 持つ event (Hold'em/PLO) では BB 換算付き、
                      Stud / ALL Ante / Bombpot 等 bb 不在の event では "CLOSE" のみ表示
                      (Owner 指示 2026-04-28/29 #75 5-Game Stud / #12 #68 #143 PLO DBBP) */}
                  {isLateRegClose && (
                    <span className="ml-1 text-[8px] text-blue-700 font-bold">
                      {bbCount != null ? `CLOSE ${bbCount}BB` : "CLOSE"}
                    </span>
                  )}
                  {isDay1End && (
                    <span className="ml-1 text-[8px] text-amber-800 font-bold">
                      D1 END
                    </span>
                  )}
                  {isDay2Start && (
                    <span className="ml-1 text-[8px] text-amber-700 font-bold">
                      D2 START
                    </span>
                  )}
                  {isDay2End && (
                    <span className="ml-1 text-[8px] text-blue-900 font-bold">
                      D2 END
                    </span>
                  )}
                  {isDay3Start && (
                    <span className="ml-1 text-[8px] text-amber-700 font-bold">
                      D3 START
                    </span>
                  )}
                </td>
                <td className="py-1 px-1 text-center text-text-primary font-medium tabular-nums">
                  {isStud || isAllAnte
                    ? lv.ante != null
                      ? formatNumber(lv.ante)
                      : "—"
                    : formatBlinds(lv.sb, lv.bb)}
                </td>
                {hasAnte && (
                  <td className="py-1 px-1 text-center text-text-secondary tabular-nums">
                    {isStud
                      ? lv.bringIn != null && lv.completion != null
                        ? `${formatNumber(lv.bringIn)} - ${formatNumber(lv.completion)}`
                        : "—"
                      : lv.ante != null
                      ? formatNumber(lv.ante)
                      : "—"}
                  </td>
                )}
                <td className="py-1 px-1 text-center text-text-secondary tabular-nums">
                  {lv.time}
                </td>
              </tr>
            );
          })}
          {showD2Synth && (
            <tr className="bg-amber-50 border-t-2 border-amber-300">
              <td
                colSpan={colCount}
                className="text-center py-1.5 px-1 text-amber-900 font-semibold text-[10px]"
              >
                ▶ D2 START — Lv.{day2StartLevel}
                {day2StartBlinds ? ` (${day2StartBlinds})` : ""}
              </td>
            </tr>
          )}
          {showD3Synth && (
            <tr className="bg-amber-100/70 border-t border-amber-300">
              <td
                colSpan={colCount}
                className="text-center py-1.5 px-1 text-amber-900 font-semibold text-[10px]"
              >
                ▶ D3 START — Lv.{day3StartLevel}
                {day3StartBlinds ? ` (${day3StartBlinds})` : ""}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AwardSectionBlock({ section }: { section: AwardSection }) {
  const locale = useLocale();
  const hasAllDay1 = section.allDay1.length > 0;
  const hasDay2 = section.day2.length > 0;
  if (!hasAllDay1 && !hasDay2 && !section.description) return null;
  return (
    <div className="mb-1">
      <p className="text-[11px] font-semibold text-blue-900">{localizeText(section.header, locale) || "Award"}</p>
      {hasAllDay1 && (
        <div className="mt-0.5">
          {section.subsectionLeft && (
            <p className="text-[10px] text-text-muted">{localizeText(section.subsectionLeft, locale)}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {section.allDay1.map((a, i) => (
              <span key={i} className="text-[11px] text-text-secondary">
                {a.rank}: {localizeText(a.prize, locale)}
              </span>
            ))}
          </div>
        </div>
      )}
      {hasDay2 && (
        <div className="mt-0.5">
          {section.subsectionDay2 && (
            <p className="text-[10px] text-text-muted">{localizeText(section.subsectionDay2, locale)}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {section.day2.map((a, i) => (
              <span key={i} className="text-[11px] text-text-secondary">
                {a.rank}: {localizeText(a.prize, locale)}
              </span>
            ))}
          </div>
        </div>
      )}
      {section.description && (
        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
          {localizeText(section.description, locale)}
        </p>
      )}
    </div>
  );
}

function InfoPanel({ event }: { event: EventData }) {
  const tDetail = useTranslations("event_detail");
  const locale = useLocale();
  const displayFee = event.feeDetail ? event.feeDetail.replace(/Â¥/g, "¥") : null;
  // rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E.) では variant 別 blinds が
  // pipe 区切り長文になるため Multi-Day Restart の blinds 括弧表記を抑制し
  // Lv.X だけ表示する (Owner 指示 2026-04-27)
  const isMixRotation = !!event.structure?.isMixRotation;
  const md = event.multiDay ?? null;
  const showMultiDay =
    md != null &&
    (md.day2StartLevel != null ||
      md.day3StartLevel != null ||
      md.turbo != null);

  return (
    <div className="space-y-3 text-xs">
      <div className="rounded-md bg-blue-900 text-white px-3 py-2">
        <p className="text-[10px] font-bold tracking-[1px] text-blue-200 uppercase mb-1">
          Schedule
        </p>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {event.regOpen && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-blue-200">Reg. Open</span>
              <span className="text-sm font-bold tabular-nums">{event.regOpen}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-blue-200">Start</span>
            <span className="text-sm font-bold tabular-nums">{event.startTime}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-blue-200">Reg. Close</span>
            <span className="text-sm font-bold tabular-nums">
              {event.lateRegClose ?? "—"}
            </span>
          </div>
        </div>
        {event.delayNotice && (
          <p className="text-[11px] font-semibold text-red-300 mt-1.5">
            ※{localizeText(event.delayNotice, locale)}
          </p>
        )}
      </div>

      {event.prize &&
        (event.prize.total ||
          event.prize.satellitePrize ||
          (event.prize.rankPrizes?.length ?? 0) > 0) && (
          <div>
            <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
              Prize
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {event.prize.total && (
                <div>
                  <span className="text-text-muted">Total: </span>
                  <span className="font-semibold text-text-primary">{formatPrize(event.prize.total)}</span>
                </div>
              )}
              {event.prize.inPrize && (
                <div>
                  <span className="text-text-muted">In Prize: </span>
                  <span className="font-medium text-text-primary">{event.prize.inPrize}</span>
                </div>
              )}
              {event.prize.satellitePrize && (
                <div>
                  <span className="text-text-muted">Satellite Prize: </span>
                  <span className="font-medium text-text-primary">{event.prize.satellitePrize}</span>
                </div>
              )}
              {event.isSatellite && event.seatRatio && (() => {
                const [num, den] = event.seatRatio.split("/");
                if (!num || !den) return null;
                return (
                  <div>
                    <span className="text-text-muted">{tDetail("seat_ratio_label")}</span>
                    <span className="font-medium text-text-primary">
                      {tDetail("seat_ratio_format", { den, num })}
                    </span>
                  </div>
                );
              })()}
            </div>
            {(event.prize.rankPrizes?.length ?? 0) > 0 && (
              <div className="mt-1 space-y-1">
                {event.prize.rankPrizes!.map((rp, i) => (
                  <div key={i}>
                    <p className="text-[11px] font-semibold text-blue-900">{rp.rank}</p>
                    <p className="text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {rp.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {event.prize.note && (
              <p className="text-text-muted text-[10px] italic mt-1 whitespace-pre-wrap leading-relaxed">
                {localizeText(event.prize.note, locale)}
              </p>
            )}
          </div>
        )}

      {showMultiDay && md && (
        <div className="rounded-md border border-blue-200 bg-blue-50/70 p-2">
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Multi-Day Restart
          </p>
          {/* rotation game (MIX / HORSE 等) は variant 別の blinds 文字列 (例:
              "FL: 5,000/10,000 | STUD: 2,500/5,000 | PL/NL: -/7,500") が長く Owner 指示
              (2026-04-27) でレベル表記のみに簡略化。Hold'em / PLO の通常 event は従来通り
              Lv.X (X-X) 表記を維持 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {md.day1EndLevel != null && (
              <div>
                <span className="text-text-muted">Day 1 End: </span>
                <span className="font-medium text-text-primary tabular-nums">
                  Lv.{md.day1EndLevel}
                  {!isMixRotation && md.day1EndBlinds ? ` (${md.day1EndBlinds})` : ""}
                </span>
              </div>
            )}
            {md.day2StartLevel != null && (
              <div>
                <span className="text-text-muted">Day 2 Start: </span>
                <span className="font-semibold text-blue-900 tabular-nums">
                  Lv.{md.day2StartLevel}
                  {!isMixRotation && md.day2StartBlinds ? ` (${md.day2StartBlinds})` : ""}
                </span>
              </div>
            )}
            {md.day3StartLevel != null && (
              <div>
                <span className="text-text-muted">Day 3 Start: </span>
                <span className="font-semibold text-blue-900 tabular-nums">
                  Lv.{md.day3StartLevel}
                  {!isMixRotation && md.day3StartBlinds ? ` (${md.day3StartBlinds})` : ""}
                </span>
              </div>
            )}
          </div>
          {md.day2RestartNote && (
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              {localizeText(md.day2RestartNote as string, locale)}
            </p>
          )}
          {md.turbo && (
            <div className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              <p>
                <span className="font-medium text-blue-900">
                  {md.turbo.label ?? "Day 1 Turbo"}:{" "}
                </span>
                {md.turbo.startLevel != null && (
                  <span className="tabular-nums">{tDetail("turbo_start_level", { level: md.turbo.startLevel })}</span>
                )}
                {md.turbo.levelTime != null && (
                  <span className="tabular-nums">
                    {md.turbo.startLevel != null ? " / " : ""}{tDetail("turbo_each_minutes", { time: md.turbo.levelTime })}
                  </span>
                )}
              </p>
              {md.turbo.endCondition && (
                <p className="mt-0.5">{localizeText(md.turbo.endCondition as string, locale)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {displayFee && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Entry Fee
          </p>
          {/* fee_lines は改行区切りで複数 entry option (例: "1 JOPT Ticket + ¥8,000\n¥80,000")
              を保持するため whitespace-pre-line で line break を保つ (Owner 指示 2026-04-26) */}
          <p className="text-text-secondary whitespace-pre-line">{displayFee}</p>
        </div>
      )}

      {event.bounty && event.bounty.items.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            {event.bounty.label || "Bounty"}
          </p>
          <ul className="space-y-1">
            {event.bounty.items.map((it, i) => (
              <li key={i} className="text-text-secondary text-[11px] leading-relaxed">
                <span className="font-semibold text-text-primary">{localizeText(it.rank, locale)}</span>
                {it.description && (
                  <>
                    <span className="mx-1">:</span>
                    <span>{localizeText(it.description, locale)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(event.reentry && event.reentry !== "No") || event.day2Condition ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {/* event.reentry / event.day2Condition は data 由来日本語の可能性あり → localize */}
          {event.reentry && event.reentry !== "No" && (
            <div>
              <span className="text-text-muted">Re-entry: </span>
              <span className="font-medium text-text-primary">{localizeText(event.reentry, locale)}</span>
            </div>
          )}
          {event.day2Condition && (
            <div>
              <span className="text-text-muted">Day 2: </span>
              <span className="font-medium text-text-primary">{localizeText(event.day2Condition, locale)}</span>
            </div>
          )}
        </div>
      ) : null}

      {event.games && event.games.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Games
          </p>
          <ul className="space-y-0.5">
            {event.games.map((g, i) => (
              <li key={i} className="text-text-secondary">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(() => {
        // Owner 指示 2026-04-25: ラベル定義整理
        //   award          = マルチデイの chipLeader/sprinter (本セクション)
        //   special award  = 協賛トナメの協賛品 (下の sponsorship セクション)
        // 中身 (allDay1/day2/description) が全部空ならヘッダーごと非表示。
        const hasSection = (s: AwardSection | null | undefined) =>
          !!s && (s.allDay1.length > 0 || s.day2.length > 0 || s.description.trim().length > 0);
        const hasChip = hasSection(event.award?.chipLeader);
        const hasSprint = hasSection(event.award?.sprinter);
        const hasNote = !!(event.award?.currencyNote && event.award.currencyNote.trim().length > 0);
        if (!hasChip && !hasSprint && !hasNote) return null;
        return (
          <div>
            <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
              Award
            </p>
            {hasChip && (
              <AwardSectionBlock section={event.award!.chipLeader!} />
            )}
            {hasSprint && (
              <AwardSectionBlock section={event.award!.sprinter!} />
            )}
            {hasNote && (
              <p className="text-text-muted text-[10px] italic mt-1">
                {localizeText(event.award!.currencyNote!, locale)}
              </p>
            )}
          </div>
        );
      })()}

      {/* Awards / Benefits (Sheets master の景品リスト由来。ジュニア event 等で利用) */}
      {event.awards && event.awards.sections.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            {event.awards.label || "Awards"}
          </p>
          {event.awards.sections.map((s, i) => (
            <div key={i} className="mb-1">
              {s.header && (
                <p className="text-[11px] font-semibold text-blue-900">{localizeText(s.header, locale)}</p>
              )}
              <ul className="space-y-0.5 mt-0.5">
                {s.items.map((it, j) => (
                  <li key={j} className="text-[11px] text-text-secondary leading-relaxed">
                    {localizeText(it, locale)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {event.benefits && event.benefits.sections.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            {event.benefits.label || "Benefits"}
          </p>
          {event.benefits.sections.map((s, i) => (
            <div key={i} className="mb-1">
              {s.header && (
                <p className="text-[11px] font-semibold text-blue-900">{localizeText(s.header, locale)}</p>
              )}
              <ul className="space-y-0.5 mt-0.5">
                {s.items.map((it, j) => (
                  <li key={j} className="text-[11px] text-text-secondary leading-relaxed">
                    {localizeText(it, locale)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {event.sponsorship && event.sponsorship.items.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Special Award
          </p>
          <ul className="space-y-1">
            {event.sponsorship.items.map((it, i) => (
              <li key={i} className="text-text-secondary text-[11px] leading-relaxed">
                <span className="font-semibold text-text-primary">{localizeText(it.rank, locale)}</span>
                {it.description && (
                  <>
                    <span className="mx-1">:</span>
                    <span>{localizeText(it.description, locale)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.stackPerRound && event.stackPerRound.rounds.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            {event.stackPerRound.label}
          </p>
          <ul className="space-y-1">
            {event.stackPerRound.rounds.map((r, i) => (
              <li key={i} className="text-text-secondary text-[11px] leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.notes && event.notes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Notes
          </p>
          <ul className="space-y-1">
            {localizeArray(event.notes, locale).map((n, i) => (
              <li key={i} className="text-text-secondary text-[11px] leading-relaxed">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type TabKey = "info" | "structure" | "photo";

export default function EventDetail({ event }: { event: EventData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const multiDay = event.multiDay ?? null;
  const isMultiDay = isMultiDayEvent(event);
  const phase = getEventPhase(event);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "structure", label: "Structure" },
    { key: "photo", label: "Photo" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-bg-tertiary/80 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 text-[10px] font-bold tracking-[1px] uppercase rounded-md transition-all ${
              activeTab === tab.key
                ? "bg-blue-900 text-white shadow-sm"
                : "text-text-muted hover:bg-white/60 hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && <InfoPanel event={event} />}

      {activeTab === "structure" &&
        (() => {
          // PDF 画像 fallback: rotation game (MIX / HORSE / B.E.A.S.T. / T.O.R.S.E.) は
          // 上流 Apps Script 抽出が不完全 (val2 / minutes 欠落) のため Players Guide PDF を
          // PNG 画像化して直接表示。table 描画より優先 (Owner 指示 2026-04-26)
          const evKey = (event.eventNumber || "").replace(/^#/, "");
          const pageCount = STRUCTURE_PDF_PAGES[evKey];
          if (pageCount) {
            return (
              <div className="space-y-2">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <img
                    key={i}
                    src={`/structure-pdfs/${evKey}-p${i + 1}.png`}
                    alt={`${event.eventNumber} structure page ${i + 1} of ${pageCount}`}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                ))}
              </div>
            );
          }
          if (event.structure) {
            return (
              <StructureTable
                structure={event.structure}
                startingChips={event.startingChips}
                multiDay={multiDay}
                isMultiDay={isMultiDay}
                phase={phase}
              />
            );
          }
          return (
            <p className="text-xs text-text-muted py-4 text-center">
              Structure not available
            </p>
          );
        })()}

      {activeTab === "photo" && <PhotoPanel event={event} />}
    </div>
  );
}
