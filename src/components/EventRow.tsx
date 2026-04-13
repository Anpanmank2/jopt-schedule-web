"use client";

import { useState } from "react";
import EventDetail, {
  BADGE_STYLES,
  type EventData,
} from "./EventDetail";

export default function EventRow({ event }: { event: EventData }) {
  const [open, setOpen] = useState(false);

  const badgeStyle = BADGE_STYLES[event.gameType] || "bg-blue-100 text-blue-900";
  const displayBuyIn = event.buyInDisplay
    ? event.buyInDisplay.replace(/Â¥/g, "¥")
    : null;

  return (
    <div
      className={event.isMainEvent ? "bg-blue-50/60" : "bg-white"}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 text-left hover:bg-bg-tertiary transition-colors"
      >
        <span className="shrink-0 text-[10px] text-text-muted font-medium w-9 md:w-10 tabular-nums">
          {event.eventNumber}
        </span>

        <span
          className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}
        >
          {event.gameType}
        </span>

        {event.isMainEvent && (
          <span className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded bg-blue-700 text-white uppercase tracking-wider">
            MAIN
          </span>
        )}

        <span className="flex-1 min-w-0 text-[13px] md:text-sm font-medium text-text-primary truncate">
          {event.name}
        </span>

        <span className="shrink-0 text-[11px] md:text-xs text-text-secondary tabular-nums">
          {event.startTime}
        </span>

        {displayBuyIn && (
          <span className="shrink-0 hidden sm:inline text-[11px] md:text-xs text-blue-900 font-medium tabular-nums">
            {displayBuyIn}
          </span>
        )}

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
          {displayBuyIn && (
            <div className="flex items-center gap-3 mb-2 text-xs sm:hidden">
              <span className="text-blue-900 font-medium">{displayBuyIn}</span>
              {event.gtdDisplay && (
                <span className="text-[10px] text-blue-700 font-medium">
                  GTD {event.gtdDisplay}
                </span>
              )}
              {event.startingChips && (
                <span className="text-[10px] text-text-muted">
                  {event.startingChips.toLocaleString("en-US")} chips
                </span>
              )}
            </div>
          )}
          <EventDetail event={event} />
        </div>
      )}
    </div>
  );
}
