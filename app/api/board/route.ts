import { NextResponse } from "next/server";
import { readBoard, refreshBoard } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readBoard());
}

export async function POST() {
  try {
    return NextResponse.json(await refreshBoard());
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "자료 응답이 늦어 마지막 정상값을 표시합니다."
      : "새 태양풍 자료를 확인하지 못해 마지막 정상값을 표시합니다.";
    return NextResponse.json(readBoard(message), { status: 503 });
  }
}

