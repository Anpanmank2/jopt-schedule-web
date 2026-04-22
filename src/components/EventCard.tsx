"use client";

import { useState } from "react";
import EventDetail, {
  formatNumber,
  isHighRoller,
  resolveEventBadge,
  type EventData,
} from "./EventDetail";

export default function EventCard({ event }: { event: EventData }) {
  const [open, setOpen] = useState(false);

  const badge = resolveEventBadge(event);
  const highRoller = isHighRoller(event.buyIn);

  const borderColor = event.isMainEvent
    ? "border-l-blue-900"
    : highRoller
    ? "border-l-amber-500"
    : event.isSatellite
    ? "border-l-blue-200"
    : "border-l-blue-500";

  const bgColor = event.isMainEvent
    ? "bg-blue-100/80"
    : highRoller
    ? "bg-amber-50/70"
    : "bg-white";

  const displayBuyIn = event.buyInDisplay
    ? event.buyInDisplay.replace(/Â¥/g, "¥")
    : null;

  return (
    <div
      className={`border border-border-default rounded-lg overflow-hidden border-l-[4px] ${borderColor} ${bgColor}`}
    >
      <button onClick={() => setOpen(!open)} className="w-full text-left p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-text-muted font-medium">
            {event.eventNumber}
          </span>
          <span
            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.style}`}
          >
            {badge.label}
          </span>
          {event.isMainEvent && (
            <span className="inline-block bg-blue-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              MAIN EVENT
            </span>
          )}
          {highRoller && !event.isMainEvent && (
            <span className="inline-block bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              HIGH ROLLER
            </span>
          )}
        </div>

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
            className={`shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          {displayBuyIn && (
            <span
              className={`text-sm font-bold tabular-nums ${
                highRoller ? "text-amber-700" : "text-blue-900"
              }`}
            >
              {displayBuyIn}
            </span>
          )}
          {event.gtdDisplay && (
            <span className="text-[10px] text-blue-700 font-medium">
              GTD {event.gtdDisplay}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-text-muted">
          <span className="tabular-nums">
            <span className="text-[9px] uppercase tracking-wider mr-1">Start</span>
            {event.startTime}
          </span>
          {event.lateRegClose && (
            <span className="tabular-nums">
              <span className="text-[9px] uppercase tracking-wider mr-1">Reg. Close</span>
              {event.lateRegClose}
            </span>
          )}
          {event.startingChips && (
            <span className="tabular-nums">
              {formatNumber(event.startingChips)} chips
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border-default px-3 py-3 bg-bg-secondary">
          <EventDetail event={event} />
          <button
            onClick={() => setOpen(false)}
            className="text-[10px] text-text-muted flex items-center gap-1 mx-auto pt-2"
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
