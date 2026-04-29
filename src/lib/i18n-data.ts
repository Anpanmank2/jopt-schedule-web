/**
 * Data 層 (extract.json 由来) の日本語 string を locale 別に切り替える辞書 lookup ヘルパ。
 * 辞書: src/data/translations.json (key=日本語、value={en, ko})
 *
 * Sheets master に EN/KOR column が追加されるまでの暫定対応 (2026-04-28 Owner 指示)。
 * Sheets 整備後は transformer 側で multi-locale field を直接持つ schema に移行予定。
 */
import translations from "@/data/translations.json";

type DictEntry = { en: string; ko: string };
const dict = translations as Record<string, DictEntry>;

export function localizeText(
  jp: string | null | undefined,
  locale: string
): string {
  if (jp == null) return "";
  if (locale === "ja") return jp;
  const entry = dict[jp];
  if (!entry) return jp; // 辞書未登録は JP fallback
  if (locale === "en") return entry.en || jp;
  if (locale === "ko") return entry.ko || jp;
  return jp;
}

/** notes[] 等の string 配列を一括 localize */
export function localizeArray(
  arr: string[] | null | undefined,
  locale: string
): string[] {
  if (!arr) return [];
  return arr.map((s) => localizeText(s, locale));
}
