import { NextResponse } from "next/server";
import { evidenceRecords } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const records = await evidenceRecords();
  return NextResponse.json({
    records,
    count: records.length,
    complete: records.length === 2,
    deltaKms: records.length === 2 ? records[1].speedKms - records[0].speedKms : null,
  });
}
