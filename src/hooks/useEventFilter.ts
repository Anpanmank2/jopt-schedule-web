"use client";
import { useMemo, useState } from "react";
import { FILTER_CONFIG } from "@/config/filterConfig";

function isMultiDay(event: Record<string, any>): boolean {
  if (event.day2Condition) return true;
  const md = event.multiDay;
  if (md && md.day2StartLevel != null) return true;
  const name = typeof event.name === "string" ? event.name : "";
  if (/\/\s*Day/i.test(name)) return true;
  return false;
}

export function useEventFilter(
  events: Record<string, any>[],
  query: string = ""
) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const [key, cat] of Object.entries(FILTER_CONFIG)) {
      defaults[key] = cat.default;
    }
    return defaults;
  });

  function setFilter(category: string, value: string) {
    setActiveFilters((prev) => ({ ...prev, [category]: value }));
  }

  function resetFilters() {
    const defaults: Record<string, string> = {};
    for (const [key, cat] of Object.entries(FILTER_CONFIG)) {
      defaults[key] = cat.default;
    }
    setActiveFilters(defaults);
  }

  const filteredEvents = useMemo(() => {
    const base = events.filter((event) => {
      for (const [catKey, category] of Object.entries(FILTER_CONFIG)) {
        const selectedValue = activeFilters[catKey];
        if (selectedValue === "all") continue;

        if (category.type === "multiDay") {
          const isMulti = isMultiDay(event);
          if (selectedValue === "multi" && !isMulti) return false;
          if (selectedValue === "single" && isMulti) return false;
          continue;
        }

        const fieldValue = event[category.key];

        if (category.type === "exact") {
          if (fieldValue !== selectedValue) return false;
        } else if (category.type === "range") {
          const option = category.options.find((o) => {
            if (typeof o.value === "string") return o.value === selectedValue;
            return o.label === selectedValue;
          });
          if (option && typeof option.value === "object") {
            const numValue =
              typeof fieldValue === "number" ? fieldValue : parseFloat(fieldValue);
            if (isNaN(numValue)) return false;
            if (numValue < option.value.min || numValue > option.value.max) return false;
          }
        }
      }
      return true;
    });

    const trimmed = query.trim();
    if (!trimmed) return base;

    const q = trimmed.normalize("NFKC").toLowerCase();
    return base.filter((e) => {
      const name = (e.name ?? "") as string;
      return name.normalize("NFKC").toLowerCase().includes(q);
    });
  }, [events, activeFilters, query]);

  const filterSummary = useMemo(() => {
    const activeLabels: string[] = [];
    for (const [catKey, category] of Object.entries(FILTER_CONFIG)) {
      const selected = activeFilters[catKey];
      if (selected !== "all") {
        const opt = category.options.find((o) => {
          if (typeof o.value === "string") return o.value === selected;
          return o.label === selected;
        });
        if (opt) activeLabels.push(opt.label);
      }
    }
    const trimmed = query.trim();
    if (trimmed) activeLabels.push(`"${trimmed}"`);

    const count = filteredEvents.length;
    if (activeLabels.length === 0) {
      return `${count} events`;
    }
    return `Filtered: ${activeLabels.join(" × ")} — ${count} events`;
  }, [activeFilters, filteredEvents, query]);

  return { filteredEvents, activeFilters, setFilter, resetFilters, filterSummary };
}
