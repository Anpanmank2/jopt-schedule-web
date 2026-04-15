"use client";

import { useState } from "react";
import PhotoPanel from "./PhotoPanel";

export interface Level {
  level?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  time: number;
  break?: boolean;
}

export interface Structure {
  columns: string[];
  lateRegCloseAfterLevel: number | null;
  day2EndLevel: number | null;
  levels: Level[];
}

export interface Prize {
  total: string | null;
  inPrize: string | null;
  satellitePrize?: string | null;
}

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
  day1TurboLabel?: string | null;
  day1TurboStartLevel?: number | null;
  day1TurboLevelTime?: number | null;
  day1TurboEndLevel?: number | null;
  day1TurboEndBlinds?: string | null;
  day1TurboEndCondition?: string | null;
  totalLevels?: number | null;
}

export interface EventData {
  eventNumber: string;
  name: string;
  gameType: string;
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
  reentry: string | null;
  day2Condition: string | null;
  ruleNotes: string | null;
  structure: Structure | null;
  prize: Prize | null;
  feeDetail: string | null;
  games: string[] | null;
  bounty: string | null;
  notes: string[] | null;
  award: Award[] | null;
  multiDay?: MultiDayInfo | null;
}

export const BADGE_STYLES: Record<string, string> = {
  NLH: "bg-blue-700 text-white",
  PLO: "bg-purple-600 text-white",
  MIX: "bg-amber-500 text-white",
  SAT: "bg-sky-200 text-blue-900 border border-blue-300",
};

export function gameTypeLabel(gameType: string): string {
  return gameType === "SAT" ? "Satellite" : gameType;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function isHighRoller(buyIn: number | null): boolean {
  return buyIn != null && buyIn >= 100000;
}

export function isMultiDayEvent(event: EventData): boolean {
  if (event.day2Condition) return true;
  if (event.multiDay && event.multiDay.day2StartLevel != null) return true;
  if (/\/\s*Day/i.test(event.name)) return true;
  return false;
}

function formatBlinds(sb: number, bb: number): string {
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
}: {
  structure: Structure;
  startingChips: number | null;
  multiDay?: MultiDayInfo | null;
  isMultiDay: boolean;
}) {
  const hasAnte = structure.columns.includes("BB Ante");
  const maxLevels = isMultiDay ? 30 : 20;
  const displayLevels = getLimitedLevels(structure.levels, maxLevels);
  const bbCount = calcBBAtLevel(structure, startingChips);
  const day2StartLevel = multiDay?.day2StartLevel ?? null;
  const day2StartBlinds = multiDay?.day2StartBlinds ?? null;
  const day3StartLevel = multiDay?.day3StartLevel ?? null;
  const day3StartBlinds = multiDay?.day3StartBlinds ?? null;
  const day2StartExistsInTable =
    day2StartLevel != null &&
    displayLevels.some((lv) => !lv.break && lv.level === day2StartLevel);
  const colCount = hasAnte ? 4 : 3;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-center py-1 px-1 font-medium text-text-muted">Lv.</th>
            <th className="text-center py-1 px-1 font-medium text-text-muted">Blinds</th>
            {hasAnte && (
              <th className="text-center py-1 px-1 font-medium text-text-muted">Ante</th>
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

            const rowBg = isDay2Start
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
                  {isLateRegClose && bbCount != null && (
                    <span className="ml-1 text-[8px] text-blue-700 font-bold">
                      CLOSE {bbCount}BB
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
                </td>
                <td className="py-1 px-1 text-center text-text-primary font-medium tabular-nums">
                  {formatBlinds(lv.sb!, lv.bb!)}
                </td>
                {hasAnte && (
                  <td className="py-1 px-1 text-center text-text-secondary tabular-nums">
                    {formatNumber(lv.ante!)}
                  </td>
                )}
                <td className="py-1 px-1 text-center text-text-secondary tabular-nums">
                  {lv.time}
                </td>
              </tr>
            );
          })}
          {day2StartLevel != null && !day2StartExistsInTable && (
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
          {day3StartLevel != null && (
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

function InfoPanel({ event }: { event: EventData }) {
  const displayFee = event.feeDetail ? event.feeDetail.replace(/Â¥/g, "¥") : null;
  const md = event.multiDay ?? null;
  const showMultiDay =
    md != null &&
    (md.day2StartLevel != null ||
      md.day3StartLevel != null ||
      md.day1TurboEndCondition != null);

  return (
    <div className="space-y-3 text-xs">
      {event.prize && (event.prize.total || event.prize.satellitePrize) && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Prize
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {event.prize.total && (
              <div>
                <span className="text-text-muted">Total: </span>
                <span className="font-semibold text-text-primary">{event.prize.total}</span>
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
          </div>
        </div>
      )}

      {showMultiDay && md && (
        <div className="rounded-md border border-blue-200 bg-blue-50/70 p-2">
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Multi-Day Restart
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {md.day1EndLevel != null && (
              <div>
                <span className="text-text-muted">Day 1 End: </span>
                <span className="font-medium text-text-primary tabular-nums">
                  Lv.{md.day1EndLevel}
                  {md.day1EndBlinds ? ` (${md.day1EndBlinds})` : ""}
                </span>
              </div>
            )}
            {md.day2StartLevel != null && (
              <div>
                <span className="text-text-muted">Day 2 Start: </span>
                <span className="font-semibold text-blue-900 tabular-nums">
                  Lv.{md.day2StartLevel}
                  {md.day2StartBlinds ? ` (${md.day2StartBlinds})` : ""}
                </span>
              </div>
            )}
            {md.day3StartLevel != null && (
              <div>
                <span className="text-text-muted">Day 3 Start: </span>
                <span className="font-semibold text-blue-900 tabular-nums">
                  Lv.{md.day3StartLevel}
                  {md.day3StartBlinds ? ` (${md.day3StartBlinds})` : ""}
                </span>
              </div>
            )}
          </div>
          {md.day2RestartNote && (
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              {md.day2RestartNote}
            </p>
          )}
          {md.day1TurboEndCondition && (
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              <span className="font-medium text-blue-900">
                {md.day1TurboLabel ?? "Turbo"}:{" "}
              </span>
              {md.day1TurboEndCondition}
            </p>
          )}
        </div>
      )}

      {displayFee && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Entry Fee
          </p>
          <p className="text-text-secondary">{displayFee}</p>
        </div>
      )}

      {event.bounty && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Bounty
          </p>
          <p className="text-text-primary font-medium">{event.bounty}</p>
        </div>
      )}

      {(event.reentry && event.reentry !== "No") || event.day2Condition ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {event.reentry && event.reentry !== "No" && (
            <div>
              <span className="text-text-muted">Re-entry: </span>
              <span className="font-medium text-text-primary">{event.reentry}</span>
            </div>
          )}
          {event.day2Condition && (
            <div>
              <span className="text-text-muted">Day 2: </span>
              <span className="font-medium text-text-primary">{event.day2Condition}</span>
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

      {event.award && event.award.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Special Award
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {event.award.map((a, i) => (
              <span key={i} className="text-text-secondary">
                {a.rank}: {a.amount}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.notes && event.notes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Notes
          </p>
          <ul className="space-y-1">
            {event.notes.map((n, i) => (
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "structure", label: "Structure" },
    { key: "photo", label: "Photo" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex border-b border-border-default">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-[1px] uppercase transition-colors ${
              activeTab === tab.key
                ? "text-blue-900 border-b-2 border-blue-900"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && <InfoPanel event={event} />}

      {activeTab === "structure" &&
        (event.structure ? (
          <StructureTable
            structure={event.structure}
            startingChips={event.startingChips}
            multiDay={multiDay}
            isMultiDay={isMultiDay}
          />
        ) : (
          <p className="text-xs text-text-muted py-4 text-center">
            Structure not available
          </p>
        ))}

      {activeTab === "photo" && <PhotoPanel event={event} />}
    </div>
  );
}
