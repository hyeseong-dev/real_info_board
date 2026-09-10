import type { EvidenceRecord, SolarWindRecord } from "./domain";
import type { NormalizedSolarWind } from "./noaa";
import { NOAA_SOLAR_WIND_URL } from "./noaa";
import { toKstDayKey } from "./time";

type SupabaseRecord = {
  day_key: string;
  speed_kms: number;
  source: string;
  source_url: string;
  observed_at_raw: string;
  observed_at_utc: string;
  fetched_at_utc: string;
  quality_code: number | null;
  raw_sha256: string;
};

function configuration() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage requires SUPABASE_URL and SUPABASE_SECRET_KEY");
  }
  return { url, key };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase storage request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function mapRecord(row: SupabaseRecord): SolarWindRecord {
  return {
    dayKey: row.day_key,
    speedKms: row.speed_kms,
    source: row.source,
    sourceUrl: row.source_url,
    observedAtRaw: row.observed_at_raw,
    observedAtUtc: row.observed_at_utc,
    fetchedAtUtc: row.fetched_at_utc,
    qualityCode: row.quality_code,
  };
}

const fields = [
  "day_key", "speed_kms", "source", "source_url", "observed_at_raw",
  "observed_at_utc", "fetched_at_utc", "quality_code", "raw_sha256",
].join(",");

export async function saveSupabaseDailyRecord(
  value: NormalizedSolarWind,
  fetchedAt: Date,
): Promise<SolarWindRecord> {
  const [row] = await request<SupabaseRecord[]>("rpc/save_solar_wind_record", {
    method: "POST",
    body: JSON.stringify({
      p_day_key: toKstDayKey(fetchedAt),
      p_speed_kms: value.speedKms,
      p_source: value.source,
      p_source_url: NOAA_SOLAR_WIND_URL,
      p_observed_at_raw: value.observedAtRaw,
      p_observed_at_utc: value.observedAtUtc,
      p_fetched_at_utc: fetchedAt.toISOString(),
      p_quality_code: value.qualityCode,
      p_raw_sha256: value.rawSha256,
      p_raw_payload: value.rawPayload,
    }),
  });
  if (!row) throw new Error("Supabase storage returned no saved record");
  return mapRecord(row);
}

export async function getSupabaseLatestRecords(limit = 2): Promise<SolarWindRecord[]> {
  const rows = await request<SupabaseRecord[]>(
    `daily_records?select=${fields}&order=day_key.desc&limit=${Math.max(1, Math.floor(limit))}`,
  );
  return rows.map(mapRecord);
}

export async function getSupabaseEvidenceRecords(): Promise<EvidenceRecord[]> {
  const rows = await request<SupabaseRecord[]>(
    `submission_evidence?select=${fields}&order=day_key.asc&limit=2`,
  );
  return rows.map((row) => ({ ...mapRecord(row), rawSha256: row.raw_sha256 }));
}
