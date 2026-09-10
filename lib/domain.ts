export type Freshness = "fresh" | "stale" | "empty";

export type FailureCode =
  | "slow_response"
  | "upstream_denied"
  | "rate_limited"
  | "offline"
  | "format_changed"
  | "source_stale";

export type SyntheticFailureCode = Exclude<FailureCode, "source_stale">;

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

export type EvidenceRecord = SolarWindRecord & {
  rawSha256: string;
};

export type BoardSnapshot = {
  history?: SolarWindRecord[];
  status: Freshness;
  latest: SolarWindRecord | null;
  previous: SolarWindRecord | null;
  deltaKms: number | null;
  message: string | null;
  errorCode?: FailureCode | null;
};

export type SyntheticRun = {
  fixtureId: string;
  label: string;
  status: "stale" | "fresh";
  errorCode: FailureCode | null;
  explanation: string;
  action: string;
  dailyCount: number;
  lastGoodValue: number;
  lastGoodObservedAtUtc: string;
  lastGoodFetchedAtUtc: string;
};
