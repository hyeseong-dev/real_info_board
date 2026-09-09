export type Freshness = "fresh" | "stale" | "empty";

export type SolarWindRecord = {
  dayKey: string;
  speedKms: number;
  source: string;
  sourceUrl: string;
  observedAtRaw: string;
  observedAtUtc: string;
  fetchedAtUtc: string;
  qualityCode: number | null;
};

export type BoardSnapshot = {
  status: Freshness;
  latest: SolarWindRecord | null;
  previous: SolarWindRecord | null;
  deltaKms: number | null;
  message: string | null;
};

