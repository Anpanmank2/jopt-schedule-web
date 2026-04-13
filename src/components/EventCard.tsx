"use client";

import { useState } from "react";

interface Level {
  level?: number;
  sb?: number;
  bb?: number;
  ante?: number;
  time: number;
  break?: boolean;
}

interface Structure {
  columns: string[];
  lateRegCloseAfterLevel: number | null;
  day2EndLevel: number | null;
  levels: Level[];
}

interface Prize {
  total: string | null;
  inPrize: string | null;
  satellitePrize?: string | null;
}

interface Award {
  rank: string;
  amount: string;
}

interface EventData {
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

const BADGE_STYLES: Record<string, string> = {
  NLH: "bg-blue-700 text-white",
  PLO: "bg-purple-600 text-white",
  MIX: "bg-amber-500 text-white",
  SAT: "bg-blue-100 text-blue-900",
};

function formatNumber(n: number): string {
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
  if (
    startingChips == null ||
    structure.lateRegCloseAfterLevel == null
  )
    return null;

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
            <th className="text-left py-1 px-1 font-medium text-text-muted">
              Lv
            </th>
            <th className="text-left py-1 px-1 font-medium text-text-muted">
              Blinds
            </th>
            {hasAnte && (
              <th className="text-right py-1 px-1 font-medium text-text-muted">
                Ante
              </th>
            )}
            <th className="text-right py-1 px-1 font-medium text-text-muted">
              Min
            </th>
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
              structure.day2EndLevel != null &&
              lv.level === structure.day2EndLevel;

            return (
              <tr
                key={`lv-${lv.level}-${i}`}
                className={`border-b border-border-light ${
                  isLateRegClose ? "bg-blue-50" : ""
                }`}
              >
                <td className="py-1 px-1 text-text-secondary">
                  {lv.level}
                  {isLateRegClose && bbCount != null && (
                    <span className="ml-1 text-[8px] text-blue-700 font-bold">
                      REG {bbCount}BB
                    </span>
                  )}
                  {isDay2End && (
                    <span className="ml-1 text-[8px] text-blue-900 font-bold">
                      D2
                    </span>
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
                <td className="py-1 px-1 text-right text-text-secondary">
                  {lv.time}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InfoPanel({ event }: { event: EventData }) {
  const displayFee = event.feeDetail
    ? event.feeDetail.replace(/Â¥/g, "¥")
    : null;

  return (
    <div className="space-y-3 text-xs">
      {/* Prize */}
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

      {/* Fee Detail */}
      {displayFee && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Entry Fee
          </p>
          <p className="text-text-secondary">{displayFee}</p>
        </div>
      )}

      {/* Bounty */}
      {event.bounty && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Bounty
          </p>
          <p className="text-text-primary font-medium">{event.bounty}</p>
        </div>
      )}

      {/* Re-entry & Day2 */}
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

      {/* Games (MIX events) */}
      {event.games && event.games.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[1px] text-blue-900 uppercase mb-1">
            Games
          </p>
          <ul className="space-y-0.5">
            {event.games.map((g, i) => (
              <li key={i} className="text-text-secondary">{g}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Award */}
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

      {/* Notes */}
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

export default function EventCard({ event }: { event: EventData }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"structure" | "info">("structure");

  const badgeStyle =
    BADGE_STYLES[event.gameType] || "bg-blue-100 text-blue-900";

  const borderColor = event.isMainEvent
    ? "border-l-blue-700"
    : event.isSatellite
    ? "border-l-blue-100"
    : "border-l-blue-500";

  const bgColor = event.isMainEvent ? "bg-blue-50" : "bg-white";

  const displayBuyIn = event.buyInDisplay
    ? event.buyInDisplay.replace(/Â¥/g, "¥")
    : null;

  return (
    <div
      className={`border border-border-default rounded-lg overflow-hidden border-l-[3px] ${borderColor} ${bgColor}`}
    >
      {/* Collapsed summary */}
      <button onClick={() => setOpen(!open)} className="w-full text-left p-3">
        {/* Row 1: Event number + badges */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-text-muted font-medium">
            {event.eventNumber}
          </span>
          <span
            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}
          >
            {event.gameType}
          </span>
          {event.isMainEvent && (
            <span className="inline-block bg-blue-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              MAIN EVENT
            </span>
          )}
        </div>

        {/* Row 2: Event name + chevron */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-primary leading-tight">
            {event.name}
          </p>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            className={`shrink-0 mt-0.5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Row 3: Time + chips */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
          <span>Start {event.startTime}</span>
          {event.lateRegClose && (
            <span className="text-text-muted">
              Late Reg {event.lateRegClose}
            </span>
          )}
          {event.startingChips && (
            <span className="text-text-muted">
              {formatNumber(event.startingChips)} chips
            </span>
          )}
        </div>

        {/* Row 4: Buy-in + GTD */}
        <div className="flex items-center gap-3 mt-1">
          {displayBuyIn && (
            <span className="text-xs text-blue-900 font-medium">
              {displayBuyIn}
            </span>
          )}
          {event.gtdDisplay && (
            <span className="text-[10px] text-blue-700 font-medium">
              GTD {event.gtdDisplay}
            </span>
          )}
        </div>
      </button>

      {/* Expanded accordion */}
      {open && (
        <div className="border-t border-border-default px-3 py-3 bg-bg-secondary space-y-3">
          {/* Tab switcher */}
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

          {/* Tab content */}
          {activeTab === "structure" ? (
            <div>
              {event.structure ? (
                <StructureTable
                  structure={event.structure}
                  startingChips={event.startingChips}
                />
              ) : (
                <p className="text-xs text-text-muted py-4 text-center">
                  Structure not available
                </p>
              )}
            </div>
          ) : (
            <InfoPanel event={event} />
          )}

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="text-[10px] text-text-muted flex items-center gap-1 mx-auto pt-1"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            タップで閉じる
          </button>
        </div>
      )}
    </div>
  );
}
