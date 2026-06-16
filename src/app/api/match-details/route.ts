import type { NextRequest } from "next/server";
import { getApiFootballMatchDetails } from "@/lib/api-football";
import { getEspnMatchDetails } from "@/lib/espn-football";
import type { MatchDetailsResponse } from "@/lib/live-score";
import { getMatch, type Match } from "@/lib/worldcup";

const DETAILS_CACHE_TTL = 60_000;
const PREMATCH_DETAIL_WINDOW = 45 * 60_000;
const detailsCache = new Map<string, { expiresAt: number; value: MatchDetailsResponse }>();

const emptyDetails = (match: Match, error: string): MatchDetailsResponse => ({
  source: "fallback",
  configured: Boolean(process.env.API_FOOTBALL_KEY),
  fixtureId: null,
  updatedAt: new Date().toISOString(),
  events: [],
  lineups: [],
  statistics: [],
  error: `${match.homeTeam} - ${match.awayTeam}: ${error}`,
});

const isTooEarlyForDetails = (match: Match) =>
  Date.now() < new Date(match.kickoffAt).getTime() - PREMATCH_DETAIL_WINDOW;

const cachedDetails = (matchId: string) => {
  const cached = detailsCache.get(matchId);
  if (!cached || cached.expiresAt < Date.now()) return null;
  return cached.value;
};

const rememberDetails = (matchId: string, details: MatchDetailsResponse) => {
  detailsCache.set(matchId, {
    expiresAt: Date.now() + DETAILS_CACHE_TTL,
    value: details,
  });
  return details;
};

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId");
  const match = matchId ? getMatch(matchId) : null;

  if (!match || !matchId) {
    return Response.json({ error: "Trận đấu không tồn tại." }, { status: 404 });
  }

  const cached = cachedDetails(matchId);
  if (cached) {
    return Response.json(cached, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=20, stale-while-revalidate=60",
      },
    });
  }

  if (isTooEarlyForDetails(match)) {
    return Response.json(rememberDetails(matchId, emptyDetails(match, "Chi tiết sẽ được tải gần giờ bóng lăn.")), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    let details: MatchDetailsResponse;

    try {
      details = await getEspnMatchDetails(match);
    } catch (espnError) {
      const espnMessage = espnError instanceof Error ? espnError.message : "ESPN không khả dụng";

      try {
        details = await getApiFootballMatchDetails(match);
        if (details.error) {
          details.error = `${espnMessage} · ${details.error}`;
        }
      } catch (apiFootballError) {
        const apiFootballMessage =
          apiFootballError instanceof Error ? apiFootballError.message : "API-Football không khả dụng";
        details = emptyDetails(match, `${espnMessage} · ${apiFootballMessage}`);
      }
    }

    return Response.json(rememberDetails(matchId, details), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
      },
    });
  } catch (error) {
    return Response.json(
      rememberDetails(
        matchId,
        emptyDetails(match, error instanceof Error ? error.message : "Không tải được dữ liệu trận đấu."),
      ),
      { status: 200 },
    );
  }
}
