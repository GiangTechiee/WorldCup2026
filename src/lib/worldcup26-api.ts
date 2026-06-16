import "server-only";

import type { LiveMatchEvent, LiveMatchScore, LiveMatchStatus } from "@/lib/live-score";
import { matches } from "@/lib/worldcup";
import { getEspnScoreboard, type EspnScoreboardEvent } from "@/lib/espn-football";

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
const ESPN_SCOREBOARD_CACHE_TTL = 5 * 60 * 1000;
let gamesCache: { expiresAt: number; value: WorldCup26Game[] } | null = null;
let espnScoreboardCache: { expiresAt: number; value: EspnScoreboardEvent[] } | null = null;

const fetchWithTimeout = (url: URL) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const request = fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "WorldCup26/1.0",
    },
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
  if (game.finished === "FALSE" && game.time_elapsed && elapsed !== "notstarted" && elapsed !== "ns") {
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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`WorldCup26 fetch error: ${message}`);
    throw new Error(`Không thể tải dữ liệu từ worldcup26.ir: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`worldcup26.ir returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as WorldCup26GamesResponse;
  gamesCache = {
    expiresAt: Date.now() + GAMES_CACHE_TTL,
    value: payload.games,
  };
  return payload.games;
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

export const getWorldCup26Events = async (matchId: string): Promise<LiveMatchEvent[]> => {
  const games = await getGames();
  const gameId = matchId.replace(/^match-/, "");
  const game = games.find((item) => item.id === gameId);
  if (!game) return [];

  return [
    ...parseScorers(game.home_scorers, game.home_team_name_en),
    ...parseScorers(game.away_scorers, game.away_team_name_en),
  ].sort((a, b) => (a.elapsed ?? 999) - (b.elapsed ?? 999));
};

const normalizeTeamName = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    "czech republic": "czechia",
    "korea republic": "south korea",
    "republic of korea": "south korea",
    "united states": "usa",
    "united states of america": "usa",
    turkiye: "turkey",
    "bosnia herzegovina": "bosnia and herzegovina",
  };

  return aliases[normalized] ?? normalized;
};

const isSameTeam = (left: string, right: string) => {
  const normalizedLeft = normalizeTeamName(left);
  const normalizedRight = normalizeTeamName(right);
  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
};

const getEspnScoreboardDates = () => {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10).replaceAll("-", "");
  const dates = [...new Set(matches.map((match) => match.date.replaceAll("-", "")))].filter((date) => date <= tomorrow);

  return dates.length ? dates : [today, new Date(Date.now() - 86400000).toISOString().slice(0, 10).replaceAll("-", "")];
};

const getEspnScoreboardEvents = async () => {
  if (espnScoreboardCache && espnScoreboardCache.expiresAt > Date.now()) return espnScoreboardCache.value;

  const scoreboards = await Promise.all(
    getEspnScoreboardDates().map((date) => getEspnScoreboard(date).catch(() => ({ events: [] }))),
  );
  const events = scoreboards.flatMap((scoreboard) => scoreboard.events ?? []);

  if (!events.length) throw new Error("ESPN không có dữ liệu bảng tỉ số");

  espnScoreboardCache = {
    expiresAt: Date.now() + ESPN_SCOREBOARD_CACHE_TTL,
    value: events,
  };
  return events;
};

const teamName = (event: EspnScoreboardEvent, side: "home" | "away") => {
  const competition = event.competitions?.[0];
  return competition?.competitors?.find((competitor) => competitor.homeAway === side)?.team?.displayName ?? "";
};

const findLocalMatch = (event: EspnScoreboardEvent) => {
  const home = teamName(event, "home");
  const away = teamName(event, "away");

  return (
    matches.find((match) => {
      const direct = isSameTeam(home, match.homeTeam) && isSameTeam(away, match.awayTeam);
      const reversed = isSameTeam(home, match.awayTeam) && isSameTeam(away, match.homeTeam);
      return direct || reversed;
    }) ?? null
  );
};

const parseEspnElapsed = (value: string | null | undefined, clockSeconds?: number | null) => {
  if (clockSeconds !== null && clockSeconds !== undefined && clockSeconds > 0) {
    return Math.floor(clockSeconds / 60);
  }
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
};

const statusFromEspn = (event: EspnScoreboardEvent): LiveMatchStatus => {
  const status = event.competitions?.[0]?.status;
  const statusName = status?.type?.name?.toLowerCase() ?? "";
  const statusDetail = (status?.type?.detail ?? status?.type?.shortDetail ?? status?.displayClock ?? "").toLowerCase();
  const completed = Boolean(status?.type?.completed);
  const elapsed = parseEspnElapsed(status?.displayClock, status?.clock);

  if (completed || statusName.includes("full_time") || statusName.includes("final") || statusDetail === "ft") return "finished";
  if (statusName.includes("half_time") || statusDetail === "ht") return "halftime";
  if (statusName.includes("in_progress") || status?.type?.state === "in" || (elapsed !== null && elapsed > 0)) return "live";
  return "scheduled";
};

export const getLiveScoresFromEspn = async (matchId?: string): Promise<LiveMatchScore[]> => {
  const events = await getEspnScoreboardEvents();
  const scores: LiveMatchScore[] = [];

  for (const event of events) {
    const localMatch = findLocalMatch(event);
    if (!localMatch || (matchId && localMatch.id !== matchId)) continue;

    const competition = event.competitions?.[0];
    const home = competition?.competitors?.find((c) => c.homeAway === "home");
    const away = competition?.competitors?.find((c) => c.homeAway === "away");
    const homeScore = parseNullableNumber(home?.score ?? null);
    const awayScore = parseNullableNumber(away?.score ?? null);
    const elapsed = parseEspnElapsed(competition?.status?.displayClock ?? home?.clock?.displayValue ?? away?.clock?.displayValue, competition?.status?.clock);
    const status = statusFromEspn(event);

    scores.push({
      matchId: localMatch.id,
      apiFixtureId: Number(event.id),
      status,
      statusShort: status === "live" ? "LIVE" : status === "finished" ? "FT" : status === "halftime" ? "HT" : "NS",
      statusLong: status === "live" ? "Live" : status === "finished" ? "Match Finished" : status === "halftime" ? "Half Time" : "Not Started",
      elapsed,
      homeScore,
      awayScore,
      halftimeHome: null,
      halftimeAway: null,
      fulltimeHome: status === "finished" ? homeScore : null,
      fulltimeAway: status === "finished" ? awayScore : null,
      updatedAt: new Date().toISOString(),
      events: [],
    });
  }

  return scores;
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
