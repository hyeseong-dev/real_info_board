import { NextResponse } from "next/server";
import { failureMessage, readBoard, refreshBoard } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readBoard());
}

export async function POST() {
  try {
    return NextResponse.json(await refreshBoard());
  } catch (error) {
    const failure = failureMessage(error);
    return NextResponse.json(await readBoard(failure.message, failure.errorCode), { status: 503 });
  }
}
