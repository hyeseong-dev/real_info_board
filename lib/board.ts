import type { BoardSnapshot } from "./domain";
import { fetchSolarWind } from "./noaa";
import { SolarWindSourceError } from "./noaa";
import { latestRecords, saveRecord } from "./repository";

const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1_000;
const MAX_OBSERVATION_AGE_MS = 20 * 60 * 1_000;
let refreshInFlight: Promise<BoardSnapshot> | null = null;

export function needsRefresh(latestFetchedAtUtc: string | null, now: Date): boolean {
  if (!latestFetchedAtUtc) return true;
  return now.getTime() - new Date(latestFetchedAtUtc).getTime() >= MIN_REFRESH_INTERVAL_MS;
}

function observationIsCurrent(observedAtUtc: string, now: Date): boolean {
  const age = now.getTime() - new Date(observedAtUtc).getTime();
  return age >= -60_000 && age <= MAX_OBSERVATION_AGE_MS;
}

async function performRefresh(now: Date): Promise<BoardSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const value = await fetchSolarWind(controller.signal);
    if (!observationIsCurrent(value.observedAtUtc, now)) {
      throw new SolarWindSourceError("source_stale", "The latest NOAA observation is outside the freshness window");
    }
    await saveRecord(value, now);
    return readBoard();
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshBoard(): Promise<BoardSnapshot> {
  const now = new Date();
  const current = await readBoard();
  if (!needsRefresh(current.latest?.fetchedAtUtc ?? null, now)) return current;
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(now).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export function failureMessage(error: unknown): Pick<BoardSnapshot, "message" | "errorCode"> {
  const code = error instanceof SolarWindSourceError ? error.code : "offline";
  const messages = {
    slow_response: "자료 응답이 늦어 마지막 정상값을 표시합니다.",
    upstream_denied: "자료 제공처가 요청을 거절해 마지막 정상값을 표시합니다.",
    rate_limited: "자료 요청이 많아 잠시 저장된 값을 표시합니다.",
    offline: "자료 제공처에 연결하지 못해 저장된 값을 표시합니다.",
    format_changed: "자료 형식이 바뀌어 새 값을 확인하지 못했습니다.",
    source_stale: "새 관측이 늦어 마지막으로 확인한 값을 표시합니다.",
  } satisfies Record<NonNullable<BoardSnapshot["errorCode"]>, string>;
  return { errorCode: code, message: messages[code] };
}

export async function readBoard(message: string | null = null, errorCode: BoardSnapshot["errorCode"] = null): Promise<BoardSnapshot> {
  const [latest = null, previous = null] = await latestRecords(2);
  if (!latest) return { status: "empty", latest, previous, deltaKms: null, message, errorCode };
  return {
    status: message ? "stale" : "fresh",
    latest,
    previous,
    deltaKms: previous ? latest.speedKms - previous.speedKms : null,
    message,
    errorCode,
  };
}
