import type { EvidenceRecord, SolarWindRecord } from "./domain";
import type { NormalizedSolarWind } from "./noaa";
import { getEvidenceRecords, getLatestRecords, saveDailyRecord } from "./store";
import {
  getSupabaseEvidenceRecords,
  getSupabaseLatestRecords,
  saveSupabaseDailyRecord,
} from "./supabase-store";

function usesSupabase(): boolean {
  return process.env.DATABASE_PROVIDER === "supabase";
}

export async function saveRecord(
  value: NormalizedSolarWind,
  fetchedAt: Date,
): Promise<SolarWindRecord> {
  return usesSupabase()
    ? saveSupabaseDailyRecord(value, fetchedAt)
    : saveDailyRecord(value, fetchedAt);
}

export async function latestRecords(limit = 2): Promise<SolarWindRecord[]> {
  return usesSupabase() ? getSupabaseLatestRecords(limit) : getLatestRecords(limit);
}

export async function evidenceRecords(): Promise<EvidenceRecord[]> {
  return usesSupabase() ? getSupabaseEvidenceRecords() : getEvidenceRecords();
}
