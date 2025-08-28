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
        className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 bg-white dark:bg-neutral-900"
      />
      {(q || loading) && (
        <div className="mt-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-100 dark:divide-neutral-800">
          {loading && <div className="p-3 text-sm text-gray-500">検索中...</div>}
          {!loading && items.length === 0 && (
            <div className="p-3 text-sm text-gray-500">該当なし</div>
          )}
          {!loading && items.map((w) => (
            <Link key={w.id} href={`/works/${w.id}`} className="flex gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <div className="relative w-10 h-14 flex-none overflow-hidden rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                {w.cover && <Image src={w.cover} alt={w.title} fill className="object-cover" />}
              </div>
              <div>
                <div className="font-medium leading-5">{w.title}</div>
                <div className="text-xs text-gray-500">MangaDex</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
