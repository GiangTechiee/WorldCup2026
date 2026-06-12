import type { NextRequest } from "next/server";
import { getApiFootballMatchDetails } from "@/lib/api-football";
import { getEspnMatchDetails } from "@/lib/espn-football";
import type { MatchDetailsResponse } from "@/lib/live-score";
import { getMatch } from "@/lib/worldcup";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId");
  const match = matchId ? getMatch(matchId) : null;

  if (!match) {
    return Response.json({ error: "Trận đấu không tồn tại." }, { status: 404 });
  }

  try {
    let details: MatchDetailsResponse;

    try {
      details = await getEspnMatchDetails(match);
    } catch (espnError) {
      details = await getApiFootballMatchDetails(match);
      if (details.error) {
        details.error = `${espnError instanceof Error ? espnError.message : "ESPN không khả dụng"} · ${details.error}`;
      }
    }

    return Response.json(details, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
      },
    });
  } catch (error) {
    return Response.json(
      {
        source: "fallback",
        configured: Boolean(process.env.API_FOOTBALL_KEY),
        fixtureId: null,
        updatedAt: new Date().toISOString(),
        events: [],
        lineups: [],
        statistics: [],
        error: error instanceof Error ? error.message : "Không tải được dữ liệu API-Football.",
      } satisfies MatchDetailsResponse,
      { status: 200 },
    );
  }
}
