import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALTERNATIVE_FAILURE_FIXTURES,
  ALTERNATIVE_PACKAGE_ID,
  replayAlternativeFailure,
  replayAlternativeRecovery,
} from "./synthetic";

describe("alternative T04 failure replay", () => {
  it("runs five distinct failures after D1-A and D1-B without changing stored state", async () => {
    const codes = Object.keys(ALTERNATIVE_FAILURE_FIXTURES) as Array<keyof typeof ALTERNATIVE_FAILURE_FIXTURES>;
    const runs = await Promise.all(codes.map((code) => replayAlternativeFailure(code)));

    expect(runs).toHaveLength(5);
    expect(new Set(runs.map((run) => run.errorCode))).toEqual(new Set(codes));
    expect(runs.every((run) => run.packageId === ALTERNATIVE_PACKAGE_ID)).toBe(true);
    expect(runs.every((run) => run.status === "stale" && run.statePreserved)).toBe(true);
    expect(runs.every((run) => run.rowsBeforeAction === 1 && run.rowsAfterAction === 1 && run.rowsAdded === 0)).toBe(true);
    expect(runs.every((run) => run.lastGoodValue === 421.6 && run.dailyCount === 1)).toBe(true);
  });

  it("recovers to fresh on D2 and adds exactly one row even when replayed twice", async () => {
    await expect(replayAlternativeRecovery()).resolves.toMatchObject({
      packageId: ALTERNATIVE_PACKAGE_ID,
      fixtureId: "ALT-T04-RECOVER-D2",
      status: "fresh",
      errorCode: null,
      rowsBeforeAction: 1,
      rowsAfterAction: 2,
      rowsAdded: 1,
      dailyCount: 2,
      statePreserved: true,
      storageIsolation: "in_memory",
    });
  });

  it("matches the public alternative package manifest hashes", () => {
    const packageDir = path.join(process.cwd(), "assets", "studio-task-assets", "t04-real-information-board");
    const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "asset-manifest.json"), "utf8")) as {
      packageId: string;
      files: Array<{ path: string; sha256: string }>;
    };
    expect(manifest.packageId).toBe(ALTERNATIVE_PACKAGE_ID);
    for (const file of manifest.files) {
      const digest = createHash("sha256").update(fs.readFileSync(path.join(packageDir, file.path))).digest("hex");
      expect(digest).toBe(file.sha256);
    }
  });
});
