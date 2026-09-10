import type { Metadata } from "next";
import { Noto_Sans_KR, Rajdhani } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_KR({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const instrumentFont = Rajdhani({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "COSMIC PULSE — 매일 한 장, 지구 앞 우주의 기록",
  description: "오늘의 태양풍과 이전 날짜의 변화를 읽는 우주 관측 일지. 실제 기록, 출처와 관측 시각, 데이터 지연까지 정직하게 보여줍니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${instrumentFont.variable}`}>
        <div className="station-sky" aria-hidden="true">
          <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
            {Array.from({ length: 180 }, (_, i) => (
              <circle key={i} cx={(i * 379 + 71) % 1600} cy={(i * i * 23 + i * 191 + 47) % 1000} r={i % 11 === 0 ? 1.6 : i % 3 === 0 ? 1 : .55} fill={i % 4 === 0 ? "#93ccff" : "#e1efff"} opacity={.25 + (i % 6) * .12} />
            ))}
            <g className="sky-beacons" stroke="#c1e9ff" strokeWidth=".6" opacity=".65">
              <path d="M1270 130v14m-7-7h14 M160 390v10m-5-5h10 M1440 780v14m-7-7h14 M620 86v10m-5-5h10" />
            </g>
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
