import type { BoardSnapshot } from "./domain";
import { fetchSolarWind } from "./noaa";
import { SolarWindSourceError } from "./noaa";
import { getLatestRecords, saveDailyRecord } from "./store";

export async function refreshBoard(): Promise<BoardSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const value = await fetchSolarWind(controller.signal);
    saveDailyRecord(value, new Date());
    return readBoard();
  } finally {
    clearTimeout(timeout);
  }
}

export function failureMessage(error: unknown): Pick<BoardSnapshot, "message" | "errorCode"> {
  const code = error instanceof SolarWindSourceError ? error.code : "offline";
  const messages = {
    slow_response: "자료 응답이 늦어 마지막 정상값을 표시합니다.",
    upstream_denied: "자료 제공처가 요청을 거절해 마지막 정상값을 표시합니다.",
    rate_limited: "자료 요청이 많아 잠시 저장된 값을 표시합니다.",
    offline: "자료 제공처에 연결하지 못해 저장된 값을 표시합니다.",
    format_changed: "자료 형식이 바뀌어 새 값을 확인하지 못했습니다.",
  } satisfies Record<NonNullable<BoardSnapshot["errorCode"]>, string>;
  return { errorCode: code, message: messages[code] };
}

export function readBoard(message: string | null = null, errorCode: BoardSnapshot["errorCode"] = null): BoardSnapshot {
  const [latest = null, previous = null] = getLatestRecords(2);
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
