"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, streamWriteChapter } from "@/lib/api";
import type { ChapterDetail, EditPreview, ProjectDetail, Revision } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { ChapterSidebar } from "@/components/ChapterSidebar";
import { DiffPreview } from "@/components/DiffPreview";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type ViewMode = "read" | "manual";

function ChapterEditorContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const chapterId = params.chapterId as string;
  const shouldWrite = searchParams.get("writing") === "1";

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState<EditPreview | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("read");
  const [manualDraft, setManualDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const [ch, revs, proj] = await Promise.all([
        api.getChapter(chapterId),
        api.listRevisions(chapterId),
        api.getProject(projectId),
      ]);
      setChapter(ch);
      setRevisions(revs);
      setProject(proj);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [chapterId, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!shouldWrite || !chapter || chapter.content_md) return;
    setStreaming(true);
    setStreamContent("");
    const close = streamWriteChapter(
      chapterId,
      (token) => setStreamContent((prev) => prev + token),
      () => {
        setStreaming(false);
        load();
      },
      (msg) => {
        setError(msg);
        setStreaming(false);
      },
    );
    return close;
  }, [shouldWrite, chapter, chapterId, load]);

  function enterManualEdit() {
    setManualDraft(chapter?.content_md || streamContent || "");
    setViewMode("manual");
    setPreview(null);
    setInstruction("");
    setError("");
  }

  function cancelManualEdit() {
    setViewMode("read");
    setManualDraft("");
    setError("");
  }

  async function saveManualEdit() {
    setBusy(true);
    setError("");
    try {
      const updated = await api.updateChapter(chapterId, manualDraft);
      setChapter(updated);
      setViewMode("read");
      setManualDraft("");
      const revs = await api.listRevisions(chapterId);
      setRevisions(revs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function handlePreviewEdit() {
    if (!instruction.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.previewEdit(chapterId, instruction.trim());
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成修改预览失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyEdit() {
    if (!preview) return;
    setBusy(true);
    try {
      const updated = await api.applyEdit(chapterId, preview.revision_id);
      setChapter(updated);
      setPreview(null);
      setInstruction("");
      const revs = await api.listRevisions(chapterId);
      setRevisions(revs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "应用修改失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleRollback(revisionId: string) {
    setBusy(true);
    try {
      const updated = await api.rollbackRevision(chapterId, revisionId);
      setChapter(updated);
      const revs = await api.listRevisions(chapterId);
      setRevisions(revs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "回滚失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleWrite() {
    setStreaming(true);
    setStreamContent("");
    streamWriteChapter(
      chapterId,
      (token) => setStreamContent((prev) => prev + token),
      () => {
        setStreaming(false);
        load();
      },
      (msg) => {
        setError(msg);
        setStreaming(false);
      },
    );
  }

  const displayContent = streaming ? streamContent : chapter?.content_md || "";
  const hasContent = Boolean(displayContent);
  const manualDirty = manualDraft !== (chapter?.content_md || "");

  if (loading) {
    return <LoadingSpinner label="加载章节..." />;
  }

  if (!chapter) {
    return <p className="py-10 text-center text-stone-500">章节不存在</p>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl">
      {project && viewMode === "read" && (
        <ChapterSidebar
          projectId={projectId}
          chapters={project.chapters}
          activeChapterId={chapterId}
        />
      )}
      <div className="mx-auto w-full max-w-lg md:max-w-none md:flex-1">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
          <Link href={`/project/${projectId}`} className="text-sm text-amber-700">
            ← 章节列表
          </Link>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-stone-900">
              第 {chapter.order} 章 · {chapter.title}
            </h1>
            {!streaming && (
              <div className="flex shrink-0 gap-1 rounded-lg bg-stone-100 p-0.5">
                <button
                  onClick={() => setViewMode("read")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    viewMode === "read"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  阅读
                </button>
                <button
                  onClick={enterManualEdit}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    viewMode === "manual"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500"
                  }`}
                >
                  编辑
                </button>
              </div>
            )}
          </div>
        </header>

        <div className={`px-4 py-4 ${viewMode === "manual" ? "pb-36" : "pb-48"}`}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {viewMode === "manual" ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">
                直接编辑章节正文，段落之间空一行。支持 Markdown 格式。
              </p>
              <textarea
                value={manualDraft}
                onChange={(e) => setManualDraft(e.target.value)}
                placeholder="在此撰写或修改章节内容..."
                className="min-h-[60vh] w-full resize-y rounded-xl border border-stone-300 px-4 py-3 text-[15px] leading-relaxed text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                autoFocus
              />
              <p className="text-right text-xs text-stone-400">{manualDraft.length} 字</p>
            </div>
          ) : (
            <>
              {!hasContent && !streaming && (
                <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center">
                  <p className="text-stone-500">本章尚未撰写</p>
                  <Link
                    href={`/project/${projectId}/interview/${chapterId}`}
                    className="mt-3 inline-block text-sm text-amber-700"
                  >
                    先去采访 →
                  </Link>
                  <button
                    onClick={handleWrite}
                    className="mt-4 block w-full rounded-xl bg-amber-600 py-3 font-medium text-white"
                  >
                    AI 开始写作
                  </button>
                  <button
                    onClick={enterManualEdit}
                    className="mt-2 block w-full rounded-xl border border-stone-300 py-3 font-medium text-stone-700"
                  >
                    手动撰写
                  </button>
                </div>
              )}

              {(hasContent || streaming) && (
                <article className="prose-chapter whitespace-pre-wrap text-stone-800">
                  {displayContent}
                  {streaming && (
                    <span className="inline-block h-4 w-1 animate-pulse bg-amber-600 align-middle" />
                  )}
                </article>
              )}

              {preview && (
                <div className="mt-6 space-y-3">
                  <DiffPreview before={preview.content_before} after={preview.content_after} />
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyEdit}
                      disabled={busy}
                      className="flex-1 rounded-xl bg-green-600 py-3 font-medium text-white"
                    >
                      确认修改
                    </button>
                    <button
                      onClick={() => setPreview(null)}
                      className="rounded-xl border border-stone-300 px-4 py-3 text-stone-600"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {revisions.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-sm font-medium text-stone-500">修改历史</h2>
                  <ul className="mt-2 space-y-2">
                    {revisions.map((rev) => (
                      <li
                        key={rev.id}
                        className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
                      >
                        <span className="line-clamp-1 flex-1 text-stone-700">{rev.instruction}</span>
                        {rev.applied && (
                          <button
                            onClick={() => handleRollback(rev.id)}
                            disabled={busy}
                            className="ml-2 shrink-0 text-amber-700"
                          >
                            回滚
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {viewMode === "manual" && (
          <div className="fixed bottom-16 inset-x-0 z-20 border-t border-stone-200 bg-white px-4 py-3 mx-auto max-w-lg">
            <div className="flex gap-2">
              <button
                onClick={cancelManualEdit}
                disabled={busy}
                className="flex-1 rounded-xl border border-stone-300 py-3 font-medium text-stone-600"
              >
                取消
              </button>
              <button
                onClick={saveManualEdit}
                disabled={busy || !manualDirty}
                className="flex-1 rounded-xl bg-amber-600 py-3 font-medium text-white disabled:opacity-50"
              >
                {busy ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        )}

        {viewMode === "read" && hasContent && !streaming && (
          <div className="fixed bottom-16 inset-x-0 z-20 border-t border-stone-200 bg-white px-4 py-3 mx-auto max-w-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="AI 修改指令，如：第二段改得更温情"
                className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
              />
              <button
                onClick={handlePreviewEdit}
                disabled={busy || !instruction.trim()}
                className="rounded-full bg-stone-800 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                AI 预览
              </button>
            </div>
          </div>
        )}

        <BottomNav projectId={projectId} activeChapterId={chapterId} />
      </div>
    </main>
  );
}

export default function ChapterEditorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChapterEditorContent />
    </Suspense>
  );
}
