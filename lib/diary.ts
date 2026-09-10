import type { BoardSnapshot } from "./domain";
import { toKstDayKey } from "./time";

export function diaryCopy(snapshot: BoardSnapshot, now: Date) {
  const { latest, previous } = snapshot;
  if (!latest) return { title: "첫 우주 기록을 기다려요.", comparison: "정상 관측값이 도착하면 일지를 시작합니다." };
  const isToday = latest.dayKey === toKstDayKey(now);
  const yesterday = toKstDayKey(new Date(now.getTime() - 86_400_000));
  const baseline = previous ? (isToday && previous.dayKey === yesterday ? "어제 기록" : `${previous.dayKey} 기록`) : null;
  const delta = previous ? Number((latest.speedKms - previous.speedKms).toFixed(1)) : null;
  const comparison = delta === null ? "비교할 이전 날짜의 기록이 아직 없어요." : `${baseline} 대비 ${delta > 0 ? "+" : ""}${delta.toFixed(1)} km/s`;
  if (snapshot.status === "stale" || !isToday) return { title: "마지막으로 확인한 우주예요.", comparison };
  if (delta === null) return { title: "오늘, 첫 기록을 남겼어요.", comparison };
  return {
    title: delta === 0 ? "오늘, 이전 기록과 같은 속도예요." : `오늘, 태양풍은 ${delta > 0 ? "빨라졌어요." : "느려졌어요."}`,
    comparison,
  };
}
