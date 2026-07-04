"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, statusLabels } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";
import { ChapterCard } from "@/components/ChapterCard";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [background, setBackground] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePlan() {
    setPlanning(true);
    setError("");
    try {
      const data = await api.planProject(projectId, background);
      setProject(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "规划失败");
    } finally {
      setPlanning(false);
    }
  }

  const activeChapter =
    project?.chapters.find((c) => c.status !== "done") || project?.chapters[0];

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10 text-center text-stone-500">
        项目不存在
      </div>
    );
  }

  const needsPlan = project.chapters.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-24 pt-6">
      <header className="mb-6">
        <Link href="/" className="text-sm text-amber-700">
          ← 返回
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{project.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <span>{statusLabels[project.status]} · 共 {project.chapters.length} 章</span>
          {project.is_published && (
            <Link
              href={`/project/${projectId}/settings`}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
            >
              已发布
            </Link>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {needsPlan ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-stone-900">规划章节大纲</h2>
          <p className="mt-2 text-sm text-stone-600">
            简单介绍您的背景，AI 将为您规划自传章节结构。
          </p>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="例如：我今年 65 岁，退休教师，想为孙辈留下人生回忆..."
            rows={4}
            className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handlePlan}
            disabled={planning}
            className="mt-3 w-full rounded-xl bg-amber-600 py-3 font-medium text-white disabled:opacity-60"
          >
            {planning ? "规划中..." : "生成章节大纲"}
          </button>
        </section>
      ) : (
        <div className="space-y-3">
          {project.chapters.map((chapter) => (
            <ChapterCard key={chapter.id} projectId={projectId} chapter={chapter} />
          ))}
        </div>
      )}

      {activeChapter && !needsPlan && (
        <Link
          href={`/project/${projectId}/interview/${activeChapter.id}`}
          className="mt-6 block rounded-xl bg-amber-600 py-3.5 text-center font-medium text-white shadow-sm"
        >
          继续采访：{activeChapter.title}
        </Link>
      )}

      <BottomNav projectId={projectId} activeChapterId={activeChapter?.id} />
    </main>
  );
}
