"use client";

type SplashScreenProps = {
  exiting?: boolean;
  status: "connecting" | "ready" | "offline";
};

const statusText = {
  connecting: "正在连接服务...",
  ready: "准备就绪",
  offline: "服务未连接，仍可浏览界面",
};

export function SplashScreen({ exiting = false, status }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-[#faf9f7] to-stone-100 px-6 transition-opacity duration-500 ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={exiting}
    >
      <div className="splash-rise flex flex-col items-center text-center">
        <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-3xl bg-amber-200/40 splash-pulse" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-3xl font-bold text-white shadow-lg shadow-amber-900/20">
            自
          </span>
        </div>

        <p className="text-sm font-medium tracking-widest text-amber-700">AUTOBIOGRAPHY AGENT</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">自传 Agent</h1>
        <p className="mt-3 max-w-xs text-base text-stone-600">AI 记者主动采访，按章节书写人生故事</p>

        <div className="mt-10 w-48 overflow-hidden rounded-full bg-stone-200/80">
          <div
            className={`h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 ${
              status === "ready" ? "w-full transition-all duration-300" : "splash-progress w-2/3"
            }`}
          />
        </div>

        <p className="mt-4 text-sm text-stone-500">{statusText[status]}</p>
      </div>

      <p className="absolute bottom-10 text-xs text-stone-400">采访 · 写作 · 珍藏</p>
    </div>
  );
}
