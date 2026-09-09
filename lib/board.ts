import type { BoardSnapshot } from "./domain";
import { fetchSolarWind } from "./noaa";
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

export function readBoard(message: string | null = null): BoardSnapshot {
  const [latest = null, previous = null] = getLatestRecords(2);
  if (!latest) return { status: "empty", latest, previous, deltaKms: null, message };
  return {
    status: message ? "stale" : "fresh",
    latest,
    previous,
    deltaKms: previous ? latest.speedKms - previous.speedKms : null,
    message,
  };
}

