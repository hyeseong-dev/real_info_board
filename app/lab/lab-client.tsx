"use client";

import { useState } from "react";
import Link from "next/link";
import type { SyntheticFailureCode, SyntheticRun } from "@/lib/domain";

const scenarios: Array<{ code: SyntheticFailureCode; label: string }> = [
  { code: "slow_response", label: "느린 응답" },
  { code: "upstream_denied", label: "접근 거절" },
  { code: "rate_limited", label: "호출 제한" },
  { code: "offline", label: "오프라인" },
  { code: "format_changed", label: "형식 변경" },
];

export function LabClient() {
  const [result, setResult] = useState<SyntheticRun | null>(null);
  const [loading, setLoading] = useState(false);

  async function replay(fixture: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixture }),
      });
      setResult((await response.json()) as SyntheticRun);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="lab-shell">
      <nav className="lab-nav"><Link href="/">← 오늘의 태양풍</Link><span>검증 실험실</span></nav>
      <section className="lab-intro">
        <p className="eyebrow">ALTERNATIVE T04 REPLAY LAB</p>
        <h1>실패해도<br />사실은 남아야 하니까</h1>
        <p>공식 과제 asset이 제공되지 않아 승인된 공개 대체 패키지 ALT-T04-COSMIC-PULSE-V1을 사용합니다. 합성값은 실제 기록과 저장 공간을 공유하지 않습니다.</p>
      </section>
      <section className="scenario-grid" aria-label="합성 실패 선택">
        {scenarios.map((scenario) => (
          <button key={scenario.code} disabled={loading} onClick={() => void replay(scenario.code)}>
            <span>{scenario.label}</span><small>{scenario.code}</small>
          </button>
        ))}
      </section>
      <section className="lab-result" aria-live="polite">
        {result ? (
          <>
            <div className="result-head"><span className={`status-pill status-${result.status}`}><span />{result.status}</span><code>{result.fixtureId}</code></div>
            <strong>{result.lastGoodValue.toFixed(1)} <small>km/s</small></strong>
            <h2>{result.label}</h2><p>{result.explanation}</p>
            <dl>
              <div><dt>error_code</dt><dd>{result.errorCode ?? "none"}</dd></div>
              <div><dt>일별 기록</dt><dd>{result.dailyCount}건</dd></div>
              <div><dt>행 변화</dt><dd>{result.rowsBeforeAction} → {result.rowsAfterAction} ({result.rowsAdded >= 0 ? "+" : ""}{result.rowsAdded})</dd></div>
              <div><dt>저장 보존</dt><dd>{result.statePreserved ? "확인" : "불일치"}</dd></div>
              <div><dt>격리 저장소</dt><dd>{result.storageIsolation}</dd></div>
              <div><dt>마지막 관측 시각</dt><dd>{result.lastGoodObservedAtUtc}</dd></div>
              <div><dt>마지막 조회 시각</dt><dd>{result.lastGoodFetchedAtUtc}</dd></div>
            </dl>
            <button className="recover" disabled={loading} onClick={() => void replay("ALT-T04-RECOVER-D2")}>{result.action} · D2 복구 재생</button>
          </>
        ) : <p className="result-empty">실패 상황 하나를 선택하면 상태와 보존 결과가 여기에 나타납니다.</p>}
      </section>
    </main>
  );
}
