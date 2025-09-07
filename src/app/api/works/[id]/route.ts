import { NextRequest } from "next/server";

type MangaDexManga = {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description?: Record<string, string>;
    status?: string;
    year?: number | null;
    contentRating?: string;
    tags?: Array<{ attributes?: { name?: Record<string, string> } }>;
  };
  relationships?: Array<{ type: string; id: string; attributes?: any }>;
};

const API = "https://api.mangadex.org";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function pickCover(mangaId: string): Promise<string | null> {
  try {
    const data = await fetchJson<{ data: any[] }>(
      `${API}/cover?manga[]=${mangaId}&order[volume]=asc&limit=50`
    );
    if (!data?.data?.length) return null;
    // 英語/1巻を優先
    const preferred = data.data.find((c: any) => c.attributes?.locale === "en" && c.attributes?.volume === "1");
    const first = preferred ?? data.data[0];
    if (!first) return null;
    const fileName = first.attributes?.fileName;
    return fileName ? `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg` : null;
  } catch {
    return null;
  }
}

async function getVolumeInfo(mangaId: string): Promise<{
  totalVolumes: number;
  latestVolume: string | null;
  volumes: Array<{ volume: string; cover: string | null; locale: string }>;
}> {
  try {
    const data = await fetchJson<{ data: any[] }>(
      `${API}/cover?manga[]=${mangaId}&order[volume]=asc&limit=100`
    );
    const covers = (data?.data ?? []).filter((c) => c?.attributes?.volume);
    const volumes = covers.map((c: any) => ({
      volume: String(c.attributes.volume),
      locale: c.attributes?.locale ?? "en",
      cover: c.attributes?.fileName
        ? `https://uploads.mangadex.org/covers/${mangaId}/${c.attributes.fileName}.256.jpg`
        : null,
    }));
    const totalVolumes = volumes.length;
    const latestVolume = totalVolumes ? volumes[volumes.length - 1].volume : null;
    return { totalVolumes, latestVolume, volumes };
  } catch {
    return { totalVolumes: 0, latestVolume: null, volumes: [] };
  }
}

async function getAuthorInfo(mangaId: string): Promise<{ authors: string[]; artists: string[] }> {
  try {
    const data = await fetchJson<any>(`${API}/manga/${mangaId}?includes[]=author&includes[]=artist`);
    const rels: Array<any> = data?.relationships ?? data?.data?.relationships ?? [];
    const authors = rels.filter((r) => r.type === "author").map((r) => r.attributes?.name).filter(Boolean);
    const artists = rels.filter((r) => r.type === "artist").map((r) => r.attributes?.name).filter(Boolean);
    return { authors, artists };
  } catch {
    return { authors: [], artists: [] };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mangaData = await fetchJson<{ data: MangaDexManga }>(`${API}/manga/${id}`);
    const md = mangaData?.data;
    if (!md) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const [cover, volumeInfo, authorInfo] = await Promise.all([
      pickCover(id),
      getVolumeInfo(id),
      getAuthorInfo(id),
    ]);

    const title = md.attributes.title?.ja || md.attributes.title?.en || Object.values(md.attributes.title ?? {})[0] || "";
    const altTitles: string[] = (md.attributes.altTitles ?? [])
      .map((t) => t.ja || t.en || Object.values(t)[0])
      .filter(Boolean) as string[];
    const description = md.attributes.description?.ja || md.attributes.description?.en || "";
    const status = md.attributes.status ?? "unknown";
    const year = md.attributes.year ?? undefined;
    const contentRating = md.attributes.contentRating ?? "unknown";
    const tags = (md.attributes.tags ?? [])
      .map((t) => t.attributes?.name?.ja || t.attributes?.name?.en)
      .filter(Boolean) as string[];

    const result = {
      id,
      title,
      description,
      status,
      year,
      contentRating,
      tags,
      cover,
      altTitles,
      totalVolumes: volumeInfo.totalVolumes,
      latestVolume: volumeInfo.latestVolume,
      volumes: volumeInfo.volumes,
      authors: authorInfo.authors,
      artists: authorInfo.artists,
      relatedWorks: [] as Array<{ id: string; title: string; cover: string | null }>,
    };

    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch manga:", error);
    return Response.json({ error: "Failed to fetch manga" }, { status: 500 });
  }
}



