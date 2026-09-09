import { createHash } from "node:crypto";
import { z } from "zod";
import { parseNoaaUtc } from "./time";
import type { FailureCode } from "./domain";

export const NOAA_SOLAR_WIND_URL =
  "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json";

const rowSchema = z.object({
  time_tag: z.string(),
  active: z.boolean(),
  source: z.string().min(1),
  proton_speed: z.number().finite().positive().nullable(),
  overall_quality: z.number().int().nullable().optional(),
});

const responseSchema = z.array(rowSchema);

export type NormalizedSolarWind = {
  speedKms: number;
  source: string;
  observedAtRaw: string;
  observedAtUtc: string;
  qualityCode: number | null;
  rawSha256: string;
  rawPayload: string;
};

export class SolarWindSourceError extends Error {
  constructor(public readonly code: FailureCode, message: string) {
    super(message);
    this.name = "SolarWindSourceError";
  }
}

export function selectLatestActive(rawPayload: string): NormalizedSolarWind {
  const decoded: unknown = JSON.parse(rawPayload);
  const rows = responseSchema.parse(decoded);
  const candidates = rows
    .filter((row) => row.active && row.proton_speed !== null)
    .map((row) => ({ row, observedAt: parseNoaaUtc(row.time_tag) }))
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());

  const selected = candidates[0];
  if (!selected) throw new Error("No active solar-wind speed is available");

  return {
    speedKms: selected.row.proton_speed as number,
    source: selected.row.source,
    observedAtRaw: selected.row.time_tag,
    observedAtUtc: selected.observedAt.toISOString(),
    qualityCode: selected.row.overall_quality ?? null,
    rawSha256: createHash("sha256").update(rawPayload).digest("hex"),
    rawPayload,
  };
}

export async function fetchSolarWind(signal?: AbortSignal): Promise<NormalizedSolarWind> {
  try {
    const response = await fetch(NOAA_SOLAR_WIND_URL, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (response.status === 401 || response.status === 403) {
      throw new SolarWindSourceError("upstream_denied", `NOAA denied the request with ${response.status}`);
    }
    if (response.status === 429) {
      throw new SolarWindSourceError("rate_limited", "NOAA rate limit reached");
    }
    if (!response.ok) {
      throw new SolarWindSourceError("offline", `NOAA request failed with ${response.status}`);
    }
    try {
      return selectLatestActive(await response.text());
    } catch (error) {
      if (error instanceof SolarWindSourceError) throw error;
      throw new SolarWindSourceError("format_changed", "NOAA response did not match the expected format");
    }
  } catch (error) {
    if (error instanceof SolarWindSourceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SolarWindSourceError("slow_response", "NOAA response exceeded the timeout");
    }
    throw new SolarWindSourceError("offline", "Could not reach NOAA");
  }
}
