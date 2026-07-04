"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, statusLabels } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const project = await api.createProject(title.trim());
      window.location.href = `/project/${project.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 pb-8 pt-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-amber-700">自传 Agent</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          写下您的人生故事
        </h1>
        <p className="mt-3 text-stone-600">
          AI 记者主动采访，按章节书写，支持精准修改。
        </p>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-300"
              >
                <h2 className="font-semibold text-stone-900">{project.title}</h2>
                <p className="mt-1 text-sm text-stone-500">
                  {statusLabels[project.status]} · {project.chapters.length} 章
                </p>
              </Link>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={handleCreate} className="mt-6 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="自传标题，如：我的人生回忆录"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-amber-600 py-3 font-medium text-white disabled:opacity-60"
                >
                  {creating ? "创建中..." : "开始创作"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-stone-300 px-4 py-3 text-stone-600"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 w-full rounded-xl bg-amber-600 py-3.5 font-medium text-white shadow-sm hover:bg-amber-700"
            >
              + 新建自传
            </button>
          )}
        </>
      )}
    </main>
  );
}
