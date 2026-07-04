"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { InterviewMessage, ProjectDetail } from "@/lib/types";
import { ChatBubble } from "@/components/ChatBubble";
import { BottomNav } from "@/components/BottomNav";
import { ChapterSidebar } from "@/components/ChapterSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function InterviewChatPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const chapterId = params.chapterId as string;

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [writing, setWriting] = useState(false);
  const [suggestedAction, setSuggestedAction] = useState<string>("continue");
  const [error, setError] = useState("");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = useCallback(async () => {
    try {
      const [data, proj] = await Promise.all([
        api.getInterviewMessages(chapterId),
        api.getProject(projectId),
      ]);
      setProject(proj);
      setMessages(data);
      if (data.length === 0) {
        const result = await api.startInterview(chapterId);
        setSuggestedAction(result.suggested_action || "continue");
        const refreshed = await api.getInterviewMessages(chapterId);
        setMessages(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [chapterId, projectId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    setError("");

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const result = await api.submitAnswer(chapterId, content);
      setSuggestedAction(result.suggested_action || "continue");
      const refreshed = await api.getInterviewMessages(chapterId);
      setMessages(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  function handleWrite() {
    setWriting(true);
    setError("");
    router.push(`/project/${projectId}/chapter/${chapterId}?writing=1`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <LoadingSpinner label="准备采访..." />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl">
      {project && (
        <ChapterSidebar
          projectId={projectId}
          chapters={project.chapters}
          activeChapterId={chapterId}
        />
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col md:max-w-none md:flex-1">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link href={`/project/${projectId}`} className="text-sm text-amber-700">
          ← 章节列表
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-stone-900">章节采访</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {suggestedAction === "write_chapter" && (
          <div className="my-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm text-green-800">本章素材已较充分，可以开始写作了。</p>
            <button
              onClick={handleWrite}
              disabled={writing}
              className="mt-3 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white"
            >
              开始撰写本章
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="fixed bottom-16 inset-x-0 z-20 border-t border-stone-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] mx-auto max-w-lg"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="分享您的故事..."
            className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-base outline-none focus:border-amber-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-amber-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </form>

      <BottomNav projectId={projectId} activeChapterId={chapterId} />
      </div>
    </main>
  );
}
