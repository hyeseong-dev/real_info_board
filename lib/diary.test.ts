import { describe, expect, it } from "vitest";
import { diaryCopy } from "./diary";
import type { BoardSnapshot, SolarWindRecord } from "./domain";

const now = new Date("2026-09-10T01:00:00Z");
const record = (dayKey: string, speedKms: number) => ({ dayKey, speedKms }) as SolarWindRecord;
const snapshot: BoardSnapshot = { status: "fresh", latest: record("2026-09-10", 449.6), previous: record("2026-09-09", 427.9), deltaKms: 21.7, message: null };

describe("honest daily narrative", () => {
  it("compares consecutive KST dates and recomputes the displayed difference", () => {
    expect(diaryCopy(snapshot, now)).toEqual({ title: "오늘, 태양풍은 빨라졌어요.", comparison: "어제 기록 대비 +21.7 km/s" });
  });
  it("does not call a missing day's baseline yesterday", () => {
    expect(diaryCopy({ ...snapshot, previous: record("2026-09-08", 427.9) }, now).comparison).toContain("2026-09-08 기록");
  });
  it("does not describe stale or past data as today's observation", () => {
    expect(diaryCopy({ ...snapshot, status: "stale" }, now).title).toContain("마지막");
    expect(diaryCopy(snapshot, new Date("2026-09-10T15:00:00Z")).title).toContain("마지막");
  });
  it("distinguishes no record from no comparison record", () => {
    expect(diaryCopy({ ...snapshot, latest: null, previous: null }, now).title).toContain("기다려요");
    expect(diaryCopy({ ...snapshot, previous: null }, now).comparison).toContain("이전 날짜");
  });
});
