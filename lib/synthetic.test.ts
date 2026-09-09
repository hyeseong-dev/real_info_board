import { describe, expect, it } from "vitest";
import { DEVELOPMENT_FIXTURES, replayDevelopmentFailure, replayDevelopmentRecovery } from "./synthetic";

describe("development failure replay", () => {
  it("keeps the same last good value and timestamps for all five failures", () => {
    const runs = Object.keys(DEVELOPMENT_FIXTURES).map((code) =>
      replayDevelopmentFailure(code as keyof typeof DEVELOPMENT_FIXTURES));
    expect(runs).toHaveLength(5);
    expect(new Set(runs.map((run) => run.lastGoodValue)).size).toBe(1);
    expect(new Set(runs.map((run) => run.lastGoodObservedAtUtc)).size).toBe(1);
    expect(new Set(runs.map((run) => run.lastGoodFetchedAtUtc)).size).toBe(1);
    expect(runs.every((run) => run.status === "stale" && run.dailyCount === 1)).toBe(true);
  });

  it("returns to fresh and adds exactly one next-day row", () => {
    expect(replayDevelopmentRecovery()).toMatchObject({
      status: "fresh",
      errorCode: null,
      dailyCount: 2,
    });
  });
});
