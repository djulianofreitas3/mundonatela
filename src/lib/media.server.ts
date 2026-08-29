/**
 * Server-only helpers for the media metadata / trailer module.
 * Never imported by client code directly (see *.functions.ts wrappers).
 */

export type MediaType = "movie" | "series";

export interface RawSourceItem {
  stream_id: string;
  media_type: MediaType;
  original_name: string;
  normalized_title: string;
  year: number | null;
}

/** Extracts a 4-digit year (1900-2099) from a raw title, if present. */
export function extractYear(rawTitle: string): number | null {
  const match = rawTitle.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

/**
 * Normalizes a title for deduplication:
 * removes accents, quality/language tags, year, punctuation and extra spaces.
 */
export function normalizeTitle(rawTitle: string): string {
  return rawTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\b(4k|uhd|fhd|hd|sd|hdr|dublado|legendado|leg|dub|multi|nacional|remux|web-?dl|bluray|1080p?|720p?|2160p?)\b/g, " ")
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildBaseUrl(url: string): string {
  let base = url.trim().replace(/\/+$/, "");
  if (!base.startsWith("http")) base = `http://${base}`;
  return base;
}

/** Fetches VOD + series entries from an Xtream provider. */
export async function fetchXtreamCatalog(
  url: string,
  username: string,
  password: string,
): Promise<RawSourceItem[]> {
  const base = buildBaseUrl(url);
  const auth = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  const request = async (action: string): Promise<any[]> => {
    const response = await fetch(`${base}/player_api.php?${auth}&action=${action}`, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      throw new Error(`Provedor retornou status ${response.status} em ${action}`);
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  };

  const [movies, series] = await Promise.all([
    request("get_vod_streams").catch(() => [] as any[]),
    request("get_series").catch(() => [] as any[]),
  ]);

  const items: RawSourceItem[] = [];

  for (const movie of movies) {
    const rawName: string = movie?.name ?? movie?.title ?? "";
    const streamId = movie?.stream_id ?? movie?.num;
    if (!rawName || streamId === undefined || streamId === null) continue;
    items.push({
      stream_id: String(streamId),
      media_type: "movie",
      original_name: rawName,
      normalized_title: normalizeTitle(rawName),
      year: movie?.year ? Number(movie.year) || extractYear(rawName) : extractYear(rawName),
    });
  }

  for (const serie of series) {
    const rawName: string = serie?.name ?? serie?.title ?? "";
    const seriesId = serie?.series_id ?? serie?.num;
    if (!rawName || seriesId === undefined || seriesId === null) continue;
    items.push({
      stream_id: String(seriesId),
      media_type: "series",
      original_name: rawName,
      normalized_title: normalizeTitle(rawName),
      year: serie?.year ? Number(serie.year) || extractYear(rawName) : extractYear(rawName),
    });
  }

  return items.filter((item) => item.normalized_title.length > 0);
}

/** Builds a canonical YouTube watch URL from a video id. */
export function youtubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Accepts a full YouTube URL or bare id and returns the 11-char video id. */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1]! : null;
}
