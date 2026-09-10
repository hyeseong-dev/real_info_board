import { NextResponse } from "next/server";
import type { SyntheticFailureCode } from "@/lib/domain";
import {
  ALTERNATIVE_FAILURE_FIXTURES,
  ALTERNATIVE_PACKAGE_ID,
  replayAlternativeFailure,
  replayAlternativeRecovery,
} from "@/lib/synthetic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    packageId: ALTERNATIVE_PACKAGE_ID,
    officialAssetAvailable: false,
    substitution: "Project-owner-approved public alternative fixtures",
    contractUrl: "https://github.com/hyeseong-dev/real_info_board/tree/main/assets/studio-task-assets/t04-real-information-board",
  });
}

export async function POST(request: Request) {
  const input = (await request.json()) as { fixture?: string };
  if (input.fixture === "ALT-T04-RECOVER-D2") {
    return NextResponse.json(await replayAlternativeRecovery());
  }
  if (input.fixture && input.fixture in ALTERNATIVE_FAILURE_FIXTURES) {
    return NextResponse.json(await replayAlternativeFailure(input.fixture as SyntheticFailureCode));
  }
  return NextResponse.json({ message: "Unknown alternative fixture" }, { status: 400 });
}
