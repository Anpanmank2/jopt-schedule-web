"use client";
import { useTranslations } from "next-intl";
import { FILTER_CONFIG } from "@/config/filterConfig";

// gameCategory アクティブ色 (Owner 指示 2026-04-22: NLH→Hold'em / PLO→Omaha / MIX→Other)
const GAME_ACTIVE_STYLES: Record<string, string> = {
  all: "bg-blue-900 text-white border-blue-900",
  "Hold'em": "bg-blue-700 text-white border-blue-700",
  Omaha: "bg-purple-600 text-white border-purple-600",
  Other: "bg-amber-500 text-white border-amber-500",
  Satellite: "bg-sky-200 text-blue-900 border-blue-300",
};

interface EventFilterProps {
  activeFilters: Record<string, string>;
  onFilterChange: (category: string, value: string) => void;
}

export default function EventFilter({ activeFilters, onFilterChange }: EventFilterProps) {
  const t = useTranslations("filter");
  const labelKey = (catKey: string): string =>
    catKey === "game" ? "category_game" : catKey;

  return (
    <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
      {Object.entries(FILTER_CONFIG).map(([catKey, category]) => {
        const selected = activeFilters[catKey] || category.default;

        return (
          <div key={catKey} className="flex flex-col gap-1">
            <p className="text-[10px] text-text-muted font-medium leading-none">
              {t(labelKey(catKey))}
            </p>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {category.options.map((option) => {
                const optionValue = typeof option.value === "string"
                  ? option.value
                  : option.label;
                const isActive = selected === optionValue;

                let activeStyle = "bg-blue-900 text-white border-blue-900";
                if (catKey === "game" && typeof option.value === "string") {
                  activeStyle = GAME_ACTIVE_STYLES[option.value] || activeStyle;
                }

                return (
                  <button
                    key={option.label}
                    onClick={() => onFilterChange(catKey, optionValue)}
                    className={`shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${
                      isActive
                        ? activeStyle
                        : "bg-white text-text-secondary border-border-default hover:bg-bg-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
