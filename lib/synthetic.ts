import type { FailureCode, SyntheticFailureCode, SyntheticRun } from "./domain";
import { SolarWindSourceError } from "./noaa";

export const ALTERNATIVE_PACKAGE_ID = "ALT-T04-COSMIC-PULSE-V1";

type FixtureRecord = {
  fixtureId: string;
  dayKey: string;
  speedKms: number;
  observedAtUtc: string;
  fetchedAtUtc: string;
};

type FailureFixture = {
  fixtureId: string;
  label: string;
  errorCode: SyntheticFailureCode;
  explanation: string;
  action: string;
};

const D1_A: FixtureRecord = {
  fixtureId: "ALT-T04-D1-A",
  dayKey: "2030-01-14",
  speedKms: 410.2,
  observedAtUtc: "2030-01-14T02:45:00.000Z",
  fetchedAtUtc: "2030-01-14T02:50:00.000Z",
};

const D1_B: FixtureRecord = {
  fixtureId: "ALT-T04-D1-B",
  dayKey: "2030-01-14",
  speedKms: 421.6,
  observedAtUtc: "2030-01-14T02:55:00.000Z",
  fetchedAtUtc: "2030-01-14T03:00:00.000Z",
};

const D2: FixtureRecord = {
  fixtureId: "ALT-T04-RECOVER-D2",
  dayKey: "2030-01-15",
  speedKms: 447.2,
  observedAtUtc: "2030-01-15T02:55:00.000Z",
  fetchedAtUtc: "2030-01-15T03:00:00.000Z",
};

export const ALTERNATIVE_FAILURE_FIXTURES: Record<SyntheticFailureCode, FailureFixture> = {
  slow_response: {
    fixtureId: "ALT-T04-SLOW",
    label: "느린 응답",
    errorCode: "slow_response",
    explanation: "자료 응답이 늦어 확인을 멈췄어요. 마지막 정상값은 그대로예요.",
    action: "잠시 후 다시 시도",
  },
  upstream_denied: {
    fixtureId: "ALT-T04-DENIED",
    label: "접근 거절",
    errorCode: "upstream_denied",
    explanation: "자료 제공처가 요청을 거절했어요. 사용자 계정 문제는 아니에요.",
    action: "원천 상태 확인 후 재시도",
  },
  rate_limited: {
    fixtureId: "ALT-T04-RATE-LIMIT",
    label: "호출 제한",
    errorCode: "rate_limited",
    explanation: "자료 요청이 많아 잠시 기다려야 해요. 마지막 정상값을 표시해요.",
    action: "대기 후 다시 시도",
  },
  offline: {
    fixtureId: "ALT-T04-OFFLINE",
    label: "오프라인",
    errorCode: "offline",
    explanation: "네트워크에 연결되지 않았어요. 저장된 값을 계속 볼 수 있어요.",
    action: "연결 확인 후 재시도",
  },
  format_changed: {
    fixtureId: "ALT-T04-FORMAT",
    label: "형식 변경",
    errorCode: "format_changed",
    explanation: "자료 형식이 달라 새 값을 안전하게 읽지 않았어요.",
    action: "원천 보기 및 어댑터 점검",
  },
};

class IsolatedDailyStore {
  private readonly rows = new Map<string, FixtureRecord>();

  save(record: FixtureRecord) {
    const current = this.rows.get(record.dayKey);
    if (!current || record.fetchedAtUtc >= current.fetchedAtUtc) {
      this.rows.set(record.dayKey, { ...record });
    }
  }

  snapshot() {
    return [...this.rows.values()]
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
      .map((row) => ({ ...row }));
  }
}

class AlternativeFixtureAdapter {
  async loadFailure(code: SyntheticFailureCode): Promise<never> {
    const fixture = ALTERNATIVE_FAILURE_FIXTURES[code];
    await Promise.resolve();
    throw new SolarWindSourceError(fixture.errorCode, fixture.explanation);
  }

  async loadSuccess(record: FixtureRecord): Promise<FixtureRecord> {
    await Promise.resolve();
    return { ...record };
  }
}

function initializeD1(store: IsolatedDailyStore) {
  store.save(D1_A);
  store.save(D1_B);
}

function sameRows(left: FixtureRecord[], right: FixtureRecord[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function replayAlternativeFailure(code: SyntheticFailureCode): Promise<SyntheticRun> {
  const store = new IsolatedDailyStore();
  const adapter = new AlternativeFixtureAdapter();
  initializeD1(store);
  const before = store.snapshot();
  let failureCode: FailureCode | null = null;

  try {
    await adapter.loadFailure(code);
  } catch (error) {
    if (!(error instanceof SolarWindSourceError)) throw error;
    failureCode = error.code;
  }

  const after = store.snapshot();
  const lastGood = after.at(-1);
  if (!lastGood || failureCode !== code) throw new Error("Alternative failure replay was inconsistent");

  const fixture = ALTERNATIVE_FAILURE_FIXTURES[code];
  return {
    packageId: ALTERNATIVE_PACKAGE_ID,
    fixtureId: fixture.fixtureId,
    sequence: [D1_A.fixtureId, D1_B.fixtureId, fixture.fixtureId],
    label: fixture.label,
    status: "stale",
    errorCode: failureCode,
    explanation: fixture.explanation,
    action: fixture.action,
    dailyCount: after.length,
    lastGoodValue: lastGood.speedKms,
    lastGoodObservedAtUtc: lastGood.observedAtUtc,
    lastGoodFetchedAtUtc: lastGood.fetchedAtUtc,
    rowsBeforeAction: before.length,
    rowsAfterAction: after.length,
    rowsAdded: after.length - before.length,
    statePreserved: sameRows(before, after),
    storageIsolation: "in_memory",
  };
}

export async function replayAlternativeRecovery(): Promise<SyntheticRun> {
  const store = new IsolatedDailyStore();
  const adapter = new AlternativeFixtureAdapter();
  initializeD1(store);
  const before = store.snapshot();
  try {
    await adapter.loadFailure("slow_response");
  } catch (error) {
    if (!(error instanceof SolarWindSourceError)) throw error;
  }

  store.save(await adapter.loadSuccess(D2));
  store.save(await adapter.loadSuccess(D2));
  const after = store.snapshot();
  const lastGood = after.at(-1);
  if (!lastGood) throw new Error("Alternative recovery produced no record");

  return {
    packageId: ALTERNATIVE_PACKAGE_ID,
    fixtureId: D2.fixtureId,
    sequence: [D1_A.fixtureId, D1_B.fixtureId, "ALT-T04-SLOW", D2.fixtureId, D2.fixtureId],
    label: "다음 날짜 복구",
    status: "fresh",
    errorCode: null,
    explanation: "다음 날짜 정상 응답을 저장하고 같은 응답을 다시 실행해도 일별 기록은 한 건만 추가됐어요.",
    action: "복구 완료",
    dailyCount: after.length,
    lastGoodValue: lastGood.speedKms,
    lastGoodObservedAtUtc: lastGood.observedAtUtc,
    lastGoodFetchedAtUtc: lastGood.fetchedAtUtc,
    rowsBeforeAction: before.length,
    rowsAfterAction: after.length,
    rowsAdded: after.length - before.length,
    statePreserved: before[0]?.speedKms === D1_B.speedKms,
    storageIsolation: "in_memory",
  };
}
