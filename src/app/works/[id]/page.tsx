import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";

type WorkDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  year?: number;
  contentRating: string;
  tags: string[];
  cover: string | null;
  altTitles: string[];
  totalVolumes: number;
  latestVolume: string | null;
  volumes: Array<{ volume: string; cover: string | null; locale: string }>;
  authors: string[];
  artists: string[];
  relatedWorks: Array<{ id: string; title: string; cover: string | null }>;
};

async function getWorkDetail(id: string): Promise<WorkDetail | null> {
  try {
    console.log(`Fetching work detail for ID: ${id}`);
    // SSRでは絶対URLを使用する必要がある
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
    const res = await fetch(`${baseUrl}/api/works/${id}`, {
      next: { revalidate: 3600 }
    });
    console.log(`API response status: ${res.status}`);
    if (!res.ok) {
      console.error(`API request failed: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    console.log(`API response data:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching work detail:`, error);
    return null;
  }
}

export default async function WorkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`WorkDetail component called with ID: ${id}`);
  
  const work = await getWorkDetail(id);
  if (!work) {
    console.error(`Failed to get work detail for ID: ${id}`);
    return notFound();
  }

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
          ← トップに戻る
        </Link>
        
        <article className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
            {work.cover ? (
              <Image src={work.cover} alt={work.title} fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center text-neutral-400">
                <span className="text-sm">画像なし</span>
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">{work.title}</h1>
            
            {/* 著者・アーティスト情報 */}
            {(work.authors.length > 0 || work.artists.length > 0) && (
              <div className="mb-4">
                {work.authors.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">原作: </span>
                    <span className="text-sm">{work.authors.join(", ")}</span>
                  </div>
                )}
                {work.artists.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">作画: </span>
                    <span className="text-sm">{work.artists.join(", ")}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 巻数情報 */}
            {work.totalVolumes > 0 && (
              <div className="mb-4">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">巻数: </span>
                  <span className="font-medium">
                    {work.totalVolumes}巻
                    {work.latestVolume && work.latestVolume !== "1" && (
                      <span className="text-gray-500">（最新: {work.latestVolume}巻）</span>
                    )}
                  </span>
                </div>
              </div>
            )}
            
            {work.altTitles.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">別題</h3>
                <div className="flex flex-wrap gap-2">
                  {work.altTitles.map((title, i) => (
                    <span key={i} className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-4 space-y-2">
              {work.year && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">公開年: </span>
                  <span>{work.year}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">ステータス: </span>
                <span className="capitalize">{work.status}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">対象年齢: </span>
                <span className="capitalize">{work.contentRating}</span>
              </div>
            </div>
            
            {work.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">概要</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {work.description}
                </p>
              </div>
            )}
            
            {work.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((tag, i) => (
                    <span key={i} className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              データ提供: <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MangaDex</a>
            </div>
          </div>
        </article>
        
        {/* 巻数カバーギャラリー */}
        {work.volumes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">巻数カバー</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {work.volumes.map((volume) => (
                <div key={volume.volume} className="text-center">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 mb-2">
                    {volume.cover ? (
                      <Image 
                        src={volume.cover} 
                        alt={`${work.title} ${volume.volume}巻`} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
                        画像なし
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{volume.volume}巻</div>
                  <div className="text-xs text-gray-500 capitalize">{volume.locale}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* 関連作品 */}
        {work.relatedWorks.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">関連作品</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {work.relatedWorks.map((related) => (
                <Link key={related.id} href={`/works/${related.id}`} className="group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 mb-2 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                    {related.cover ? (
                      <Image 
                        src={related.cover} 
                        alt={related.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
                        画像なし
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {related.title}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
