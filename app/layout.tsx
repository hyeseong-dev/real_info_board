import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "COSMIC PULSE — 오늘의 태양풍",
  description: "실제 태양풍 속도와 데이터 상태를 정직하게 보여주는 정보판",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}

