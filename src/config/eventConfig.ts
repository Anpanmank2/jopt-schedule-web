/**
 * Event-level configuration constants.
 *
 * 翌年の JOPT (JOPT 2027 等) に流用する際は、このファイル 1 箇所を書き換えるだけで
 * 表示・計算が新イベントに追従するよう意図している。
 * Owner 指示 (2026-04-22) によりハードコード散在を解消。
 *
 * 可能なら環境変数 NEXT_PUBLIC_* で上書きできるよう設計する (Deploy 時の override 用)。
 */

function envOr(envKey: string, fallback: string): string {
  const v = process.env[envKey];
  return v && v.trim() ? v : fallback;
}

function envOrNumber(envKey: string, fallback: number): number {
  const v = process.env[envKey];
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export const EVENT_CONFIG = {
  /** 開催年 (schedules.start_date に default 適用) */
  year: envOrNumber("NEXT_PUBLIC_EVENT_YEAR", 2026),

  /** イベント正式名称 (ヘッダ / meta 用) */
  eventName: envOr("NEXT_PUBLIC_EVENT_NAME", "JOPT 2026 Grand Final"),

  /** 短縮タイトル (ページ h1 表示用) */
  eventShortTitle: envOr(
    "NEXT_PUBLIC_EVENT_SHORT_TITLE",
    "2026 Grand Final — Schedule"
  ),

  /** 会期期間 + 会場 表示 */
  dateRangeVenue: envOr(
    "NEXT_PUBLIC_EVENT_DATE_RANGE_VENUE",
    "2026-04-24 〜 05-06 / ベルサール高田馬場"
  ),

  /** 会場名 (meta) */
  venue: envOr("NEXT_PUBLIC_EVENT_VENUE", "Bellesalle Takadanobaba"),

  /** copyright 年 */
  copyrightYear: envOrNumber("NEXT_PUBLIC_COPYRIGHT_YEAR", 2026),

  /** 主催者名 (copyright etc) */
  organizer: envOr("NEXT_PUBLIC_EVENT_ORGANIZER", "Japan Open Poker Tour"),

  /** 単日トーナメントの structure 表示上限 (non-break level 数) */
  SINGLE_DAY_LEVEL_CAP: envOrNumber("NEXT_PUBLIC_SINGLE_DAY_LEVEL_CAP", 30),

  /** HIGH ROLLER 判定の buyIn 閾値 (JPY) */
  HIGH_ROLLER_THRESHOLD: envOrNumber(
    "NEXT_PUBLIC_HIGH_ROLLER_THRESHOLD",
    100000
  ),

  /** Flickr album 連携 user id */
  flickrUserId: envOr("NEXT_PUBLIC_FLICKR_USER_ID", "190979093@N07"),
} as const;

export type EventConfig = typeof EVENT_CONFIG;
