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
  const dateLabels: Record<string, string> = {};
  for (const day of rawData.days) {
    dateLabels[day.date] = day.dayLabel;
  }

  const grouped: Record<string, EventItem[]> = {};

  for (const day of rawData.days) {
    grouped[day.date] = [];
  }

  for (const day of rawData.days) {
    for (const evt of day.events) {
      const hour = parseInt(evt.startTime.split(":")[0], 10);
      let targetDate = evt.date;

      if (hour < 9) {
        const d = new Date(evt.date + "T00:00:00");
        d.setDate(d.getDate() - 1);
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

function getDefaultDayIndex(): number {
  const today = new Date().toISOString().slice(0, 10);
  const idx = dayGroups.findIndex((d) => d.date === today);
  return idx >= 0 ? idx : 0;
}

export default function SchedulePage() {
  const [selectedIdx, setSelectedIdx] = useState(getDefaultDayIndex);
  const tabsRef = useRef<HTMLDivElement>(null);

  const day = dayGroups[selectedIdx];

  useEffect(() => {
    const el = tabsRef.current?.children[selectedIdx] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedIdx]);

  const { filteredEvents, activeFilters, setFilter, filterSummary } = useEventFilter(
    day.events as Record<string, any>[]
  );

  return (
    <div>
      {/* Page header */}
      <header className="px-4 pt-5 pb-3 border-b border-border-default bg-white">
        <p className="text-[10px] font-bold tracking-[2px] text-blue-900 uppercase">
          JOPT 2026
        </p>
        <h1 className="text-lg font-semibold text-text-primary leading-tight mt-0.5">
          Grand Final — Schedule
        </h1>
        <p className="text-[11px] text-text-muted mt-1">
          2026-04-24 〜 05-06 / ベルサール高田馬場
        </p>
      </header>

      {/* Calendar strip — sticky at top (no outer header) */}
      <div
        ref={tabsRef}
        className="flex items-stretch overflow-x-auto hide-scrollbar bg-bg-secondary border-b border-border-default sticky top-0 z-40"
      >
        {dayGroups.map((d, i) => {
          const active = i === selectedIdx;
          const date = new Date(d.date + "T00:00:00");
          const dayNum = date.getDate();
          const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
          const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

          const prevDate = i > 0 ? new Date(dayGroups[i - 1].date + "T00:00:00") : null;
          const showMonthLabel = i === 0 || (prevDate && prevDate.getMonth() !== date.getMonth());

          return (
            <div key={d.date} className="flex items-stretch shrink-0">
              {showMonthLabel && (
                <div className="flex items-center px-2 bg-blue-900/10">
                  <span className="text-[9px] font-bold text-blue-900 tracking-wider">
                    {month}
                  </span>
                </div>
              )}
              <button
                onClick={() => setSelectedIdx(i)}
                className={`shrink-0 flex flex-col items-center justify-center px-3 py-1.5 min-w-[44px] transition-colors ${
                  active
                    ? "bg-blue-900 text-white"
                    : "text-text-muted hover:bg-bg-tertiary"
                }`}
              >
                <span className="text-sm font-semibold leading-tight">{dayNum}</span>
                <span className={`text-[9px] leading-tight ${active ? "text-blue-200" : "text-text-muted"}`}>
                  {weekday}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <EventFilter activeFilters={activeFilters} onFilterChange={setFilter} />

      {/* Event count */}
      <div className="px-4 py-2 text-xs text-text-muted">{filterSummary}</div>

      {/* Event list */}
      <div className="px-4 pb-10 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-sm text-text-muted">
            No events found
          </div>
        ) : (
          filteredEvents.map((evt, i) => (
            <EventCard
              key={`${evt.eventNumber}-${evt.startTime}-${i}`}
              event={evt as any}
            />
          ))
        )}
      </div>
    </div>
  );
}
