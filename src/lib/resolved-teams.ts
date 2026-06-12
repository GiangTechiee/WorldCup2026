import { isPlaceholderSlot, slotLabel } from "@/lib/match-slots";
import type { LiveMatchScore } from "@/lib/live-score";
import { getTeam, type Match } from "@/lib/worldcup";
import type { WorldCup26Standing } from "@/lib/worldcup26-api";

export type DisplayTeam = {
  countryCode: string | null;
  isPlaceholder: boolean;
  name: string;
  slot: string;
};

const realTeamDisplay = (name: string): DisplayTeam => {
  const team = getTeam(name);
  return {
    countryCode: team?.countryCode ?? null,
    isPlaceholder: false,
    name,
    slot: name,
  };
};

const placeholderDisplay = (slot: string): DisplayTeam => ({
  countryCode: null,
  isPlaceholder: true,
  name: slotLabel(slot),
  slot,
});

export const createTeamResolver = ({
  matches,
  scores,
  standings,
}: {
  matches: Match[];
  scores: LiveMatchScore[];
  standings: WorldCup26Standing[];
}) => {
  const matchesByNumber = new Map(matches.map((match) => [match.number, match]));
  const scoresByMatchId = new Map(scores.map((score) => [score.matchId, score]));
  const groupSlots = new Map<string, string>();
  const completedGroups = new Set<string>();
  const cache = new Map<string, DisplayTeam>();

  for (const groupName of new Set(matches.map((match) => match.group).filter((group): group is string => Boolean(group)))) {
    const groupMatches = matches.filter((match) => match.group === groupName);
    if (
      groupMatches.length > 0 &&
      groupMatches.every((match) => scoresByMatchId.get(match.id)?.status === "finished")
    ) {
      completedGroups.add(groupName.replace(/^Group\s+/i, ""));
    }
  }

  for (const group of standings) {
    const groupName = group.group.replace(/^Group\s+/i, "");
    for (const [index, row] of group.teams.entries()) {
      groupSlots.set(`${index + 1}${groupName}`, row.name);
    }
  }

  const resolve = (slot: string): DisplayTeam => {
    const cached = cache.get(slot);
    if (cached) return cached;

    const realTeam = getTeam(slot);
    if (realTeam) {
      const display = realTeamDisplay(slot);
      cache.set(slot, display);
      return display;
    }

    const exactGroupSlot = slot.match(/^([12])([A-L])$/);
    if (exactGroupSlot && completedGroups.has(exactGroupSlot[2])) {
      const teamName = groupSlots.get(`${exactGroupSlot[1]}${exactGroupSlot[2]}`);
      if (teamName) {
        const display = realTeamDisplay(teamName);
        cache.set(slot, display);
        return display;
      }
    }

    const winnerOrLoser = slot.match(/^([WL])(\d+)$/);
    if (winnerOrLoser) {
      const match = matchesByNumber.get(Number(winnerOrLoser[2]));
      const score = match ? scoresByMatchId.get(match.id) : null;
      if (
        match &&
        score?.status === "finished" &&
        score.homeScore !== null &&
        score.awayScore !== null &&
        score.homeScore !== score.awayScore
      ) {
        const homeAdvances = winnerOrLoser[1] === "W"
          ? score.homeScore > score.awayScore
          : score.homeScore < score.awayScore;
        const display = resolve(homeAdvances ? match.homeTeam : match.awayTeam);
        cache.set(slot, display);
        return display;
      }
    }

    const display = isPlaceholderSlot(slot) ? placeholderDisplay(slot) : realTeamDisplay(slot);
    cache.set(slot, display);
    return display;
  };

  return resolve;
};
