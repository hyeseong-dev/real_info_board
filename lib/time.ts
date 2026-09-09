const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function toKstDayKey(instant: Date): string {
  return new Date(instant.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function parseNoaaUtc(raw: string): Date {
  // SWPC product timestamps are UTC, while this JSON field omits a zone suffix.
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(raw) ? raw : `${raw}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid NOAA observation timestamp");
  return date;
}

export function formatKst(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

