"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import rawData from "@/data/jopt_gf2026_data.json";
import EventCard from "@/components/EventCard";
import EventRow from "@/components/EventRow";
import EventFilter from "@/components/EventFilter";
import { useEventFilter } from "@/hooks/useEventFilter";
import type { EventData, MultiDayInfo } from "@/components/EventDetail";

interface EventItem extends EventData {
  date: string;
  _displayDate: string;
}

interface DayGroup {
  date: string;
  dayLabel: string;
  events: EventItem[];
}

const multiDayMeta: Record<string, MultiDayInfo> =
  ((rawData.meta as Record<string, unknown>).multiDayEvents as Record<
    string,
    MultiDayInfo
  >) ?? {};

function attachMultiDay(evt: Record<string, any>): EventItem {
  const metaEntry = multiDayMeta[evt.eventNumber];
  const merged: EventItem = {
    ...(evt as unknown as EventItem),
    multiDay: metaEntry ?? (evt.multiDay as MultiDayInfo | null | undefined) ?? null,
  };
  return merged;
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
      const decorated = attachMultiDay(evt as unknown as Record<string, any>);
      decorated._displayDate = targetDate;
      grouped[targetDate].push(decorated);
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
const allEvents: EventItem[] = dayGroups.flatMap((d) => d.events);

export default function SchedulePage() {
  const [selectedIdx, setSelectedIdx] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    if (q) setQuery(q);
  }, []);

  const updateQuery = (q: string) => {
    setQuery(q);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const currentEvents: EventItem[] =
    selectedIdx === "all" ? allEvents : dayGroups[selectedIdx].events;

  const { filteredEvents, activeFilters, setFilter, filterSummary } = useEventFilter(
    currentEvents as unknown as Record<string, any>[],
    query
  );

  const groupedForAll = useMemo(() => {
    if (selectedIdx !== "all") return null;
    const byDate: Record<string, DayGroup> = {};
    for (const dg of dayGroups) {
      byDate[dg.date] = { date: dg.date, dayLabel: dg.dayLabel, events: [] };
    }
    for (const evt of filteredEvents as EventItem[]) {
      const key = evt._displayDate;
      if (byDate[key]) byDate[key].events.push(evt);
    }
    return dayGroups
      .map((dg) => byDate[dg.date])
      .filter((g) => g.events.length > 0);
  }, [selectedIdx, filteredEvents]);

  useEffect(() => {
    const tabIndex = selectedIdx === "all" ? 0 : selectedIdx + 1;
    const el = tabsRef.current?.children[tabIndex] as HTMLElement | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedIdx]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedIdx]);

  return (
    <div className="bg-bg-secondary">
      {/* Page header (non-sticky) */}
      <header className="bg-gradient-to-b from-blue-50 via-white to-white border-b border-blue-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-4 md:pb-6">
          <p className="text-[10px] md:text-xs font-bold tracking-[2px] text-blue-900 uppercase">
            Japan Open Poker Tour 2026
          </p>
          <h1 className="text-xl md:text-4xl font-semibold text-text-primary leading-tight mt-1 md:mt-2">
            Grand Final — Schedule
          </h1>
          <p className="text-[11px] md:text-sm text-text-muted mt-1 md:mt-2">
            2026-04-24 〜 05-06 / ベルサール高田馬場
          </p>

          <label className="mt-4 md:mt-5 flex items-center gap-2 bg-white border border-blue-200 rounded-full px-3 py-2 md:py-2.5 max-w-xl shadow-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a4b8c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="トーナメント名で検索..."
              className="flex-1 text-sm md:text-base text-text-primary placeholder:text-text-muted bg-transparent outline-none"
              aria-label="トーナメント名で検索"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="text-text-muted text-xs px-1"
                aria-label="検索をクリア"
              >
                ✕
              </button>
            )}
          </label>
        </div>
      </header>

      {/* Sticky wrapper — day-tab strip + filter pills */}
      <div className="sticky top-0 z-40 bg-blue-50/95 backdrop-blur border-b border-blue-200 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div
            ref={tabsRef}
            className="flex items-stretch overflow-x-auto hide-scrollbar px-2 md:px-6"
          >
            {/* ALL tab */}
            <button
              onClick={() => setSelectedIdx("all")}
              className={`shrink-0 flex flex-col items-center justify-center px-3 md:px-5 py-1.5 md:py-3 min-w-[52px] md:min-w-[72px] border-r border-blue-200/70 transition-colors ${
                selectedIdx === "all"
                  ? "bg-blue-900 text-white"
                  : "text-text-muted hover:bg-blue-100/60"
              }`}
            >
              <span className="text-sm md:text-base font-semibold leading-tight tracking-wider">
                ALL
              </span>
              <span
                className={`text-[9px] md:text-[11px] leading-tight ${
                  selectedIdx === "all" ? "text-blue-200" : "text-text-muted"
                }`}
              >
                {allEvents.length}
              </span>
            </button>

            {/* Per-day pills */}
            {dayGroups.map((d, i) => {
              const active = i === selectedIdx;
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
                        : "text-text-muted hover:bg-blue-100/60"
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

          {/* Filter pills */}
          <div className="border-t border-blue-200/60 bg-white/60">
            <EventFilter activeFilters={activeFilters} onFilterChange={setFilter} />
          </div>
        </div>
      </div>

      {/* Non-sticky content */}
      <div className="max-w-6xl mx-auto px-2 md:px-6">
        <div className="px-4 pt-2 pb-2 text-xs md:text-sm text-text-muted">
          {filterSummary}
        </div>

        <div className="pb-10 md:pb-16">
          {selectedIdx === "all" ? (
            groupedForAll && groupedForAll.length > 0 ? (
              <div className="max-w-2xl mx-auto">
                {groupedForAll.map((dg) => (
                  <section key={dg.date} id={`day-${dg.date}`} className="mb-6">
                    <h2 className="sticky top-[168px] md:top-[184px] z-30 bg-blue-50/95 backdrop-blur px-4 py-2 text-[11px] md:text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200 flex items-baseline gap-2">
                      <span>{dg.dayLabel}</span>
                      <span className="text-text-muted font-normal normal-case tracking-normal">
                        ({dg.events.length})
                      </span>
                    </h2>
                    <div className="divide-y divide-border-light bg-white border border-blue-100 border-t-0">
                      {dg.events.map((evt, i) => (
                        <EventRow
                          key={`${evt.eventNumber}-${evt.startTime}-${i}`}
                          event={evt}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-sm md:text-base text-text-muted">
                No events found
              </div>
            )
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-sm md:text-base text-text-muted">
              No events found
            </div>
          ) : (
            <div className="max-w-2xl mx-auto flex flex-col gap-3 px-4 md:px-0 pt-3">
              {filteredEvents.map((evt, i) => (
                <EventCard
                  key={`${(evt as any).eventNumber}-${(evt as any).startTime}-${i}`}
                  event={evt as unknown as EventData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
