import type { FailureCode, SyntheticRun } from "./domain";

export const DEVELOPMENT_FIXTURES: Record<FailureCode, Omit<SyntheticRun, "status" | "dailyCount" | "lastGoodValue" | "lastGoodObservedAtUtc" | "lastGoodFetchedAtUtc">> = {
  slow_response: {
    fixtureId: "DEV-SLOW",
    label: "느린 응답",
    errorCode: "slow_response",
    explanation: "자료 응답이 늦어 확인을 멈췄어요. 마지막 정상값은 그대로예요.",
    action: "잠시 후 다시 시도",
  },
  upstream_denied: {
    fixtureId: "DEV-DENIED",
    label: "접근 거절",
    errorCode: "upstream_denied",
    explanation: "자료 제공처가 요청을 거절했어요. 사용자 계정 문제는 아니에요.",
    action: "원천 상태 확인 후 재시도",
  },
  rate_limited: {
    fixtureId: "DEV-RATE-LIMIT",
    label: "호출 제한",
    errorCode: "rate_limited",
    explanation: "자료 요청이 많아 잠시 기다려야 해요. 마지막 정상값을 표시해요.",
    action: "대기 후 다시 시도",
  },
  offline: {
    fixtureId: "DEV-OFFLINE",
    label: "오프라인",
    errorCode: "offline",
    explanation: "네트워크에 연결되지 않았어요. 저장된 값을 계속 볼 수 있어요.",
    action: "연결 확인 후 재시도",
  },
  format_changed: {
    fixtureId: "DEV-FORMAT",
    label: "형식 변경",
    errorCode: "format_changed",
    explanation: "자료 형식이 달라 새 값을 안전하게 읽지 않았어요.",
    action: "원천 보기 및 어댑터 점검",
  },
};

const D1 = {
  speed: 421.6,
  observedAt: "2030-01-14T02:55:00.000Z",
  fetchedAt: "2030-01-14T03:00:00.000Z",
};

export function replayDevelopmentFailure(code: FailureCode): SyntheticRun {
  return {
    ...DEVELOPMENT_FIXTURES[code],
    status: "stale",
    dailyCount: 1,
    lastGoodValue: D1.speed,
    lastGoodObservedAtUtc: D1.observedAt,
    lastGoodFetchedAtUtc: D1.fetchedAt,
  };
}

export function replayDevelopmentRecovery(): SyntheticRun {
  return {
    fixtureId: "DEV-RECOVER-D2",
    label: "다음 날짜 복구",
    status: "fresh",
    errorCode: null,
    explanation: "새 응답을 검증해 다음 날짜 기록을 한 건 추가했어요.",
    action: "복구 완료",
    dailyCount: 2,
    lastGoodValue: 447.2,
    lastGoodObservedAtUtc: "2030-01-15T02:55:00.000Z",
    lastGoodFetchedAtUtc: "2030-01-15T03:00:00.000Z",
  };
}
