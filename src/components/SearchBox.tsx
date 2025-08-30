"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type SearchItem = { id: string; title: string; cover: string | null };

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const v = q.trim();
    if (!v) {
      setItems([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(v)}&limit=24`, { signal: ac.signal });
        if (!res.ok) throw new Error("search failed");
        const json = await res.json();
        setItems(json.items ?? []);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="max-w-2xl w-full">
      <label className="block text-sm font-medium mb-2">作品検索</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="タイトルで検索（MangaDex）"
        className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 bg-white dark:bg-neutral-900 text-black dark:text-white"
      />
      {(q || loading) && (
        <div className="mt-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="mt-2 text-sm text-gray-500">検索中...</div>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              <div className="mb-2">🔍</div>
              <div>該当する作品が見つかりませんでした</div>
              <div className="text-xs mt-1">別のキーワードで試してみてください</div>
            </div>
          )}
          {!loading && items.map((w) => (
            <Link 
              key={w.id} 
              href={`/works/${w.id}`} 
              className="flex gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            >
              <div className="relative w-12 h-16 flex-none overflow-hidden rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                {w.cover ? (
                  <Image src={w.cover} alt={w.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
                    画像なし
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium leading-5 text-gray-900 dark:text-gray-100 truncate">
                  {w.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">MangaDex</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  詳細を見る →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
