import Image from "next/image";
import { notFound } from "next/navigation";
import { WORKS } from "@/lib/data";

export function generateStaticParams() {
  return WORKS.map((w) => ({ id: w.id }));
}

export default function WorkDetail({ params }: { params: { id: string } }) {
  const work = WORKS.find((w) => w.id === params.id);
  if (!work) return notFound();

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <article className="max-w-4xl mx-auto grid gap-6 md:grid-cols-[200px_1fr]">
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <Image src={work.cover} alt={work.title} fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{work.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{work.author} ・ {work.volumes}</p>
          <p className="mt-4 leading-7 text-gray-700 dark:text-gray-300">{work.summary}</p>
        </div>
      </article>
    </div>
  );
}
