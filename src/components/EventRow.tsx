"use client";

import { useState } from "react";
import EventDetail, {
  isHighRoller,
  resolveEventBadge,
  type EventData,
} from "./EventDetail";

export default function EventRow({ event }: { event: EventData }) {
  const [open, setOpen] = useState(false);

  const badge = resolveEventBadge(event);
  const displayBuyIn = event.buyInDisplay
    ? event.buyInDisplay.replace(/Â¥/g, "¥")
    : null;

  const highRoller = isHighRoller(event.buyIn);

  const rowBg = event.isMainEvent
    ? "bg-blue-100/70 border-l-4 border-l-blue-900"
    : highRoller
    ? "bg-amber-50/70 border-l-4 border-l-amber-500"
    : "bg-white border-l-4 border-l-transparent";

  return (
    <div className={rowBg}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 text-left hover:bg-bg-tertiary/60 transition-colors"
      >
        <span className="shrink-0 text-[11px] md:text-xs text-blue-900 font-bold tabular-nums w-10 md:w-11">
          {event.startTime}
        </span>

        <span className="shrink-0 text-[10px] text-text-muted font-medium w-9 md:w-10 tabular-nums">
          {event.eventNumber}
        </span>

        {displayBuyIn && (
          <span
            className={`shrink-0 text-[11px] md:text-xs font-bold tabular-nums max-w-[88px] md:max-w-[140px] truncate ${
              highRoller ? "text-amber-700" : "text-blue-900"
            }`}
          >
            {displayBuyIn}
          </span>
        )}

        <span
          className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.style}`}
        >
          {badge.label}
        </span>

        {event.isMainEvent && (
          <span className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded bg-blue-900 text-white uppercase tracking-wider">
            MAIN
          </span>
        )}

        {highRoller && !event.isMainEvent && (
          <span className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500 text-white uppercase tracking-wider">
            HIGH
          </span>
        )}

        <span className="flex-1 min-w-0 text-[13px] md:text-sm font-medium text-text-primary truncate">
          {event.name}
        </span>

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-3 md:px-4 py-3 bg-bg-secondary border-t border-border-light">
          {(event.gtdDisplay || event.startingChips) && (
            <div className="flex items-center gap-3 mb-2 text-[10px] md:text-xs text-text-muted">
              {event.gtdDisplay && (
                <span className="text-blue-700 font-medium">GTD {event.gtdDisplay}</span>
              )}
              {event.startingChips && (
                <span>{event.startingChips.toLocaleString("en-US")} chips</span>
              )}
            </div>
          )}
          <EventDetail event={event} />
        </div>
      )}
    </div>
  );
}
