import { NextRequest } from "next/server";

type MangaDexManga = {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description?: Record<string, string>;
    status?: string;
    year?: number;
    contentRating?: string;
    tags?: Array<{ attributes: { name: Record<string, string> } }>;
  };
  relationships?: Array<{ 
    id: string; 
    type: string; 
    attributes?: { 
      name?: string;
      role?: string;
    } 
  }>;
};

const API = "https://api.mangadex.org";

async function fetchJson<T>(url: string, revalidateSec = 3600): Promise<T> {
  const res = await fetch(url, { next: { revalidate: revalidateSec } });
  if (!res.ok) throw new Error(`Upstream error: ${res.status}`);
  return res.json();
}

async function pickCover(mangaId: string): Promise<string | null> {
  try {
    const url = `${API}/cover?manga[]=${mangaId}&limit=100&order[volume]=asc`;
    const data = await fetchJson<any>(url, 2400);
    const covers = data.data || [];
    
    // 英語の1巻カバーを優先
    const enVol1 = covers.find((c: any) => 
      c.attributes?.locale === "en" && 
      c.attributes?.volume === "1"
    );
    if (enVol1) {
      return `https://uploads.mangadex.org/covers/${mangaId}/${enVol1.attributes.fileName}`;
    }
    
    // 1巻カバーがあれば
    const vol1 = covers.find((c: any) => c.attributes?.volume === "1");
    if (vol1) {
      return `https://uploads.mangadex.org/covers/${mangaId}/${vol1.attributes.fileName}`;
    }
    
    // 最初のカバー
    if (covers.length > 0) {
      return `https://uploads.mangadex.org/covers/${mangaId}/${covers[0].attributes.fileName}`;
    }
    
    return null;
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
    const url = `${API}/cover?manga[]=${mangaId}&limit=100&order[volume]=asc`;
    const data = await fetchJson<any>(url, 2400);
    const covers = data.data || [];
    
    if (covers.length === 0) {
      return { totalVolumes: 0, latestVolume: null, volumes: [] };
    }
    
    // 巻数ごとにカバー情報を整理
    const volumeMap = new Map<string, { cover: string | null; locale: string }>();
    
    covers.forEach((cover: any) => {
      const volume = cover.attributes?.volume;
      if (volume) {
        const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}`;
        const locale = cover.attributes?.locale || 'unknown';
        
        // 既存の巻数がない場合、または英語版の場合は更新
        if (!volumeMap.has(volume) || locale === 'en') {
          volumeMap.set(volume, { cover: coverUrl, locale });
        }
      }
    });
    
    // 巻数順にソート
    const sortedVolumes = Array.from(volumeMap.entries())
      .sort(([a], [b]) => {
        const aNum = parseFloat(a) || 0;
        const bNum = parseFloat(b) || 0;
        return aNum - bNum;
      })
      .map(([volume, info]) => ({
        volume,
        cover: info.cover,
        locale: info.locale
      }));
    
    const totalVolumes = sortedVolumes.length;
    const latestVolume = sortedVolumes.length > 0 ? sortedVolumes[sortedVolumes.length - 1].volume : null;
    
    return { totalVolumes, latestVolume, volumes: sortedVolumes };
  } catch {
    return { totalVolumes: 0, latestVolume: null, volumes: [] };
  }
}

async function getAuthorInfo(mangaId: string): Promise<{ authors: string[]; artists: string[] }> {
  try {
    const url = `${API}/manga/${mangaId}?includes[]=author&includes[]=artist`;
    const data = await fetchJson<any>(url, 3600);
    const manga = data.data;
    
    const authors: string[] = [];
    const artists: string[] = [];
    
    manga.relationships?.forEach((rel: any) => {
      if (rel.type === 'author' && rel.attributes?.name) {
        authors.push(rel.attributes.name);
      } else if (rel.type === 'artist' && rel.attributes?.name) {
        artists.push(rel.attributes.name);
      }
    });
    
    return { authors, artists };
  } catch {
    return { authors: [], artists: [] };
  }
}

async function getRelatedWorks(mangaId: string, tags: string[]): Promise<Array<{ id: string; title: string; cover: string | null }>> {
  try {
    if (tags.length === 0) return [];
    
    // 主要なタグを使って類似作品を検索（より柔軟な検索）
    const mainTags = tags.slice(0, 2); // 上位2つのタグを使用
    let searchQuery = "";
    
    // タグが少ない場合は、より一般的な検索を行う
    if (mainTags.length === 1) {
      searchQuery = mainTags[0];
    } else {
      searchQuery = mainTags.join(" ");
    }
    
    // 複数の検索方法を試す
    const searchUrls = [
      `${API}/manga?title=${encodeURIComponent(searchQuery)}&limit=10&includes[]=cover_art&order[relevance]=desc`,
      `${API}/manga?limit=20&includes[]=cover_art&order[followedCount]=desc`, // 人気作品
      `${API}/manga?limit=20&includes[]=cover_art&order[rating]=desc` // 高評価作品
    ];
    
    let allResults: any[] = [];
    
    // 並行して複数の検索を実行
    const searchPromises = searchUrls.map(url => fetchJson<any>(url, 1800));
    const searchResults = await Promise.all(searchPromises);
    
    searchResults.forEach(result => {
      if (result.data) {
        allResults = allResults.concat(result.data);
      }
    });
    
    // 重複を除去し、現在の作品を除外
    const uniqueResults = allResults.filter((m: any, index: number, self: any[]) => 
      m.id !== mangaId && 
      index === self.findIndex((item: any) => item.id === m.id)
    );
    
    // 最大8件まで返す
    const relatedWorks = uniqueResults.slice(0, 8).map((m: any) => {
      const title = m.attributes.title.ja || 
                   m.attributes.title.en || 
                   Object.values(m.attributes.title)[0] || 
                   "タイトルなし";
      
      // カバー画像を取得
      let cover = null;
      if (m.relationships) {
        const coverRel = m.relationships.find((r: any) => r.type === 'cover_art');
        if (coverRel) {
          cover = `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes?.fileName}`;
        }
      }
      
      return { id: m.id, title, cover };
    });
    
    return relatedWorks;
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mangaId } = await params;
    
    // MangaDexから作品情報を取得
    const mangaUrl = `${API}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
    const mangaData = await fetchJson<{ data: MangaDexManga }>(mangaUrl, 3600);
    const manga = mangaData.data;
    
    // 並行して情報を取得
    const [cover, volumeInfo, authorInfo] = await Promise.all([
      pickCover(mangaId),
      getVolumeInfo(mangaId),
      getAuthorInfo(mangaId)
    ]);
    
    // 日本語タイトルを優先、なければ英語タイトル
    const title = manga.attributes.title.ja || 
                  manga.attributes.title.en || 
                  manga.attributes.title.ko || 
                  manga.attributes.title.zh || 
                  Object.values(manga.attributes.title)[0] || 
                  "タイトルなし";
    
    // 日本語説明を優先、なければ英語説明
    const description = manga.attributes.description?.ja || 
                       manga.attributes.description?.en || 
                       manga.attributes.description?.ko || 
                       manga.attributes.description?.zh || 
                       (manga.attributes.description ? Object.values(manga.attributes.description)[0] : "") || 
                       "";
    
    // タグ情報
    const tags = manga.attributes.tags?.map(t => 
      t.attributes.name.ja || t.attributes.name.en || Object.values(t.attributes.name)[0]
    ).filter(Boolean) || [];
    
    // 関連作品を取得
    const relatedWorks = await getRelatedWorks(mangaId, tags);
    
    const result = {
      id: manga.id,
      title,
      description,
      status: manga.attributes.status || "unknown",
      year: manga.attributes.year,
      contentRating: manga.attributes.contentRating || "safe",
      tags,
      cover,
      altTitles: manga.attributes.altTitles?.map(t => 
        Object.values(t)[0]
      ).filter(Boolean) || [],
      // 新しく追加
      totalVolumes: volumeInfo.totalVolumes,
      latestVolume: volumeInfo.latestVolume,
      volumes: volumeInfo.volumes,
      authors: authorInfo.authors,
      artists: authorInfo.artists,
      relatedWorks,
    };
    
    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch manga:", error);
    return Response.json({ error: "Failed to fetch manga" }, { status: 500 });
  }
}
