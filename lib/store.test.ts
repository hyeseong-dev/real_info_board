import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { NormalizedSolarWind } from "./noaa";
import { getEvidenceRecords, getLatestRecords, resetDatabaseForTests, saveDailyRecord } from "./store";

const fileName = "store-test.db";
const filePath = path.join(process.cwd(), ".data", fileName);

function value(speedKms: number, observedAtRaw: string): NormalizedSolarWind {
  return {
    speedKms,
    source: "TEST-SOURCE",
    observedAtRaw,
    observedAtUtc: `${observedAtRaw}Z`,
    qualityCode: 0,
    rawSha256: `sha-${speedKms}`,
    rawPayload: JSON.stringify({ speedKms }),
  };
}

beforeEach(() => {
  resetDatabaseForTests();
  process.env.SQLITE_FILENAME = fileName;
  for (const suffix of ["", "-shm", "-wal"]) fs.rmSync(`${filePath}${suffix}`, { force: true });
});

afterAll(() => {
  resetDatabaseForTests();
  for (const suffix of ["", "-shm", "-wal"]) fs.rmSync(`${filePath}${suffix}`, { force: true });
});

describe("daily records and submission evidence", () => {
  it("upserts a KST day while freezing its first evidence version", () => {
    saveDailyRecord(value(410, "2026-09-09T01:00:00"), new Date("2026-09-09T01:05:00Z"));
    saveDailyRecord(value(430, "2026-09-09T02:00:00"), new Date("2026-09-09T02:05:00Z"));
    expect(getLatestRecords()).toHaveLength(1);
    expect(getLatestRecords()[0].speedKms).toBe(430);
    expect(getEvidenceRecords()).toMatchObject([{ speedKms: 410, dayKey: "2026-09-09" }]);
  });

  it("keeps submission evidence at exactly two real day keys", () => {
    saveDailyRecord(value(410, "2026-09-09T01:00:00"), new Date("2026-09-09T01:05:00Z"));
    saveDailyRecord(value(420, "2026-09-10T01:00:00"), new Date("2026-09-10T01:05:00Z"));
    saveDailyRecord(value(430, "2026-09-11T01:00:00"), new Date("2026-09-11T01:05:00Z"));
    expect(getLatestRecords(5)).toHaveLength(3);
    expect(getEvidenceRecords().map((record) => record.dayKey)).toEqual(["2026-09-09", "2026-09-10"]);
  });
});
