import "server-only";

import type { LiveMatchEvent, LiveMatchScore, LiveMatchStatus } from "@/lib/live-score";
import rawMatches from "@/data/raw/worldcup.json" assert { type: "json" };
import { getEspnScoreboard, type EspnScoreboard } from "@/lib/espn-football";

type WorldCup26GamesResponse = {
  games: WorldCup26Game[];
};

type WorldCup26Game = {
  id: string;
  home_score: string | null;
  away_score: string | null;
  home_scorers: string | null;
  away_scorers: string | null;
  finished: string | null;
  time_elapsed: string | null;
  home_team_name_en: string;
  away_team_name_en: string;
};

type WorldCup26GroupsResponse = {
  groups: WorldCup26Group[];
};

type WorldCup26TeamsResponse = {
  teams: WorldCup26Team[];
};

type WorldCup26Group = {
  name: string;
  teams: WorldCup26StandingTeam[];
};

type WorldCup26StandingTeam = {
  team_id: string;
  mp: string;
  w: string;
  l: string;
  d: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
};

type WorldCup26Team = {
  id: string;
  name_en: string;
  fifa_code: string;
  groups: string;
};

export type WorldCup26Standing = {
  group: string;
  teams: WorldCup26StandingRow[];
};

export type WorldCup26StandingRow = {
  teamId: string;
  name: string;
  code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const config = {
  baseUrl: process.env.WORLDCUP26_BASE_URL ?? "https://worldcup26.ir",
};

const REQUEST_TIMEOUT_MS = 8_000;
const GAMES_CACHE_TTL = 30_000;
let gamesCache: { expiresAt: number; value: WorldCup26Game[] } | null = null;

const fetchWithTimeout = (url: URL) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const request = fetch(url, {
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  return request;
};

const parseNullableNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "" || value === "null") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const statusFromWorldCup26 = (game: WorldCup26Game): LiveMatchStatus => {
  const elapsed = game.time_elapsed?.toLowerCase() ?? "";
  if (game.finished === "TRUE") return "finished";
  if (["ht", "half-time", "halftime", "half time", "break"].includes(elapsed)) return "halftime";
  if (game.finished === "FALSE" && game.time_elapsed && elapsed !== "notstarted") {
    return "live";
  }
  return "scheduled";
};

const statusShortFromWorldCup26 = (status: LiveMatchStatus) => {
  if (status === "finished") return "FT";
  if (status === "halftime") return "HT";
  if (status === "live") return "LIVE";
  return "NS";
};

const statusLongFromWorldCup26 = (status: LiveMatchStatus) => {
  if (status === "finished") return "Match Finished";
  if (status === "halftime") return "Half Time";
  if (status === "live") return "Live";
  return "Not Started";
};

const elapsedFromWorldCup26 = (value: string | null) => {
  if (!value || value === "finished" || value === "notstarted") return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
};

const parseScorers = (
  rawValue: string | null,
  teamName: string,
  eventType = "Goal",
): LiveMatchEvent[] => {
  if (!rawValue || rawValue === "null") return [];

  return rawValue
    .replace(/[{}"“”]/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const minute = item.match(/(\d+)'/);
      const playerName = item.replace(/\s+\d+'.*$/, "").trim() || null;

      return {
        elapsed: minute ? Number(minute[1]) : null,
        extra: null,
        teamName,
        playerName,
        assistName: null,
        type: eventType,
        detail: "Goal",
        comments: null,
      };
    });
};

const toLiveMatchScore = (game: WorldCup26Game, includeEvents: boolean): LiveMatchScore => {
  const status = statusFromWorldCup26(game);
  const events = includeEvents
    ? [
        ...parseScorers(game.home_scorers, game.home_team_name_en),
        ...parseScorers(game.away_scorers, game.away_team_name_en),
      ].sort((a, b) => (a.elapsed ?? 999) - (b.elapsed ?? 999))
    : undefined;

  return {
    matchId: `match-${game.id}`,
    apiFixtureId: Number(game.id),
    status,
    statusShort: statusShortFromWorldCup26(status),
    statusLong: statusLongFromWorldCup26(status),
    elapsed: elapsedFromWorldCup26(game.time_elapsed),
    homeScore: parseNullableNumber(game.home_score),
    awayScore: parseNullableNumber(game.away_score),
    halftimeHome: null,
    halftimeAway: null,
    fulltimeHome: status === "finished" ? parseNullableNumber(game.home_score) : null,
    fulltimeAway: status === "finished" ? parseNullableNumber(game.away_score) : null,
    updatedAt: new Date().toISOString(),
    events,
  };
};

const getGames = async () => {
  if (gamesCache && gamesCache.expiresAt > Date.now()) return gamesCache.value;

  const url = new URL("/get/games", config.baseUrl);
  let response: Response;

  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    if (gamesCache) return gamesCache.value;
    return getFallbackGames();
  }

  if (!response.ok) {
    if (gamesCache) return gamesCache.value;
    return getFallbackGames();
  }

  const payload = (await response.json()) as WorldCup26GamesResponse;
  gamesCache = {
    expiresAt: Date.now() + GAMES_CACHE_TTL,
    value: payload.games,
  };
  return payload.games;
};

const getFallbackGames = (): WorldCup26Game[] => {
  const matches = (rawMatches as { matches: Array<{ num: number; date: string; time: string; team1: string; team2: string; group: string; ground: string }> }).matches;
  return matches.map((match) => ({
    id: String(match.num),
    home_score: null,
    away_score: null,
    home_scorers: null,
    away_scorers: null,
    finished: null,
    time_elapsed: null,
    home_team_name_en: match.team1,
    away_team_name_en: match.team2,
  }));
};

const fetchWorldCup26 = async <T>(path: string) => {
  const url = new URL(path, config.baseUrl);
  let response: Response;

  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Không thể tải dữ liệu: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`worldcup26.ir returned HTTP ${response.status}`);
  }

  return (await response.json()) as T;
};

export const getWorldCup26LiveScores = async () => {
  const games = await getGames();
  return games.map((game) => toLiveMatchScore(game, false));
};

export const getWorldCup26LiveScore = async (matchId: string, includeEvents = false) => {
  const games = await getGames();
  const gameId = matchId.replace(/^match-/, "");
  const game = games.find((item) => item.id === gameId);
  return game ? toLiveMatchScore(game, includeEvents) : null;
};

export const getLiveScoresFromEspn = async (): Promise<LiveMatchScore[]> => {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  let scoreboard: EspnScoreboard;
  try {
    scoreboard = await getEspnScoreboard(today);
  } catch {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10).replaceAll("-", "");
    scoreboard = await getEspnScoreboard(yesterday);
  }

  return (scoreboard.events ?? [])
    .map((event) => {
      const home = event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "home");
      const away = event.competitions?.[0]?.competitors?.find((c) => c.homeAway === "away");
      const homeScore = home?.score ?? null;
      const awayScore = away?.score ?? null;
      const elapsed = home?.clock?.displayValue ?? away?.clock?.displayValue;
      const status = elapsed ? "live" : "scheduled";

      return {
        matchId: `match-${event.id}`,
        apiFixtureId: Number(event.id),
        status,
        statusShort: status === "live" ? "LIVE" : "NS",
        statusLong: status === "live" ? "Live" : "Not Started",
        elapsed: elapsed ? Number(elapsed.match(/\d+/)?.[0] ?? null) : null,
        homeScore: homeScore !== null ? Number(homeScore) : null,
        awayScore: awayScore !== null ? Number(awayScore) : null,
        halftimeHome: null,
        halftimeAway: null,
        fulltimeHome: null,
        fulltimeAway: null,
        updatedAt: new Date().toISOString(),
        events: [],
      };
    })
    .filter((score) => score.homeScore !== null || score.awayScore !== null || score.status === "live");
};

export const getWorldCup26Standings = async (): Promise<WorldCup26Standing[]> => {
  const [groupsPayload, teamsPayload] = await Promise.all([
    fetchWorldCup26<WorldCup26GroupsResponse>("/get/groups"),
    fetchWorldCup26<WorldCup26TeamsResponse>("/get/teams"),
  ]);
  const teamsById = new Map(teamsPayload.teams.map((team) => [team.id, team]));

  return groupsPayload.groups
    .map((group) => ({
      group: group.name,
      teams: group.teams
        .map((standing) => {
          const team = teamsById.get(standing.team_id);

          return {
            teamId: standing.team_id,
            name: team?.name_en ?? standing.team_id,
            code: team?.fifa_code ?? "",
            played: parseNullableNumber(standing.mp) ?? 0,
            won: parseNullableNumber(standing.w) ?? 0,
            drawn: parseNullableNumber(standing.d) ?? 0,
            lost: parseNullableNumber(standing.l) ?? 0,
            goalsFor: parseNullableNumber(standing.gf) ?? 0,
            goalsAgainst: parseNullableNumber(standing.ga) ?? 0,
            goalDifference: parseNullableNumber(standing.gd) ?? 0,
            points: parseNullableNumber(standing.pts) ?? 0,
          };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return a.name.localeCompare(b.name);
        }),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
};
