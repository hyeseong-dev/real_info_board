"use client";

import { useEffect, useState } from "react";
import type { BoardSnapshot } from "@/lib/domain";
import { formatKst } from "@/lib/time";

const EMPTY: BoardSnapshot = {
  status: "empty",
  latest: null,
  previous: null,
  deltaKms: null,
  message: null,
};

function deltaCopy(delta: number | null): string {
  if (delta === null) return "첫 기록을 기다리고 있어요";
  if (delta === 0) return "이전 기록과 같은 속도예요";
  return `이전 기록보다 ${Math.abs(delta).toFixed(1)} km/s ${delta > 0 ? "빨라졌어요" : "느려졌어요"}`;
}

export function BoardClient() {
  const [snapshot, setSnapshot] = useState<BoardSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);

  async function load(method: "GET" | "POST") {
    setLoading(true);
    try {
      const response = await fetch("/api/board", { method, cache: "no-store" });
      const data = (await response.json()) as BoardSnapshot;
      setSnapshot(data);
    } catch {
      setSnapshot((current) => ({
        ...current,
        status: current.latest ? "stale" : "empty",
        message: "연결을 확인해 주세요. 저장된 값을 표시합니다.",
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/board", { method: "POST", cache: "no-store" })
      .then(async (response) => (await response.json()) as BoardSnapshot)
      .then((data) => { if (!cancelled) setSnapshot(data); })
      .catch(() => {
        if (!cancelled) {
          setSnapshot((current) => ({
            ...current,
            status: current.latest ? "stale" : "empty",
            message: "연결을 확인해 주세요. 저장된 값을 표시합니다.",
          }));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const latest = snapshot.latest;
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="COSMIC PULSE 홈">
          <span className="brand-mark" /> COSMIC PULSE
        </a>
        <span className={`status-pill status-${snapshot.status}`}>
          <span />{snapshot.status === "fresh" ? "최근 확인" : snapshot.status === "stale" ? "업데이트 지연" : "확인 전"}
        </span>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow">TODAY&apos;S SOLAR WIND</div>
        <h1>지금, 지구 앞을<br />지나는 태양풍</h1>
        <p className="lede">숫자가 멈춰도 마지막으로 확인한 순간은 지우지 않습니다.</p>

        <article className="reading-card" aria-live="polite" aria-busy={loading}>
          <div className="orb" aria-hidden="true"><span /></div>
          <div className="reading-top">
            <span>{latest ? `${latest.dayKey} · ${latest.source}` : "관측값 준비 중"}</span>
            <button onClick={() => void load("POST")} disabled={loading}>
              {loading ? "확인 중…" : "새로 조회하기"}
            </button>
          </div>
          <div className="value-row">
            <strong>{latest ? latest.speedKms.toFixed(1) : "—"}</strong>
            <span>km/s</span>
          </div>
          <p className="delta">{deltaCopy(snapshot.deltaKms)}</p>
          {snapshot.message && <p className="notice">{snapshot.message}</p>}
          <dl className="metadata">
            <div><dt>출처</dt><dd>{latest ? "NOAA SWPC · 실시간 태양풍" : "—"}</dd></div>
            <div><dt>관측 시각</dt><dd>{latest ? `${formatKst(latest.observedAtUtc)} KST` : "—"}</dd></div>
            <div><dt>조회 시각</dt><dd>{latest ? `${formatKst(latest.fetchedAtUtc)} KST` : "—"}</dd></div>
            <div><dt>기준 시간대</dt><dd>Asia/Seoul · UTC+09:00</dd></div>
          </dl>
          {latest && <a className="source-link" href={latest.sourceUrl} target="_blank" rel="noreferrer">원자료 열기 ↗</a>}
        </article>
      </section>

      <section className="explain">
        <p className="section-index">01 / WHAT IT MEANS</p>
        <div>
          <h2>태양이 보내온<br />보이지 않는 흐름</h2>
          <p>태양풍은 태양에서 방출되어 우주를 흐르는 입자들의 움직임입니다. 이 화면은 지구 상류의 관측기가 확인한 양성자 속도 하나를 보여줍니다.</p>
        </div>
      </section>

      <footer><span>COSMIC PULSE</span><span>DATA WITH CONTEXT · 2026</span></footer>
    </main>
  );
}
