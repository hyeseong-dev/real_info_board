import { describe, expect, it } from "vitest";
import { failureMessage, needsRefresh } from "./board";
import { SolarWindSourceError } from "./noaa";

describe("board refresh policy", () => {
  it("shares a successful fetch for five minutes without changing its receipt time", () => {
    const now = new Date("2026-09-09T10:05:00.000Z");
    expect(needsRefresh("2026-09-09T10:00:01.000Z", now)).toBe(false);
    expect(needsRefresh("2026-09-09T10:00:00.000Z", now)).toBe(true);
  });

  it("explains a delayed source separately from network failure", () => {
    const result = failureMessage(new SolarWindSourceError("source_stale", "old observation"));
    expect(result.errorCode).toBe("source_stale");
    expect(result.message).toContain("새 관측이 늦어");
  });
});
