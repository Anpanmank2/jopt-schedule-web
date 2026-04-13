"use client";
import { useMemo, useState } from "react";
import { FILTER_CONFIG } from "@/config/filterConfig";

export function useEventFilter(events: Record<string, any>[]) {
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
    return events.filter((event) => {
      for (const [catKey, category] of Object.entries(FILTER_CONFIG)) {
        const selectedValue = activeFilters[catKey];
        if (selectedValue === "all") continue;

        const fieldValue = event[category.key];

        if (category.type === "exact") {
          if (fieldValue !== selectedValue) return false;
        } else if (category.type === "range") {
          const option = category.options.find((o) => {
            if (typeof o.value === "string") return o.value === selectedValue;
            return o.label === selectedValue;
          });
          if (option && typeof option.value === "object") {
            const numValue = typeof fieldValue === "number" ? fieldValue : parseFloat(fieldValue);
            if (isNaN(numValue)) return false;
            if (numValue < option.value.min || numValue > option.value.max) return false;
          }
        }
      }
      return true;
    });
  }, [events, activeFilters]);

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
    const count = filteredEvents.length;
    if (activeLabels.length === 0) {
      return `${count} events`;
    }
    return `Filtered: ${activeLabels.join(" × ")} — ${count} events`;
  }, [activeFilters, filteredEvents]);

  return { filteredEvents, activeFilters, setFilter, resetFilters, filterSummary };
}
