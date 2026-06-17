import type { LiveMatchScore } from "@/lib/live-score";

export const LIVE_WINDOW_MS = 3.5 * 60 * 60 * 1000;

const FIRST_HALF_MINUTES = 45;
const HALFTIME_BREAK_MINUTES = 15;
const SECOND_HALF_START_MINUTES = FIRST_HALF_MINUTES + HALFTIME_BREAK_MINUTES;
const SECOND_HALF_END_MINUTES = SECOND_HALF_START_MINUTES + FIRST_HALF_MINUTES;
const EXTRA_TIME_START_MINUTES = SECOND_HALF_END_MINUTES;
const EXTRA_TIME_SECOND_HALF_START_MINUTES = EXTRA_TIME_START_MINUTES + FIRST_HALF_MINUTES;
const EXTRA_TIME_END_MINUTES = EXTRA_TIME_SECOND_HALF_START_MINUTES + FIRST_HALF_MINUTES;

export type LiveClock = {
  elapsed: number;
  extra: number | null;
};

const withExtra = (elapsed: number, value: number): LiveClock => {
  const extra = Math.ceil(value);
  return extra > 0 ? { elapsed, extra } : { elapsed, extra: null };
};

const regularMinute = (elapsed: number) => ({
  elapsed: Math.floor(elapsed) + 1,
  extra: null,
});

export const getLiveClock = (kickoffAt: string, now = Date.now()): LiveClock | null => {
  const kickoffTime = new Date(kickoffAt).getTime();
  if (!Number.isFinite(kickoffTime)) return null;

  const rawElapsedMinutes = (now - kickoffTime) / 60_000;
  if (rawElapsedMinutes < 0) return null;

  if (rawElapsedMinutes < FIRST_HALF_MINUTES) {
    return regularMinute(rawElapsedMinutes);
  }

  if (rawElapsedMinutes < SECOND_HALF_START_MINUTES) {
    return null;
  }

  if (rawElapsedMinutes < SECOND_HALF_END_MINUTES) {
    const secondHalfElapsed = rawElapsedMinutes - SECOND_HALF_START_MINUTES;
    if (secondHalfElapsed < FIRST_HALF_MINUTES) {
      return regularMinute(45 + secondHalfElapsed);
    }
    return withExtra(90, secondHalfElapsed - FIRST_HALF_MINUTES);
  }

  if (rawElapsedMinutes < EXTRA_TIME_SECOND_HALF_START_MINUTES) {
    const extraTimeFirstHalfElapsed = rawElapsedMinutes - EXTRA_TIME_START_MINUTES;
    if (extraTimeFirstHalfElapsed < 1) {
      return withExtra(90, extraTimeFirstHalfElapsed);
    }
    return regularMinute(90 + extraTimeFirstHalfElapsed);
  }

  if (rawElapsedMinutes < EXTRA_TIME_END_MINUTES) {
    const extraTimeSecondHalfElapsed = rawElapsedMinutes - EXTRA_TIME_SECOND_HALF_START_MINUTES;
    if (extraTimeSecondHalfElapsed < 1) {
      return withExtra(105, extraTimeSecondHalfElapsed);
    }
    return regularMinute(105 + extraTimeSecondHalfElapsed);
  }

  const penaltyElapsed = rawElapsedMinutes - EXTRA_TIME_END_MINUTES;
  if (penaltyElapsed < 1) {
    return withExtra(120, penaltyElapsed);
  }
  return {
    elapsed: 120 + Math.floor(penaltyElapsed),
    extra: null,
  };
};

export const resolveLiveClock = (
  score: LiveMatchScore | null | undefined,
  liveClock: LiveClock | null,
): LiveClock | null => {
  if (!liveClock) {
    return score?.elapsed != null ? { elapsed: score.elapsed, extra: null } : null;
  }
  if (score?.elapsed == null) return liveClock;
  if (score.elapsed > liveClock.elapsed + 5) return liveClock;
  if (score.elapsed >= 90 && liveClock.elapsed >= 90 && score.elapsed <= liveClock.elapsed + 5) {
    return {
      elapsed: score.elapsed,
      extra: score.elapsed === liveClock.elapsed ? liveClock.extra : null,
    };
  }
  return liveClock;
};

export const formatLiveClock = (clock: LiveClock) =>
  `${clock.elapsed}${clock.extra ? `+${clock.extra}` : ""}'`;
