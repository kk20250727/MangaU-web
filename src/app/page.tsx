import Image from "next/image";
import Link from "next/link";
import { WORKS } from "@/lib/data";
import SearchBox from "@/components/SearchBox";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">マンガレビュー（仮）</h1>
        <p className="text-sm text-gray-500 mt-1">読みたい作品が見つかる</p>
      </header>

      <div className="mb-8">
        <SearchBox />
      </div>

      <main>
        <section>
          <h2 className="text-xl font-semibold mb-4">ピックアップ</h2>
          <ul className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {WORKS.map((w) => (
              <li key={w.id} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <Link href={`/works/${w.id}`} className="block">
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={w.cover}
                      alt={w.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold line-clamp-2">{w.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{w.author} ・ {w.volumes}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{w.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
