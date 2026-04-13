"use client";

import { useState } from "react";

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
  reentry: string;
  day2Condition: string | null;
  ruleNotes: string | null;
  structure: Structure | null;
  prize: Prize | null;
  feeDetail: string | null;
  games: string[] | null;
  bounty: string | null;
  notes: string[] | null;
  award: Award[] | null;
}

export const BADGE_STYLES: Record<string, string> = {
  NLH: "bg-blue-700 text-white",
  PLO: "bg-purple-600 text-white",
  MIX: "bg-amber-500 text-white",
  SAT: "bg-blue-100 text-blue-900",
};

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatBlinds(sb: number, bb: number): string {
  return `${formatNumber(sb)}/${formatNumber(bb)}`;
}

function getLimitedLevels(levels: Level[]): Level[] {
  const result: Level[] = [];
  let levelCount = 0;
  for (const lv of levels) {
    if (lv.break) {
      result.push(lv);
      continue;
    }
    if (levelCount >= 20) break;
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
}: {
  structure: Structure;
  startingChips: number | null;
}) {
  const hasAnte = structure.columns.includes("BB Ante");
  const displayLevels = getLimitedLevels(structure.levels);
  const bbCount = calcBBAtLevel(structure, startingChips);

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-1 px-1 font-medium text-text-muted">Lv</th>
            <th className="text-left py-1 px-1 font-medium text-text-muted">Blinds</th>
            {hasAnte && (
              <th className="text-right py-1 px-1 font-medium text-text-muted">Ante</th>
            )}
            <th className="text-right py-1 px-1 font-medium text-text-muted">Min</th>
          </tr>
        </thead>
        <tbody>
          {displayLevels.map((lv, i) => {
            if (lv.break) {
              return (
                <tr key={`break-${i}`} className="bg-bg-tertiary">
                  <td
                    colSpan={hasAnte ? 4 : 3}
                    className="text-center py-1 px-1 text-text-muted italic"
                  >
                    Break — {lv.time} min
                  </td>
                </tr>
              );
            }

            const isLateRegClose =
              structure.lateRegCloseAfterLevel != null &&
              lv.level === structure.lateRegCloseAfterLevel;
            const isDay2End =
              structure.day2EndLevel != null && lv.level === structure.day2EndLevel;

            return (
              <tr
                key={`lv-${lv.level}-${i}`}
                className={`border-b border-border-light ${isLateRegClose ? "bg-blue-50" : ""}`}
              >
                <td className="py-1 px-1 text-text-secondary">
                  {lv.level}
                  {isLateRegClose && bbCount != null && (
                    <span className="ml-1 text-[8px] text-blue-700 font-bold">REG {bbCount}BB</span>
                  )}
                  {isDay2End && (
                    <span className="ml-1 text-[8px] text-blue-900 font-bold">D2</span>
                  )}
                </td>
                <td className="py-1 px-1 text-text-primary font-medium">
                  {formatBlinds(lv.sb!, lv.bb!)}
                </td>
                {hasAnte && (
                  <td className="py-1 px-1 text-right text-text-secondary">
                    {formatNumber(lv.ante!)}
                  </td>
                )}
                <td className="py-1 px-1 text-right text-text-secondary">{lv.time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InfoPanel({ event }: { event: EventData }) {
  const displayFee = event.feeDetail ? event.feeDetail.replace(/Â¥/g, "¥") : null;

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

export default function EventDetail({ event }: { event: EventData }) {
  const [activeTab, setActiveTab] = useState<"structure" | "info">("structure");

  return (
    <div className="space-y-3">
      <div className="flex border-b border-border-default">
        <button
          onClick={() => setActiveTab("structure")}
          className={`px-3 py-1.5 text-[10px] font-bold tracking-[1px] uppercase transition-colors ${
            activeTab === "structure"
              ? "text-blue-900 border-b-2 border-blue-900"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Structure
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`px-3 py-1.5 text-[10px] font-bold tracking-[1px] uppercase transition-colors ${
            activeTab === "info"
              ? "text-blue-900 border-b-2 border-blue-900"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Info
        </button>
      </div>

      {activeTab === "structure" ? (
        event.structure ? (
          <StructureTable structure={event.structure} startingChips={event.startingChips} />
        ) : (
          <p className="text-xs text-text-muted py-4 text-center">Structure not available</p>
        )
      ) : (
        <InfoPanel event={event} />
      )}
    </div>
  );
}
