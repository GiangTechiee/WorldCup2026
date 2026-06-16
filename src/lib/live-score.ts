export type LiveMatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled"
  | "unknown";

export type LiveMatchEvent = {
  elapsed: number | null;
  extra: number | null;
  teamName: string | null;
  playerName: string | null;
  assistName: string | null;
  type: string;
  detail: string;
  comments: string | null;
};

export type LiveMatchScore = {
  matchId: string;
  apiFixtureId: number;
  status: LiveMatchStatus;
  statusShort: string;
  statusLong: string;
  elapsed: number | null;
  homeScore: number | null;
  awayScore: number | null;
  halftimeHome: number | null;
  halftimeAway: number | null;
  fulltimeHome: number | null;
  fulltimeAway: number | null;
  updatedAt: string;
  events?: LiveMatchEvent[];
};

export type LiveScoresResponse = {
  source: "worldcup26" | "espn" | "fallback";
  configured: boolean;
  updatedAt: string;
  matches: LiveMatchScore[];
  error?: string;
};

export type MatchLineupPlayer = {
  id: number | null;
  imageUrl: string | null;
  jerseyUrl: string | null;
  name: string;
  number: number | null;
  position: string | null;
  grid: string | null;
};

export type MatchLineup = {
  teamName: string;
  formation: string | null;
  coachName: string | null;
  starters: MatchLineupPlayer[];
  substitutes: MatchLineupPlayer[];
};

export type MatchStatistic = {
  type: string;
  home: string | number | null;
  away: string | number | null;
};

export type MatchDetailsResponse = {
  source: "espn" | "api-football" | "unconfigured" | "fallback" | "worldcup26";
  configured: boolean;
  fixtureId: number | null;
  updatedAt: string;
  events: LiveMatchEvent[];
  lineups: MatchLineup[];
  statistics: MatchStatistic[];
  error?: string;
};

export const statusFromApiFootball = (shortStatus: string | null | undefined): LiveMatchStatus => {
  switch (shortStatus) {
    case "TBD":
    case "NS":
      return "scheduled";
    case "1H":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
      return "live";
    case "HT":
      return "halftime";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled";
    default:
      return "unknown";
  }
};

export const isScoreVisible = (score: LiveMatchScore) =>
  score.homeScore !== null &&
  score.awayScore !== null &&
  score.status !== "scheduled" &&
  score.status !== "unknown";
