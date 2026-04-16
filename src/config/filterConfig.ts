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
};
