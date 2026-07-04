"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PublishedProject } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ShareReadPage() {
  const params = useParams();
  const token = params.token as string;
  const [book, setBook] = useState<PublishedProject | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chapterTopRef = useRef<HTMLElement>(null);
  const skipScrollRef = useRef(true);

  const goToChapter = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    chapterTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex]);

  const load = useCallback(async () => {
    try {
      const data = await api.getPublicShare(token);
      setBook(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法加载分享内容");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16">
        <LoadingSpinner label="加载中..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
        <p className="text-center text-stone-600">{error || "内容不存在"}</p>
        <Link href="/" className="mt-4 text-sm text-amber-700">
          返回首页
        </Link>
      </main>
    );
  }

  const chapter = book.chapters[activeIndex];

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#faf9f7]">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#faf9f7]/95 px-4 py-4 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">自传分享</p>
        <h1 className="mt-1 text-xl font-bold text-stone-900">{book.title}</h1>
        {book.published_at && (
          <p className="mt-1 text-xs text-stone-400">
            发布于 {new Date(book.published_at).toLocaleDateString("zh-CN")}
          </p>
        )}
      </header>

      {book.chapters.length > 1 && (
        <nav className="flex gap-2 overflow-x-auto border-b border-stone-200 px-4 py-3">
          {book.chapters.map((ch, idx) => (
            <button
              key={ch.order}
              onClick={() => goToChapter(idx)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                idx === activeIndex
                  ? "bg-amber-600 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              第{ch.order}章
            </button>
          ))}
        </nav>
      )}

      <article
        ref={chapterTopRef}
        className={`scroll-mt-36 px-4 py-6 ${
          book.chapters.length > 1
            ? "pb-[calc(6rem+env(safe-area-inset-bottom))]"
            : "pb-12"
        }`}
      >
        <h2 className="mb-4 text-lg font-semibold text-stone-900">
          第 {chapter.order} 章 · {chapter.title}
        </h2>
        <div className="prose-chapter whitespace-pre-wrap text-[16px] leading-[1.85] text-stone-800">
          {chapter.content_md}
        </div>
      </article>

      {book.chapters.length > 1 && (
        <footer className="fixed bottom-0 inset-x-0 border-t border-stone-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg gap-2">
            <button
              onClick={() => goToChapter(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm text-stone-700 disabled:opacity-40"
            >
              上一章
            </button>
            <button
              onClick={() => goToChapter(Math.min(book.chapters.length - 1, activeIndex + 1))}
              disabled={activeIndex === book.chapters.length - 1}
              className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              下一章
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
