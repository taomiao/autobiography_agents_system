"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "./SplashScreen";

const MIN_SPLASH_MS = 1600;
const EXIT_MS = 500;

function getHealthUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6986/api";
  return api.replace(/\/api\/?$/, "/health");
}

async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(getHealthUrl(), { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

export function StartupGate({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [status, setStatus] = useState<"connecting" | "ready" | "offline">("connecting");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const [, healthy] = await Promise.all([
        new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS)),
        checkBackendHealth(),
      ]);

      if (cancelled) return;

      setStatus(healthy ? "ready" : "offline");
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;

      setExiting(true);
      setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, EXIT_MS);
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {visible && <SplashScreen exiting={exiting} status={status} />}
      <div className={visible && !exiting ? "invisible" : ""}>{children}</div>
    </>
  );
}
