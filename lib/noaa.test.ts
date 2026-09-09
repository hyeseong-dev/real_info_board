import { describe, expect, it } from "vitest";
import { selectLatestActive } from "./noaa";

describe("selectLatestActive", () => {
  it("sorts by observation time and ignores inactive or missing speed rows", () => {
    const payload = JSON.stringify([
      { time_tag: "2026-09-09T12:04:00", active: false, source: "ACE", proton_speed: 900, overall_quality: 0 },
      { time_tag: "2026-09-09T12:03:00", active: true, source: "SOLAR1", proton_speed: 420, overall_quality: 0 },
      { time_tag: "2026-09-09T12:05:00", active: true, source: "SOLAR1", proton_speed: 441.2, overall_quality: 0 },
      { time_tag: "2026-09-09T12:06:00", active: true, source: "SOLAR1", proton_speed: null, overall_quality: 0 }
    ]);
    expect(selectLatestActive(payload)).toMatchObject({
      speedKms: 441.2,
      source: "SOLAR1",
      observedAtUtc: "2026-09-09T12:05:00.000Z",
    });
  });
});

