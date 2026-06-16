import groupsSource from "@/data/raw/worldcup.groups.json";
import stadiumsSource from "@/data/raw/worldcup.stadiums.json";
import teamsSource from "@/data/raw/worldcup.teams.json";
import tournamentSource from "@/data/raw/worldcup.json";

export type Team = {
  id: string;
  name: string;
  code: string;
  group: string;
  continent: string;
  confed: string;
  flag: string;
  countryCode: string;
};

export type Match = {
  id: string;
  number: number;
  round: string;
  date: string;
  kickoffAt: string;
  timeLabel: string;
  homeTeam: string;
  awayTeam: string;
  group: string | null;
  ground: string;
};

export type Group = {
  id: string;
  name: string;
  teams: Team[];
};

export type Stadium = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  timezone: string;
  capacity: number;
  coordinates: string;
};

type RawMatch = (typeof tournamentSource.matches)[number];
type RawTeam = (typeof teamsSource)[number];

const specialCountryCodes: Record<string, string> = {
  England: "GB_ENG",
  Scotland: "GB_SCT",
};

const countryCodeFromFlag = (name: string, flag: string) => {
  if (specialCountryCodes[name]) return specialCountryCodes[name];
  const indicators = [...flag].map((character) => character.codePointAt(0) ?? 0);
  if (indicators.length !== 2) return null;
  return indicators
    .map((codePoint) => String.fromCharCode(codePoint - 0x1f1e6 + 65))
    .join("");
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parseKickoff = (date: string, time: string) => {
  const match = time.match(/^(\d{2}:\d{2}) UTC([+-])(\d{1,2})$/);
  if (!match) throw new Error(`Không thể đọc thời gian: ${date} ${time}`);

  const [, clock, sign, hours] = match;
  return new Date(`${date}T${clock}:00${sign}${hours.padStart(2, "0")}:00`).toISOString();
};

export const teams: Team[] = (teamsSource as RawTeam[]).map((team) => ({
  id: slugify(team.name),
  name: team.name,
  code: team.fifa_code,
  group: team.group,
  continent: team.continent,
  confed: team.confed,
  flag: team.flag_icon,
  countryCode: countryCodeFromFlag(team.name, team.flag_icon) ?? "",
}));

export const matches: Match[] = (tournamentSource.matches as RawMatch[])
  .map((match, index) => ({
    id: `match-${match.num ?? index + 1}`,
    number: match.num ?? index + 1,
    round: match.round,
    date: match.date,
    kickoffAt: parseKickoff(match.date, match.time),
    timeLabel: match.time,
    homeTeam: match.team1,
    awayTeam: match.team2,
    group: match.group ?? null,
    ground: match.ground,
  }))
  .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));

export const groups: Group[] = groupsSource.groups.map((group) => ({
  id: slugify(group.name),
  name: group.name,
  teams: group.teams.map((name) => {
    const team = teams.find((item) => item.name === name);
    if (!team) throw new Error(`Không tìm thấy đội ${name} trong ${group.name}`);
    return team;
  }),
}));

export const stadiums: Stadium[] = stadiumsSource.stadiums.map((stadium) => ({
  id: slugify(stadium.city),
  name: stadium.name,
  city: stadium.city,
  countryCode: stadium.cc.toUpperCase(),
  timezone: stadium.timezone,
  capacity: stadium.capacity,
  coordinates: stadium.coords,
}));

export const formatKickoff = (kickoffAt: string, timezone = "Asia/Ho_Chi_Minh") =>
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(kickoffAt));

export const DEFAULT_DISPLAY_TIMEZONE = "Asia/Ho_Chi_Minh";

export const getDateKeyInTimezone = (date: Date, timezone = DEFAULT_DISPLAY_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const TEAM_NAME_MAPPINGS: Record<string, string> = {
  "bosnia and herzegovina": "Bosnia & Herzegovina",
  "democratic republic of the congo": "DR Congo",
  "united states": "USA",
};

export const getTeam = (nameOrId: string) => {
  if (!nameOrId) return null;
  const key = nameOrId.toLowerCase().trim();
  const mappedName = TEAM_NAME_MAPPINGS[key] || nameOrId;
  const target = mappedName.toLowerCase().trim();
  return (
    teams.find(
      (team) =>
        team.name.toLowerCase() === target ||
        team.id.toLowerCase() === target ||
        team.code.toLowerCase() === target
    ) ?? null
  );
};

export const getMatch = (id: string) =>
  matches.find((match) => match.id === id) ?? null;

export const getGroup = (id: string) =>
  groups.find((group) => group.id === id) ?? null;

export const getMatchesByTeam = (nameOrId: string) => {
  const team = getTeam(nameOrId);
  if (!team) return [];
  const teamName = team.name;
  return matches.filter(
    (match) => match.homeTeam === teamName || match.awayTeam === teamName,
  );
};

export const getMatchesByDate = (date: string) =>
  matches.filter((match) => match.date === date);

export const getMatchesByDisplayDate = (date: string, timezone = DEFAULT_DISPLAY_TIMEZONE) =>
  matches.filter((match) => getDateKeyInTimezone(new Date(match.kickoffAt), timezone) === date);

export const getNextMatch = (now = new Date()) =>
  matches.find((match) => new Date(match.kickoffAt) >= now) ?? matches.at(-1) ?? null;

export const getCurrentDisplayDayMatches = (now = new Date(), timezone = DEFAULT_DISPLAY_TIMEZONE) => {
  const today = getDateKeyInTimezone(now, timezone);
  const todayMatches = getMatchesByDisplayDate(today, timezone);
  if (todayMatches.length) return { date: today, matches: todayMatches };

  const nextMatch = getNextMatch(now);
  if (!nextMatch) return { date: today, matches: [] };

  const nextDate = getDateKeyInTimezone(new Date(nextMatch.kickoffAt), timezone);
  return { date: nextDate, matches: getMatchesByDisplayDate(nextDate, timezone) };
};

export const getNextDisplayDayMatches = (now = new Date(), timezone = DEFAULT_DISPLAY_TIMEZONE) => {
  const currentDate = getCurrentDisplayDayMatches(now, timezone).date;
  const nextDate =
    [...new Set(matches.map((match) => getDateKeyInTimezone(new Date(match.kickoffAt), timezone)))]
      .sort()
      .find((date) => date > currentDate) ?? null;

  return nextDate ? { date: nextDate, matches: getMatchesByDisplayDate(nextDate, timezone) } : { date: currentDate, matches: [] };
};

export const tournamentStats = {
  matches: matches.length,
  teams: teams.length,
  groups: groups.length,
  stadiums: stadiums.length,
  startsAt: matches[0]?.kickoffAt ?? null,
  endsAt: matches.at(-1)?.kickoffAt ?? null,
};
