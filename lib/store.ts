import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { SolarWindRecord } from "./domain";
import type { EvidenceRecord } from "./domain";
import type { NormalizedSolarWind } from "./noaa";
import { NOAA_SOLAR_WIND_URL } from "./noaa";
import { toKstDayKey } from "./time";

type DbRecord = {
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

let database: Database.Database | undefined;

function getDatabase(): Database.Database {
  if (database) return database;
  const dbPath = path.join(
    process.cwd(),
    ".data",
    path.basename(process.env.SQLITE_FILENAME ?? "cosmic-pulse.db"),
  );
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_records (
      day_key TEXT PRIMARY KEY,
      speed_kms REAL NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      observed_at_raw TEXT NOT NULL,
      observed_at_utc TEXT NOT NULL,
      fetched_at_utc TEXT NOT NULL,
      quality_code INTEGER,
      raw_sha256 TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      created_at_utc TEXT NOT NULL,
      updated_at_utc TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submission_evidence (
      day_key TEXT PRIMARY KEY,
      speed_kms REAL NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      observed_at_raw TEXT NOT NULL,
      observed_at_utc TEXT NOT NULL,
      fetched_at_utc TEXT NOT NULL,
      quality_code INTEGER,
      raw_sha256 TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      captured_at_utc TEXT NOT NULL
    );
  `);
  return database;
}

function mapRecord(row: DbRecord): SolarWindRecord {
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

export function saveDailyRecord(value: NormalizedSolarWind, fetchedAt: Date): SolarWindRecord {
  const db = getDatabase();
  const fetchedAtUtc = fetchedAt.toISOString();
  const dayKey = toKstDayKey(fetchedAt);
  db.transaction(() => {
    db.prepare(`
      INSERT INTO daily_records (
        day_key, speed_kms, source, source_url, observed_at_raw, observed_at_utc,
        fetched_at_utc, quality_code, raw_sha256, raw_payload, created_at_utc, updated_at_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(day_key) DO UPDATE SET
        speed_kms = excluded.speed_kms,
        source = excluded.source,
        source_url = excluded.source_url,
        observed_at_raw = excluded.observed_at_raw,
        observed_at_utc = excluded.observed_at_utc,
        fetched_at_utc = excluded.fetched_at_utc,
        quality_code = excluded.quality_code,
        raw_sha256 = excluded.raw_sha256,
        raw_payload = excluded.raw_payload,
        updated_at_utc = excluded.updated_at_utc
      WHERE excluded.fetched_at_utc >= daily_records.fetched_at_utc
    `).run(
      dayKey, value.speedKms, value.source, NOAA_SOLAR_WIND_URL, value.observedAtRaw,
      value.observedAtUtc, fetchedAtUtc, value.qualityCode, value.rawSha256,
      value.rawPayload, fetchedAtUtc, fetchedAtUtc,
    );

    db.prepare(`
      INSERT INTO submission_evidence (
        day_key, speed_kms, source, source_url, observed_at_raw, observed_at_utc,
        fetched_at_utc, quality_code, raw_sha256, raw_payload, captured_at_utc
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM submission_evidence) < 2
      ON CONFLICT(day_key) DO NOTHING
    `).run(
      dayKey, value.speedKms, value.source, NOAA_SOLAR_WIND_URL, value.observedAtRaw,
      value.observedAtUtc, fetchedAtUtc, value.qualityCode, value.rawSha256,
      value.rawPayload, fetchedAtUtc,
    );
  })();
  return getDailyRecord(dayKey) as SolarWindRecord;
}

export function getDailyRecord(dayKey: string): SolarWindRecord | null {
  const row = getDatabase().prepare(
    "SELECT * FROM daily_records WHERE day_key = ?",
  ).get(dayKey) as DbRecord | undefined;
  return row ? mapRecord(row) : null;
}

export function getLatestRecords(limit = 2): SolarWindRecord[] {
  const rows = getDatabase().prepare(
    "SELECT * FROM daily_records ORDER BY day_key DESC LIMIT ?",
  ).all(limit) as DbRecord[];
  return rows.map(mapRecord);
}

export function getEvidenceRecords(): EvidenceRecord[] {
  const rows = getDatabase().prepare(
    "SELECT * FROM submission_evidence ORDER BY day_key ASC",
  ).all() as DbRecord[];
  return rows.map((row) => ({ ...mapRecord(row), rawSha256: row.raw_sha256 }));
}

export function resetDatabaseForTests(): void {
  if (database) {
    database.close();
    database = undefined;
  }
}
