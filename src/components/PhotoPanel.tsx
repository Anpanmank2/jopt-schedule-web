"use client";

import type { EventData } from "./EventDetail";
import flickrAlbums from "@/data/flickr-albums.json";

const FLICKR_USER_ID = "190979093@N07";
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

const normalize = (s: string): string =>
  s.normalize("NFKC").toLowerCase().replace(/[\s\-_/]+/g, " ").trim();

function findMatchingAlbum(event: EventData): FlickrAlbumEntry | null {
  const data = flickrAlbums as FlickrAlbumsJson;
  const albums = data.albums ?? [];
  if (albums.length === 0) return null;

  const nameNorm = normalize(event.name);
  const eventNumNorm = event.eventNumber.replace("#", "").trim();

  let best: FlickrAlbumEntry | null = null;
  let bestScore = 0;

  for (const album of albums) {
    const titleNorm = normalize(album.title);
    let score = 0;
    if (titleNorm.includes(nameNorm)) score = 10;
    else if (nameNorm.split(" ").every((t) => t.length < 2 || titleNorm.includes(t))) score = 5;
    if (eventNumNorm && titleNorm.includes(eventNumNorm)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = album;
    }
  }

  return bestScore >= 5 ? best : null;
}

export default function PhotoPanel({ event }: { event: EventData }) {
  const album = findMatchingAlbum(event);
  const albumUrl = album
    ? `https://www.flickr.com/photos/${FLICKR_USER_ID}/albums/${album.id}`
    : FLICKR_ALBUMS_ROOT;

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
            📷 Flickr でアルバムを開く
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="text-3xl">📷</div>
          <p className="text-text-muted text-[11px] leading-relaxed max-w-xs">
            このトーナメント単体の写真アルバムは準備中です。
            <br />
            JOPT 公式フォトアルバムで全体をご覧いただけます。
          </p>
          <a
            href={FLICKR_ALBUMS_ROOT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-900 text-white font-medium px-5 py-2 hover:bg-blue-700 transition-colors"
          >
            JOPT 公式フォトアルバムを見る
          </a>
        </div>
      )}
    </div>
  );
}
