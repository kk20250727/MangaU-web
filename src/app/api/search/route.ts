import { NextRequest } from "next/server";

type MangaDexManga = {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
  };
  relationships?: Array<{ id: string; type: string } | { id: string; type: string; attributes?: any }>;
};

const API = "https://api.mangadex.org";

async function fetchJson<T>(url: string, revalidateSec = 3600): Promise<T> {
  const res = await fetch(url, { next: { revalidate: revalidateSec } });
  if (!res.ok) throw new Error(`Upstream error: ${res.status}`);
  return res.json();
}

async function pickCover(mangaId: string): Promise<string | null> {
  // できるだけ英語(locale=en)の1巻(volume=1)のカバーを選ぶ
  const url = `${API}/cover?manga[]=${mangaId}&limit=100&order[volume]=asc`;
  const data = await fetchJson<any>(url, 24 * 3600);
  const items: Array<{ id: string; attributes: { fileName: string; volume?: string | null; locale?: string | null } }> =
    data?.data ?? [];

  const byPriority = (
    a: { attributes: { volume?: string | null; locale?: string | null } },
    b: { attributes: { volume?: string | null; locale?: string | null } }
  ) => {
    // 1) en && volume === "1"
    const score = (x: { volume?: string | null; locale?: string | null }) => {
      const isEn = x.locale === "en" ? 1 : 0;
      const isV1 = (x.volume ?? "") === "1" ? 1 : 0;
      return isEn * 2 + isV1; // enをやや優先
    };
    return score(b.attributes) - score(a.attributes);
  };

  items.sort(byPriority);
  const chosen = items[0];
  if (!chosen) return null;
  const file = chosen.attributes.fileName;
  return `https://uploads.mangadex.org/covers/${mangaId}/${file}.256.jpg`;
}

function pickTitle(attributes: MangaDexManga["attributes"]): string {
  // en > ja > 最初のキー
  const main = attributes.title["en"] || attributes.title["ja"];
  if (main) return main;
  const first = Object.values(attributes.title)[0];
  if (first) return first;
  const alt = attributes.altTitles?.find((t) => t.en || t.ja);
  return alt?.en || alt?.ja || "Untitled";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  if (!q) return Response.json({ items: [] });

  // MangaDexで検索
  const searchUrl = `${API}/manga?title=${encodeURIComponent(q)}&limit=${limit}&includes[]=cover_art&order[relevance]=desc`;
  const json = await fetchJson<any>(searchUrl, 300);
  const mangas: MangaDexManga[] = json?.data ?? [];

  // カバーURLを並列取得（過負荷を避けるために最大10並列）
  const concurrency = 10;
  const results: Array<any> = [];
  let i = 0;
  async function worker() {
    while (i < mangas.length) {
      const idx = i++;
      const m = mangas[idx];
      const title = pickTitle(m.attributes);
      let coverUrl: string | null = null;
      try {
        coverUrl = await pickCover(m.id);
      } catch {
        coverUrl = null;
      }
      results[idx] = {
        id: m.id,
        title,
        cover: coverUrl,
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, mangas.length) }, () => worker()));

  return Response.json({ items: results.filter(Boolean) });
}

