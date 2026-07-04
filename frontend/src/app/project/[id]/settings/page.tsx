"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [title, setTitle] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getProject(projectId);
      setProject(data);
      setTitle(data.title);
      setStyleNotes(data.style_notes || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const doneChapterCount =
    project?.chapters.filter((c) => c.status === "done").length ?? 0;

  function buildShareUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.updateProject(projectId, {
        title: title.trim(),
        style_notes: styleNotes.trim(),
      });
      setProject(updated);
      setMessage("已保存");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      const result = await api.publishProject(projectId);
      await load();
      setMessage(`已发布，共 ${result.published_chapter_count} 章可阅读`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      await api.unpublishProject(projectId);
      await load();
      setMessage("已取消发布");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCopyLink() {
    if (!project?.share_token) return;
    const url = buildShareUrl(project.share_token);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败，请手动复制链接");
    }
  }

  const activeChapter = project?.chapters[0];
  const shareUrl = project?.share_token ? buildShareUrl(project.share_token) : "";

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-24 pt-6">
      <header className="mb-6">
        <Link href={`/project/${projectId}`} className="text-sm text-amber-700">
          ← 返回
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">项目设置</h1>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="mb-8 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-stone-900">发布与分享</h2>
        <p className="mt-2 text-sm text-stone-600">
          发布后，已完成章节可通过专属链接公开阅读（无需登录）。
        </p>
        <p className="mt-1 text-sm text-stone-500">
          已完成章节：{doneChapterCount} / {project?.chapters.length ?? 0}
        </p>

        {project?.is_published && project.share_token ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-stone-50 px-3 py-2">
              <p className="text-xs text-stone-400">分享链接</p>
              <p className="mt-1 break-all text-sm text-amber-800">{shareUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-medium text-white"
              >
                {copied ? "已复制" : "复制链接"}
              </button>
              <Link
                href={`/share/${project.share_token}`}
                target="_blank"
                className="flex-1 rounded-xl border border-stone-300 py-3 text-center text-sm font-medium text-stone-700"
              >
                预览
              </Link>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || doneChapterCount === 0}
              className="w-full rounded-xl border border-amber-300 py-3 text-sm font-medium text-amber-800 disabled:opacity-50"
            >
              {publishing ? "更新中..." : "更新发布内容"}
            </button>
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={publishing}
              className="w-full rounded-xl border border-stone-300 py-3 text-sm text-stone-600"
            >
              取消发布
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || doneChapterCount === 0}
            className="mt-4 w-full rounded-xl bg-amber-600 py-3 font-medium text-white disabled:opacity-50"
          >
            {publishing ? "发布中..." : "发布自传"}
          </button>
        )}
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">自传标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">写作风格</label>
          <textarea
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            rows={4}
            placeholder="如：第一人称、温情真实、适合家人阅读"
            className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-stone-800 py-3 font-medium text-white disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </form>

      <BottomNav projectId={projectId} activeChapterId={activeChapter?.id} />
    </main>
  );
}
