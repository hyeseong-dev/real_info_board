import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseLatestRecords, saveSupabaseDailyRecord } from "./supabase-store";

const row = {
  day_key: "2026-09-09",
  speed_kms: 438.4,
  source: "SOLAR1",
  source_url: "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json",
  observed_at_raw: "2026-09-09T13:18:00",
  observed_at_utc: "2026-09-09T13:18:00.000Z",
  fetched_at_utc: "2026-09-09T13:23:00.000Z",
  quality_code: 0,
  raw_sha256: "abc123",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Supabase storage adapter", () => {
  it("maps server-side REST records to the public record shape", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_server-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([row])));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSupabaseLatestRecords(2)).resolves.toMatchObject([
      { dayKey: "2026-09-09", speedKms: 438.4, source: "SOLAR1" },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.apikey).toBe("sb_secret_server-secret");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("keeps legacy service-role JWT authentication compatible", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-service-role-jwt");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([row])));
    vi.stubGlobal("fetch", fetchMock);

    await getSupabaseLatestRecords(2);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.apikey).toBe("legacy-service-role-jwt");
    expect(init.headers.Authorization).toBe("Bearer legacy-service-role-jwt");
  });

  it("sends the KST key and original payload to the atomic save RPC", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_server-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([row])));
    vi.stubGlobal("fetch", fetchMock);

    await saveSupabaseDailyRecord({
      speedKms: 438.4,
      source: "SOLAR1",
      observedAtRaw: "2026-09-09T13:18:00",
      observedAtUtc: "2026-09-09T13:18:00.000Z",
      qualityCode: 0,
      rawSha256: "abc123",
      rawPayload: JSON.stringify({ source: "SOLAR1" }),
    }, new Date("2026-09-09T15:01:00.000Z"));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.supabase.co/rest/v1/rpc/save_solar_wind_record");
    expect(JSON.parse(init.body)).toMatchObject({
      p_day_key: "2026-09-10",
      p_raw_payload: JSON.stringify({ source: "SOLAR1" }),
    });
  });
});
