"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BoardSnapshot } from "@/lib/domain";
import { formatKst } from "@/lib/time";
import { SolarObservation } from "./solar-observation";
import { diaryCopy } from "@/lib/diary";

const EMPTY: BoardSnapshot = {
  status: "empty",
  latest: null,
  previous: null,
  deltaKms: null,
  message: null,
};

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
  const diary = diaryCopy(snapshot, new Date());
  const history = snapshot.history ?? [snapshot.latest, snapshot.previous].filter((record) => record !== null);
  return (
    <main className="diary-page">
      <nav className="nav">
        <a className="brand" href="#top" aria-label="COSMIC PULSE 홈">
          <span className="brand-mark" /> COSMIC PULSE
        </a>
        <span className="station-label">ORBITAL OBSERVATORY <span>/ 관측 일지</span></span>
        <span className={`status-pill status-${snapshot.status}`}>
          <span />{snapshot.status === "fresh" ? "최근 확인" : snapshot.status === "stale" ? "업데이트 지연" : "확인 전"}
        </span>
      </nav>

      <section className="hero" id="top">
        <div className="hero-intro">
          <div className="hero-copy">
            <div className="eyebrow">YOUR DAILY SPACE JOURNAL</div>
            <p className="diary-tagline">매일 한 장, 지구 앞 우주의 기록</p>
            <h1 aria-live="polite">{loading && !latest ? "오늘의 우주를 확인하고 있어요." : diary.title}</h1>
            <p className="lede">{latest ? `${latest.dayKey} · KST 관측 일지` : "공개 관측으로 시작하는 오늘의 한 장"}</p>

        <article className="reading-card" id="solar-wind" aria-live="polite" aria-busy={loading}>
          <p className="eyebrow">SOLAR WIND · 지구 상류의 양성자 속도</p>
          <div className="reading-top">
            <span>{latest ? `${latest.dayKey} · ${latest.source}` : "관측값 준비 중"}</span>
            <button onClick={() => void load("POST")} disabled={loading}>
              {loading ? "확인 중…" : snapshot.status === "stale" ? "다시 시도" : "최신 상태 확인"}
            </button>
          </div>
          <div className="value-row">
            <strong>{latest ? latest.speedKms.toFixed(1) : "—"}</strong>
            <span>km/s</span>
          </div>
          <p className="delta">{diary.comparison}</p>
          <p className="reading-context">하루 평균이 아닌, 각 날짜의 마지막 정상 조회값을 비교합니다.</p>
          {snapshot.message && <p className="notice">{snapshot.message}</p>}
          <dl className="metadata">
            <div><dt>출처</dt><dd>{latest ? "NOAA SWPC · 실시간 태양풍" : "—"}</dd></div>
            <div><dt>관측 시각</dt><dd>{latest ? `${formatKst(latest.observedAtUtc)} KST` : "—"}</dd></div>
            <div><dt>조회 시각</dt><dd>{latest ? `${formatKst(latest.fetchedAtUtc)} KST` : "—"}</dd></div>
            <div><dt>기준 시간대</dt><dd>Asia/Seoul · UTC+09:00</dd></div>
          </dl>
          {latest && <a className="source-link" href={latest.sourceUrl} target="_blank" rel="noreferrer">원자료 열기 ↗</a>}
        </article>
          </div>
          <div className="diary-visual">
            <SolarObservation />
            <p className="visual-note">오늘의 관측 장면<br /><span>태양에서 시작된 흐름을 떠올리며, 오늘의 숫자를 읽어보세요.</span></p>
          </div>
        </div>
        <a className="explore-link" href="#daily-log">날짜별 기록 펼쳐보기 <span aria-hidden="true">↓</span></a>
      </section>

      <section className="daily-log" id="daily-log" aria-labelledby="daily-log-title">
        <div className="log-heading"><div><p className="eyebrow">01 / COLLECTING THE DAYS</p><h2 id="daily-log-title">우주도, 하루 한 줄.</h2></div><span>최근 {history.length}개 날짜 · KST</span></div>
        <p className="log-description">성공적으로 조회한 날짜만 남깁니다. 같은 날 다시 확인하면 그날의 기록을 갱신하며, 수집하지 않은 날은 채워 넣지 않습니다.</p>
        {history.length === 0 ? <p className="log-empty">아직 저장된 관측이 없어요. 첫 정상 조회가 완료되면 여기에 기록됩니다.</p> : (
          <ol className="log-list">
            {history.map((record, index) => (
              <li key={record.dayKey}>
                <div className="log-day"><span>{index === 0 ? "최근 기록" : "보관된 기록"}</span><time dateTime={record.dayKey}>{record.dayKey}</time></div>
                <strong>{record.speedKms.toFixed(1)} <small>km/s</small></strong>
                <div className="log-times"><span>관측 {formatKst(record.observedAtUtc)} KST</span><span>조회 {formatKst(record.fetchedAtUtc)} KST</span></div>
                <a href={record.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${record.dayKey} NOAA 원천 URL 열기`}>NOAA ↗</a>
              </li>
            ))}
          </ol>
        )}
        <Link className="source-link" href="/evidence">첫 두 날짜의 고정 수집 근거 확인 ↗</Link>
      </section>

      <section className="explain">
        <p className="section-index">02 / ACROSS THE SPACE</p>
        <div>
          <h2>숫자 하나로 읽는<br />오늘의 우주</h2>
          <p>태양풍은 태양에서 방출되어 우주를 흐르는 입자들의 움직임입니다. 이 화면은 지구 상류의 관측기가 확인한 양성자 속도 하나를 보여줍니다.</p>
          <p>태양 이미지와 태양풍 수치는 서로 다른 장비와 위치에서 관측한 자료입니다. 이미지 속 활동이 지금의 속도를 직접 설명하는 것은 아닙니다.</p>
          <p>속도가 빨라졌다는 사실만으로 지구의 위험이나 오로라 발생을 판단하지 않습니다. 데이터가 늦으면 마지막 정상 기록과 지연 이유를 함께 남깁니다.</p>
        </div>
      </section>

      <section className="lab-cta">
        <p>실패 상태와 실제 수집 근거를 직접 확인해 보세요.</p>
        <div><Link href="/evidence">실제 기록 근거 ↗</Link><Link href="/lab">검증 실험실 ↗</Link></div>
      </section>

      <footer><span>COSMIC PULSE</span><span>ONE DAY, ONE RECORD · KST</span></footer>
    </main>
  );
}
