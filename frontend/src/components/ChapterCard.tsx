import Link from "next/link";
import type { ChapterBrief } from "@/lib/types";
import { statusLabels } from "@/lib/api";

interface ChapterCardProps {
  projectId: string;
  chapter: ChapterBrief;
}

const statusColors: Record<string, string> = {
  pending: "bg-stone-100 text-stone-600",
  interviewing: "bg-amber-100 text-amber-800",
  drafting: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export function ChapterCard({ projectId, chapter }: ChapterCardProps) {
  const action =
    chapter.status === "done"
      ? `/project/${projectId}/chapter/${chapter.id}`
      : `/project/${projectId}/interview/${chapter.id}`;

  return (
    <Link
      href={action}
      className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-stone-400">第 {chapter.order} 章</p>
          <h3 className="mt-1 text-base font-semibold text-stone-900">{chapter.title}</h3>
          {chapter.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-stone-500">{chapter.summary}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            statusColors[chapter.status] || statusColors.pending
          }`}
        >
          {statusLabels[chapter.status] || chapter.status}
        </span>
      </div>
    </Link>
  );
}
