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

/**
 * Filter カテゴリ定義。
 * Owner 決定 (2026-04-22):
 *   - NLH → Hold'em 表示
 *   - PLO → Omaha 表示
 *   - MIX → Other 表示
 *   - Satellite はそのまま
 * gameCategory (transformer 側で 4 バケットに正規化済) を key に使用。
 */
export const FILTER_CONFIG: FilterConfig = {
  game: {
    label: "Game",
    key: "gameCategory",
    type: "exact",
    options: [
      { label: "All", value: "all" },
      { label: "Hold'em", value: "Hold'em" },
      { label: "Omaha", value: "Omaha" },
      { label: "Other", value: "Other" },
      { label: "Satellite", value: "Satellite" },
    ],
    default: "all",
  },
};
