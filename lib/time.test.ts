import { describe, expect, it } from "vitest";
import { toKstDayKey } from "./time";

describe("toKstDayKey", () => {
  it("uses the next KST day after 15:00 UTC", () => {
    expect(toKstDayKey(new Date("2026-09-09T14:59:59Z"))).toBe("2026-09-09");
    expect(toKstDayKey(new Date("2026-09-09T15:00:00Z"))).toBe("2026-09-10");
  });
});

