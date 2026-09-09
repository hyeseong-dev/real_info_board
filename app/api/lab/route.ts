import { NextResponse } from "next/server";
import type { SyntheticFailureCode } from "@/lib/domain";
import { DEVELOPMENT_FIXTURES, replayDevelopmentFailure, replayDevelopmentRecovery } from "@/lib/synthetic";

export async function POST(request: Request) {
  const input = (await request.json()) as { fixture?: string };
  if (input.fixture === "DEV-RECOVER-D2") {
    return NextResponse.json(replayDevelopmentRecovery());
  }
  if (input.fixture && input.fixture in DEVELOPMENT_FIXTURES) {
    return NextResponse.json(replayDevelopmentFailure(input.fixture as SyntheticFailureCode));
  }
  return NextResponse.json({ message: "Unknown development fixture" }, { status: 400 });
}
