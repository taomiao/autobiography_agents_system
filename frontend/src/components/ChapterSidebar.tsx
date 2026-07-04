"use client";

import Link from "next/link";
import type { ChapterBrief } from "@/lib/types";
import { statusLabels } from "@/lib/api";

interface ChapterSidebarProps {
  projectId: string;
  chapters: ChapterBrief[];
  activeChapterId: string;
}

export function ChapterSidebar({ projectId, chapters, activeChapterId }: ChapterSidebarProps) {
  return (
    <aside className="hidden md:block md:w-64 md:shrink-0 md:border-r md:border-stone-200 md:bg-white">
      <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">章节</p>
        <nav className="space-y-1">
          {chapters.map((chapter) => {
            const href =
              chapter.status === "done"
                ? `/project/${projectId}/chapter/${chapter.id}`
                : `/project/${projectId}/interview/${chapter.id}`;
            const active = chapter.id === activeChapterId;
            return (
              <Link
                key={chapter.id}
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-amber-50 font-medium text-amber-800"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <span className="text-xs text-stone-400">第{chapter.order}章</span>
                <p className="mt-0.5 line-clamp-2">{chapter.title}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {statusLabels[chapter.status] || chapter.status}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
