"use client";

import { useTranslations } from "next-intl";
import type { EventData, PhotoLink } from "./EventDetail";
import flickrAlbums from "@/data/flickr-albums.json";
import { EVENT_CONFIG } from "@/config/eventConfig";

const FLICKR_USER_ID = EVENT_CONFIG.flickrUserId;
const FLICKR_ALBUMS_ROOT = `https://www.flickr.com/photos/${FLICKR_USER_ID}/albums/`;

type FlickrAlbumEntry = {
  id: string;
  title: string;
  coverUrl?: string | null;
};

type FlickrAlbumsJson = {
  fetchedAt?: string | null;
  albums?: FlickrAlbumEntry[];
};

/**
 * event.eventNumber (例 "#187", "#01", "(s37)") を Flickr album title 内で照合する。
 * Flickr の event 別 album タイトル例:
 *   "2026 Grand Final 05.06　#187　NLH Employees"  (全角空白あり)
 *   "2026 Grand Final 05.02 #01 NLH Main Event / Day 1A"
 * Sapporo 等の他大会 album を巻き込まないため "Grand Final" を含む album のみ採点対象とする。
 */
function findMatchingAlbum(event: EventData): FlickrAlbumEntry | null {
  const data = flickrAlbums as FlickrAlbumsJson;
  const albums = data.albums ?? [];
  if (albums.length === 0) return null;

  const eventNumRaw = event.eventNumber.trim();
  if (!eventNumRaw) return null;

  // "#187" → "187", "(s37)" → "(s37)"  Satellite は丸括弧含めて検索
  const eventNumKey = eventNumRaw.startsWith("#")
    ? eventNumRaw.replace("#", "").trim()
    : eventNumRaw;

  // 全/半角空白を半角に正規化して event_number 部を孤立 token として検索可能にする
  const normalizeForMatch = (s: string): string =>
    s.replace(/[\u3000\s]+/g, " ").toLowerCase();

  const eventNumNorm = normalizeForMatch(eventNumKey);

  let best: FlickrAlbumEntry | null = null;
  let bestScore = 0;

  for (const album of albums) {
    const titleNorm = normalizeForMatch(album.title);
    if (!titleNorm.includes("grand final")) continue;

    let score = 0;
    if (eventNumRaw.startsWith("#")) {
      // # 番号: token boundary 付きで完全一致を要求 (#1 が #10 / #100 にマッチしないように)
      const tokenRe = new RegExp(`(^|[\\s/])#${eventNumNorm}([\\s/]|$)`);
      if (tokenRe.test(titleNorm)) score = 10;
    } else {
      // Satellite: (s37) 形式そのまま含むか
      if (titleNorm.includes(eventNumNorm)) score = 8;
    }

    if (score > bestScore) {
      bestScore = score;
      best = album;
    }
  }

  return bestScore >= 5 ? best : null;
}

export default function PhotoPanel({ event }: { event: EventData }) {
  const t = useTranslations("photo");
  const overrides = event.photoOverride ?? null;
  const album = overrides ? null : findMatchingAlbum(event);
  const albumUrl = album
    ? `https://www.flickr.com/photos/${FLICKR_USER_ID}/albums/${album.id}`
    : FLICKR_ALBUMS_ROOT;

  // Owner override (pdf-overrides.json photoOverride field) を最優先
  if (overrides && overrides.length > 0) {
    return (
      <div className="py-3 text-xs">
        <ul className="flex flex-col gap-2">
          {overrides.map((link: PhotoLink) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-900 text-white font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                📷 {t("open_in_flickr", { label: link.label })}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="py-3 text-xs">
      {album ? (
        <div className="space-y-2">
          <div className="rounded-md overflow-hidden border border-border-default bg-bg-secondary">
            {album.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-40 bg-blue-50 text-blue-900 text-[11px]">
                📷 {album.title}
              </div>
            )}
          </div>
          <p className="text-text-secondary">{album.title}</p>
          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-900 text-white font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            📷 {t("open_in_flickr_default")}
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="text-3xl">📷</div>
          <p className="text-text-muted text-[11px] leading-relaxed max-w-xs">
            {t("no_album_yet_line1")}
            <br />
            {t("no_album_yet_line2")}
          </p>
          <a
            href={FLICKR_ALBUMS_ROOT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-900 text-white font-medium px-5 py-2 hover:bg-blue-700 transition-colors"
          >
            {t("official_album_link")}
          </a>
        </div>
      )}
    </div>
  );
}
