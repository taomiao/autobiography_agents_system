"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  projectId: string;
  activeChapterId?: string;
}

export function BottomNav({ projectId, activeChapterId }: BottomNavProps) {
  const pathname = usePathname();
  const interviewHref = activeChapterId
    ? `/project/${projectId}/interview/${activeChapterId}`
    : `/project/${projectId}`;
  const chapterHref = activeChapterId
    ? `/project/${projectId}/chapter/${activeChapterId}`
    : `/project/${projectId}`;

  const tabs = [
    { href: interviewHref, label: "采访", match: "/interview/" },
    { href: `/project/${projectId}`, label: "章节", match: `/project/${projectId}` },
    { href: `/project/${projectId}/settings`, label: "设置", match: "/settings" },
    { href: chapterHref, label: "阅读", match: "/chapter/" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active =
            tab.match === `/project/${projectId}`
              ? pathname === tab.match
              : pathname.includes(tab.match);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                active ? "text-amber-700" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
