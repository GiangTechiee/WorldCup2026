import "server-only";

import type {
  LiveMatchEvent,
  MatchDetailsResponse,
  MatchLineup,
  MatchLineupPlayer,
  MatchStatistic,
} from "@/lib/live-score";
import type { Match } from "@/lib/worldcup";

type ApiFootballPlayer = {
  id?: number | null;
  name?: string | null;
  number?: number | null;
  pos?: string | null;
  grid?: string | null;
};

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  events?: Array<{
    time: { elapsed?: number | null; extra?: number | null };
    team: { name?: string | null };
    player: { name?: string | null };
    assist: { name?: string | null };
    type?: string | null;
    detail?: string | null;
    comments?: string | null;
  }>;
  lineups?: Array<{
    team: { name?: string | null };
    formation?: string | null;
    coach?: { name?: string | null };
    startXI?: Array<{ player: ApiFootballPlayer }>;
    substitutes?: Array<{ player: ApiFootballPlayer }>;
  }>;
  statistics?: Array<{
    team: { name?: string | null };
    statistics?: Array<{
      type?: string | null;
      value?: string | number | null;
    }>;
  }>;
};

type ApiFootballResponse = {
  errors?: Record<string, string> | string[];
  response?: ApiFootballFixture[];
};

const API_BASE_URL = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
const WORLD_CUP_SEASON = process.env.API_FOOTBALL_SEASON ?? "2026";

const aliases: Record<string, string> = {
  "czech republic": "czechia",
  "korea republic": "south korea",
  "republic of korea": "south korea",
  usa: "united states",
  "united states of america": "united states",
};

const normalizeTeamName = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return aliases[normalized] ?? normalized;
};

const isSameTeam = (left: string, right: string) => {
  const normalizedLeft = normalizeTeamName(left);
  const normalizedRight = normalizeTeamName(right);
  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
};

const apiError = (payload: ApiFootballResponse) => {
  if (!payload.errors) return null;
  if (Array.isArray(payload.errors)) return payload.errors.join(", ") || null;
  const messages = Object.values(payload.errors);
  return messages.join(", ") || null;
};

const fetchApiFootball = async (path: string, revalidate: number) => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY is not configured");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: {
      revalidate,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error(`API-Football returned HTTP ${response.status}`);

  const payload = (await response.json()) as ApiFootballResponse;
  const error = apiError(payload);
  if (error) throw new Error(error);
  return payload.response ?? [];
};

const findFixture = async (match: Match) => {
  const date = match.kickoffAt.slice(0, 10);
  const search = new URLSearchParams({
    date,
    league: WORLD_CUP_LEAGUE_ID,
    season: WORLD_CUP_SEASON,
  });
  const fixtures = await fetchApiFootball(`/fixtures?${search}`, 3600);

  return fixtures.find((fixture) => {
    const direct = isSameTeam(fixture.teams.home.name, match.homeTeam) && isSameTeam(fixture.teams.away.name, match.awayTeam);
    const reversed = isSameTeam(fixture.teams.home.name, match.awayTeam) && isSameTeam(fixture.teams.away.name, match.homeTeam);
    return direct || reversed;
  }) ?? null;
};

const toPlayer = (player: ApiFootballPlayer): MatchLineupPlayer => ({
  id: player.id ?? null,
  imageUrl: null,
  jerseyUrl: null,
  name: player.name ?? "Chưa xác định",
  number: player.number ?? null,
  position: player.pos ?? null,
  grid: player.grid ?? null,
});

const toLineups = (fixture: ApiFootballFixture): MatchLineup[] =>
  (fixture.lineups ?? []).map((lineup) => ({
    teamName: lineup.team.name ?? "Đội tuyển",
    formation: lineup.formation ?? null,
    coachName: lineup.coach?.name ?? null,
    starters: (lineup.startXI ?? []).map(({ player }) => toPlayer(player)),
    substitutes: (lineup.substitutes ?? []).map(({ player }) => toPlayer(player)),
  }));

const toEvents = (fixture: ApiFootballFixture): LiveMatchEvent[] =>
  (fixture.events ?? [])
    .map((event) => ({
      elapsed: event.time.elapsed ?? null,
      extra: event.time.extra ?? null,
      teamName: event.team.name ?? null,
      playerName: event.player.name ?? null,
      assistName: event.assist.name ?? null,
      type: event.type ?? "Event",
      detail: event.detail ?? event.type ?? "Event",
      comments: event.comments ?? null,
    }))
    .sort((left, right) => (left.elapsed ?? 999) - (right.elapsed ?? 999));

const toStatistics = (fixture: ApiFootballFixture, match: Match): MatchStatistic[] => {
  const home = fixture.statistics?.find((item) => isSameTeam(item.team.name ?? "", match.homeTeam));
  const away = fixture.statistics?.find((item) => isSameTeam(item.team.name ?? "", match.awayTeam));
  const types = new Set([
    ...(home?.statistics ?? []).map((item) => item.type).filter((type): type is string => Boolean(type)),
    ...(away?.statistics ?? []).map((item) => item.type).filter((type): type is string => Boolean(type)),
  ]);

  return [...types].map((type) => ({
    type,
    home: home?.statistics?.find((item) => item.type === type)?.value ?? null,
    away: away?.statistics?.find((item) => item.type === type)?.value ?? null,
  }));
};

export const getApiFootballMatchDetails = async (match: Match): Promise<MatchDetailsResponse> => {
  if (!process.env.API_FOOTBALL_KEY) {
    return {
      source: "unconfigured",
      configured: false,
      fixtureId: null,
      updatedAt: new Date().toISOString(),
      events: [],
      lineups: [],
      statistics: [],
      error: "Chưa cấu hình API_FOOTBALL_KEY.",
    };
  }

  const fixtureMatch = await findFixture(match);
  if (!fixtureMatch) throw new Error(`Không tìm thấy fixture API-Football cho ${match.homeTeam} - ${match.awayTeam}`);

  const isNearMatch = Math.abs(Date.now() - new Date(match.kickoffAt).getTime()) < 4 * 60 * 60 * 1000;
  const [fixture] = await fetchApiFootball(`/fixtures?id=${fixtureMatch.fixture.id}`, isNearMatch ? 300 : 3600);
  if (!fixture) throw new Error(`API-Football không trả dữ liệu fixture ${fixtureMatch.fixture.id}`);

  return {
    source: "api-football",
    configured: true,
    fixtureId: fixture.fixture.id,
    updatedAt: new Date().toISOString(),
    events: toEvents(fixture),
    lineups: toLineups(fixture),
    statistics: toStatistics(fixture, match),
  };
};
