import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { StartupGate } from "@/components/StartupGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "自传 Agent",
  description: "AI 驱动的自传写作助手 — 采访、写作、精准修改",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <StartupGate>{children}</StartupGate>
      </body>
    </html>
  );
}
