import "server-only";

import type {
  LiveMatchEvent,
  MatchDetailsResponse,
  MatchLineup,
  MatchLineupPlayer,
  MatchStatistic,
} from "@/lib/live-score";
import type { Match } from "@/lib/worldcup";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

type EspnTeam = {
  id?: string;
  displayName?: string;
};

type EspnScoreboardEvent = {
  id?: string;
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: "home" | "away";
      team?: EspnTeam;
    }>;
  }>;
};

type EspnScoreboard = {
  events?: EspnScoreboardEvent[];
};

type EspnRosterEntry = {
  starter?: boolean;
  jersey?: string;
  athlete?: {
    headshot?: {
      href?: string;
    };
    id?: string;
    displayName?: string;
    jerseyImages?: Array<{
      href?: string;
    }>;
  };
  position?: {
    abbreviation?: string;
  };
  formationPlace?: string;
};

type EspnSummary = {
  rosters?: Array<{
    homeAway?: "home" | "away";
    team?: EspnTeam;
    formation?: string;
    roster?: EspnRosterEntry[];
  }>;
  boxscore?: {
    teams?: Array<{
      homeAway?: "home" | "away";
      team?: EspnTeam;
      statistics?: Array<{
        name?: string;
        displayValue?: string;
      }>;
    }>;
  };
  keyEvents?: Array<{
    type?: {
      text?: string;
      type?: string;
    };
    clock?: {
      displayValue?: string;
    };
    team?: EspnTeam;
    participants?: Array<{
      athlete?: {
        displayName?: string;
      };
    }>;
    text?: string;
  }>;
};

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

const fetchEspn = async <T>(path: string, revalidate: number): Promise<T> => {
  const response = await fetch(`${ESPN_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate,
    },
    signal: AbortSignal.timeout(4_000),
  });

  if (!response.ok) throw new Error(`ESPN returned HTTP ${response.status}`);
  return (await response.json()) as T;
};

const teamName = (event: EspnScoreboardEvent, side: "home" | "away") =>
  event.competitions?.[0]?.competitors?.find((competitor) => competitor.homeAway === side)?.team?.displayName ?? "";

const findEventId = async (match: Match) => {
  const kickoff = new Date(match.kickoffAt);
  const dates = [-1, 0, 1].map((offset) => {
    const candidate = new Date(kickoff);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    return candidate.toISOString().slice(0, 10).replaceAll("-", "");
  });
  const scoreboards = await Promise.all(
    [...new Set(dates)].map((date) => fetchEspn<EspnScoreboard>(`/scoreboard?dates=${date}`, 1800)),
  );
  const event = scoreboards
    .flatMap((scoreboard) => scoreboard.events ?? [])
    .find((item) => {
      const home = teamName(item, "home");
      const away = teamName(item, "away");
      const direct = isSameTeam(home, match.homeTeam) && isSameTeam(away, match.awayTeam);
      const reversed = isSameTeam(home, match.awayTeam) && isSameTeam(away, match.homeTeam);
      return direct || reversed;
    });

  return event?.id ?? null;
};

const parseMinute = (displayValue: string | undefined) => {
  if (!displayValue) return { elapsed: null, extra: null };
  const values = displayValue.match(/\d+/g)?.map(Number) ?? [];
  return {
    elapsed: values[0] ?? null,
    extra: values[1] ?? null,
  };
};

const eventTypes = new Set(["goal", "yellow-card", "red-card", "substitution"]);

const toEvents = (summary: EspnSummary): LiveMatchEvent[] =>
  (summary.keyEvents ?? [])
    .filter((event) => eventTypes.has(event.type?.type ?? ""))
    .map((event) => {
      const minute = parseMinute(event.clock?.displayValue);
      const participants = event.participants ?? [];
      return {
        elapsed: minute.elapsed,
        extra: minute.extra,
        teamName: event.team?.displayName ?? null,
        playerName: participants[0]?.athlete?.displayName ?? null,
        assistName: participants[1]?.athlete?.displayName ?? null,
        type: event.type?.type === "goal" ? "Goal" : event.type?.type === "substitution" ? "subst" : "Card",
        detail: event.type?.text ?? "Event",
        comments: event.text ?? null,
      };
    })
    .sort((left, right) => (left.elapsed ?? 999) - (right.elapsed ?? 999));

const toPlayer = (entry: EspnRosterEntry): MatchLineupPlayer => ({
  id: entry.athlete?.id ? Number(entry.athlete.id) : null,
  imageUrl: entry.athlete?.headshot?.href ?? null,
  jerseyUrl: entry.athlete?.jerseyImages?.[0]?.href ?? null,
  name: entry.athlete?.displayName ?? "Chưa xác định",
  number: entry.jersey ? Number(entry.jersey) : null,
  position: entry.position?.abbreviation ?? null,
  grid: entry.formationPlace ?? null,
});

const toLineups = (summary: EspnSummary): MatchLineup[] =>
  (summary.rosters ?? []).map((roster) => {
    const starters = (roster.roster ?? []).filter((entry) => entry.starter);
    const substitutes = (roster.roster ?? []).filter((entry) => !entry.starter);

    return {
      teamName: roster.team?.displayName ?? "Đội tuyển",
      formation: roster.formation ?? null,
      coachName: null,
      starters: starters.map(toPlayer),
      substitutes: substitutes.map(toPlayer),
    };
  });

const statisticNames: Record<string, string> = {
  totalShots: "Total Shots",
  shotsOnTarget: "Shots on Goal",
  possessionPct: "Ball Possession",
  totalPasses: "Total passes",
  accuratePasses: "Passes accurate",
  passPct: "Passes %",
  foulsCommitted: "Fouls",
  yellowCards: "Yellow Cards",
  redCards: "Red Cards",
  offsides: "Offsides",
  wonCorners: "Corner Kicks",
  saves: "Goalkeeper Saves",
  blockedShots: "Blocked Shots",
};

const formatStatistic = (name: string, value: string | undefined) => {
  if (value === undefined) return null;
  if (name === "possessionPct") return `${Math.round(Number(value))}%`;
  if (name === "passPct") return `${Math.round(Number(value) * 100)}%`;
  return value;
};

const toStatistics = (summary: EspnSummary): MatchStatistic[] => {
  const home = summary.boxscore?.teams?.find((team) => team.homeAway === "home");
  const away = summary.boxscore?.teams?.find((team) => team.homeAway === "away");
  const types = Object.keys(statisticNames);

  return types
    .map((name) => ({
      type: statisticNames[name],
      home: formatStatistic(name, home?.statistics?.find((statistic) => statistic.name === name)?.displayValue),
      away: formatStatistic(name, away?.statistics?.find((statistic) => statistic.name === name)?.displayValue),
    }))
    .filter((statistic) => statistic.home !== null || statistic.away !== null);
};

export const getEspnMatchDetails = async (match: Match): Promise<MatchDetailsResponse> => {
  const eventId = await findEventId(match);
  if (!eventId) throw new Error(`Không tìm thấy trận ${match.homeTeam} - ${match.awayTeam} trên ESPN`);

  const isNearMatch = Math.abs(Date.now() - new Date(match.kickoffAt).getTime()) < 4 * 60 * 60 * 1000;
  const summary = await fetchEspn<EspnSummary>(`/summary?event=${eventId}`, isNearMatch ? 60 : 3600);

  return {
    source: "espn",
    configured: true,
    fixtureId: Number(eventId),
    updatedAt: new Date().toISOString(),
    events: toEvents(summary),
    lineups: toLineups(summary),
    statistics: toStatistics(summary),
  };
};

export const getEspnScoreboard = async (date: string): Promise<EspnScoreboard> => {
  return fetchEspn<EspnScoreboard>(`/scoreboard?dates=${date}`, 300);
};
