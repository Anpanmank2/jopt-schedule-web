type ExactFilterOption = {
  label: string;
  value: "all" | string;
};

type RangeFilterOption = {
  label: string;
  value: "all" | { min: number; max: number };
};

type FilterCategory = {
  label: string;
  key: string;
  type: "exact" | "range" | "multiDay";
  options: (ExactFilterOption | RangeFilterOption)[];
  default: string;
};

export type FilterConfig = Record<string, FilterCategory>;

export const FILTER_CONFIG: FilterConfig = {
  game: {
    label: "Game",
    key: "gameType",
    type: "exact",
    options: [
      { label: "All", value: "all" },
      { label: "NLH", value: "NLH" },
      { label: "PLO", value: "PLO" },
      { label: "MIX", value: "MIX" },
      { label: "Satellite", value: "SAT" },
    ],
    default: "all",
  },
  stake: {
    label: "Stake",
    key: "buyIn",
    type: "range",
    options: [
      { label: "All", value: "all" },
      { label: "Low Stake", value: { min: 0, max: 30000 } },
      { label: "Medium Stake", value: { min: 30001, max: 90000 } },
      { label: "High Stake", value: { min: 90001, max: Infinity } },
    ],
    default: "all",
  },
  multiDay: {
    label: "Format",
    key: "__multiDay",
    type: "multiDay",
    options: [
      { label: "All", value: "all" },
      { label: "Multi-Day Only", value: "multi" },
      { label: "Single Day Only", value: "single" },
    ],
    default: "all",
  },
};
