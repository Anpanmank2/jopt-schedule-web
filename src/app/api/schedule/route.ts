/**
 * GET /api/schedule
 * extract.json (SSOT) を transformer 経由で display JSON に変換して返す。
 * multiDay は現行 jopt_gf2026_data.json から eventNumber で merge。
 *
 * Query params:
 *   ?debug=1 → 変換ソースの meta 情報も含める
 */

import { NextResponse } from "next/server";
import extractRaw from "@/data/extract.json";
import currentRaw from "@/data/jopt_gf2026_data.json";
import { transform } from "@/lib/transformer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isDebug = url.searchParams.get("debug") === "1";

  try {
    const transformed = transform(extractRaw, currentRaw);
    const body = isDebug
      ? {
          ...transformed,
          _debug: {
            sourceExtractedAt:
              (extractRaw as { event?: { extracted_at?: string } }).event?.extracted_at ?? null,
            currentDataExtractedAt:
              (currentRaw as { meta?: { extractedAt?: string } }).meta?.extractedAt ?? null,
            totalDays: transformed.days.length,
            totalEvents: transformed.meta.totalEvents,
          },
        }
      : transformed;

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store",
        "X-Schedule-Source": "extract.json transformer",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "transform failed", message: String(err) },
      { status: 500 }
    );
  }
}
