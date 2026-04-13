"use client";

import { useState, useRef, useEffect } from "react";
import rawData from "@/data/jopt_gf2026_data.json";
import EventCard from "@/components/EventCard";
import { useEventFilter } from "@/hooks/useEventFilter";
import EventFilter from "@/components/EventFilter";

interface EventItem {
  eventNumber: string;
  name: string;
  gameType: string;
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
  reentry: string;
  day2Condition: string | null;
  ruleNotes: string | null;
  structure: unknown;
  prize: unknown;
  feeDetail: string | null;
  games: string[] | null;
  bounty: string | null;
  notes: string[] | null;
  award: unknown;
}

interface DayGroup {
  date: string;
  dayLabel: string;
  events: EventItem[];
}

function buildDayGroups(): DayGroup[] {
  const grouped: Record<string, EventItem[]> = {};

  for (const day of rawData.days) {
    grouped[day.date] = [];
  }

  for (const day of rawData.days) {
    for (const evt of day.events) {
      const hour = parseInt(evt.startTime.split(":")[0], 10);
      let targetDate = evt.date;

      if (hour < 9) {
        // Explicit UTC anchor — server/client must agree (React #418 fix)
        const d = new Date(evt.date + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        const prevDate = d.toISOString().slice(0, 10);
        if (grouped[prevDate] !== undefined) {
          targetDate = prevDate;
        }
      }

      if (!grouped[targetDate]) {
        grouped[targetDate] = [];
      }
      grouped[targetDate].push(evt as unknown as EventItem);
    }
  }

  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => {
      const ha = parseInt(a.startTime.split(":")[0], 10);
      const hb = parseInt(b.startTime.split(":")[0], 10);
      const sortA = ha < 9 ? ha + 24 : ha;
      const sortB = hb < 9 ? hb + 24 : hb;
      if (sortA !== sortB) return sortA - sortB;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  return rawData.days
    .map((day) => ({
      date: day.date,
      dayLabel: day.dayLabel,
      events: grouped[day.date] || [],
    }))
    .filter((d) => d.events.length > 0);
}

const dayGroups = buildDayGroups();

export default function SchedulePage() {
  // Start from index 0 to avoid hydration mismatch; useEffect jumps to today after mount.
  const [selectedIdx, setSelectedIdx] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Local "today" in the user's timezone (client-only — no hydration concern)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;
    const todayIdx = dayGroups.findIndex((dg) => dg.date === today);
    if (todayIdx >= 0) {
      setSelectedIdx(todayIdx);
    }
  }, []);

  useEffect(() => {
    const el = tabsRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedIdx]);

  const day = dayGroups[selectedIdx];

  const { filteredEvents, activeFilters, setFilter, filterSummary } = useEventFilter(
    day.events as Record<string, any>[]
  );

  return (
    <div className="min-h-dvh bg-bg-secondary">
      {/* Page header */}
      <header className="bg-white border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-4 md:pb-6">
          <p className="text-[10px] md:text-xs font-bold tracking-[2px] text-blue-900 uppercase">
            JOPT 2026
          </p>
          <h1 className="text-xl md:text-4xl font-semibold text-text-primary leading-tight mt-1 md:mt-2">
            Grand Final — Schedule
          </h1>
          <p className="text-[11px] md:text-sm text-text-muted mt-1 md:mt-2">
            2026-04-24 〜 05-06 / ベルサール高田馬場
          </p>
        </div>
      </header>

      {/* Sticky day-tabs strip — full-width background, inner tabs contained */}
      <div className="sticky top-0 z-40 bg-bg-secondary/95 backdrop-blur border-b border-border-default">
        <div className="max-w-6xl mx-auto">
          <div
            ref={tabsRef}
            className="flex items-stretch overflow-x-auto hide-scrollbar px-2 md:px-6 md:justify-center"
          >
            {dayGroups.map((d, i) => {
              const active = i === selectedIdx;
              // Explicit UTC — server and client must produce identical markup
              const date = new Date(d.date + "T00:00:00Z");
              const dayNum = date.getUTCDate();
              const weekday = date.toLocaleDateString("en-US", {
                weekday: "short",
                timeZone: "UTC",
              });
              const month = date
                .toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
                .toUpperCase();

              const prevDate =
                i > 0 ? new Date(dayGroups[i - 1].date + "T00:00:00Z") : null;
              const showMonthLabel =
                i === 0 ||
                (prevDate && prevDate.getUTCMonth() !== date.getUTCMonth());

              return (
                <div key={d.date} className="flex items-stretch shrink-0">
                  {showMonthLabel && (
                    <div className="flex items-center px-2 md:px-3 bg-blue-900/10">
                      <span className="text-[9px] md:text-[11px] font-bold text-blue-900 tracking-wider">
                        {month}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedIdx(i)}
                    className={`shrink-0 flex flex-col items-center justify-center px-3 md:px-5 py-1.5 md:py-3 min-w-[44px] md:min-w-[64px] transition-colors ${
                      active
                        ? "bg-blue-900 text-white"
                        : "text-text-muted hover:bg-bg-tertiary"
                    }`}
                  >
                    <span className="text-sm md:text-base font-semibold leading-tight">
                      {dayNum}
                    </span>
                    <span
                      className={`text-[9px] md:text-[11px] leading-tight ${
                        active ? "text-blue-200" : "text-text-muted"
                      }`}
                    >
                      {weekday}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter + event count + event list */}
      <main className="max-w-6xl mx-auto px-2 md:px-6">
        <EventFilter activeFilters={activeFilters} onFilterChange={setFilter} />

        <div className="px-4 md:px-0 py-2 text-xs md:text-sm text-text-muted">
          {filterSummary}
        </div>

        <div className="px-4 md:px-0 pb-10 md:pb-16">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-sm md:text-base text-text-muted">
              No events found
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((evt, i) => (
                <EventCard
                  key={`${evt.eventNumber}-${evt.startTime}-${i}`}
                  event={evt as any}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
