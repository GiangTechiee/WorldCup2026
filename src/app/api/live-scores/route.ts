import type { NextRequest } from "next/server";
import type { LiveScoresResponse } from "@/lib/live-score";
import { getWorldCup26LiveScore, getWorldCup26LiveScores } from "@/lib/worldcup26-api";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId");
  const includeEvents = request.nextUrl.searchParams.get("events") === "1";

  try {
    const matches = matchId
      ? [await getWorldCup26LiveScore(matchId, includeEvents)].filter((item) => item !== null)
      : await getWorldCup26LiveScores();

    return Response.json(
      {
        source: "worldcup26",
        configured: true,
        updatedAt: new Date().toISOString(),
        matches,
      } satisfies LiveScoresResponse,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=20, stale-while-revalidate=40",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        source: "fallback",
        configured: true,
        updatedAt: new Date().toISOString(),
        matches: [],
        error: error instanceof Error ? error.message : "Unknown worldcup26.ir error",
      } satisfies LiveScoresResponse,
      { status: 200 },
    );
  }
}
