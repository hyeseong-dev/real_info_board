import Link from "next/link";
import { evidenceRecords } from "@/lib/repository";
import { formatKst } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const records = await evidenceRecords();
  const delta = records.length === 2 ? records[1].speedKms - records[0].speedKms : null;
  return (
    <main className="evidence-shell">
      <nav className="lab-nav"><Link href="/">← 오늘의 태양풍</Link><span>실제 기록 근거</span></nav>
      <header className="evidence-head">
        <p className="eyebrow">TWO REAL KST DAYS</p>
        <h1>수치가 지나간 자리까지<br />확인할 수 있도록</h1>
        <p>각 날짜의 첫 정상 수집 버전을 원자료 해시와 함께 고정합니다. 같은 날의 이후 조회는 이 근거를 바꾸지 않습니다.</p>
      </header>
      <section className="evidence-status">
        <strong>{records.length}<small> / 2</small></strong>
        <div><span>{records.length === 2 ? "실제 두 날짜 확보" : "다른 실제 KST 날짜의 기록을 기다리는 중"}</span><p>{delta === null ? "변화량은 두 번째 기록 뒤 계산합니다." : `변화량 ${delta > 0 ? "+" : ""}${delta.toFixed(1)} km/s`}</p></div>
      </section>
      <section className="evidence-list">
        {records.map((record, index) => (
          <article key={record.dayKey}>
            <p>DAY {index + 1} · {record.dayKey}</p>
            <strong>{record.speedKms.toFixed(1)} <small>km/s</small></strong>
            <dl>
              <div><dt>관측기</dt><dd>{record.source}</dd></div>
              <div><dt>관측 시각</dt><dd>{formatKst(record.observedAtUtc)} KST</dd></div>
              <div><dt>조회 시각</dt><dd>{formatKst(record.fetchedAtUtc)} KST</dd></div>
              <div><dt>원자료 SHA-256</dt><dd>{record.rawSha256}</dd></div>
            </dl>
            <a href={record.sourceUrl} target="_blank" rel="noreferrer">원자료 URL 열기 ↗</a>
          </article>
        ))}
      </section>
    </main>
  );
}
