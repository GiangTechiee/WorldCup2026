"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import type { LiveMatchScore, LiveMatchStatus, LiveScoresResponse } from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";
import { formatKickoff, type Match } from "@/lib/worldcup";

type TeamSummary = {
  countryCode: string;
  id: string | null;
  name: string;
};

const LIVE_WINDOW_MS = 2.75 * 60 * 60 * 1000;

const useClock = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  return now;
};

const statusLabel = (
  score: LiveMatchScore | null,
  displayStatus: LiveMatchStatus | "scheduled",
  elapsedByClock: number | null,
) => {
  if (displayStatus === "finished") return "Đã kết thúc";
  if (displayStatus === "live") {
    const elapsed = score?.elapsed ?? elapsedByClock;
    return elapsed !== null ? `Đang đá · ${elapsed}'` : "Đang đá";
  }
  if (displayStatus === "halftime") return "Nghỉ giữa hiệp";
  if (displayStatus === "postponed") return "Đã hoãn";
  if (displayStatus === "cancelled") return "Đã hủy";
  return score?.statusLong || "Chưa đá";
};

function TeamBlock({ side, team }: { side: "home" | "away"; team: TeamSummary }) {
  const content = (
    <>
      <TeamFlag className="match-summary-flag" countryCode={team.countryCode} label={team.name} />
      <strong>{team.name}</strong>
    </>
  );

  return (
    <div className={`match-summary-team match-summary-team-${side}`}>
      {team.id ? <Link href={`/doi-tuyen/${team.id}`}>{content}</Link> : content}
    </div>
  );
}

export function MatchDetailHeader({
  away,
  home,
  match,
}: {
  away: TeamSummary;
  home: TeamSummary;
  match: Match;
}) {
  const [score, setScore] = useState<LiveMatchScore | null>(null);
  const now = useClock();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const response = await fetch(`/api/live-scores?matchId=${match.id}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as LiveScoresResponse;
        if (isMounted) setScore(payload.matches[0] ?? null);
      } catch {
        if (isMounted) setScore(null);
      } finally {
        if (isMounted) timeoutId = setTimeout(load, 30_000);
      }
    };

    void load();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [match.id]);

  const kickoffTime = new Date(match.kickoffAt).getTime();
  const shouldBeLiveByClock =
    Number.isFinite(kickoffTime) &&
    now >= kickoffTime &&
    now < kickoffTime + LIVE_WINDOW_MS &&
    score?.status !== "finished" &&
    score?.status !== "postponed" &&
    score?.status !== "cancelled";
  const displayStatus = shouldBeLiveByClock ? "live" : score?.status ?? "scheduled";
  const elapsedByClock = shouldBeLiveByClock ? Math.max(0, Math.floor((now - kickoffTime) / 60_000) + 1) : null;
  const showScore = score
    ? isScoreVisible(score) || (displayStatus === "live" && score.homeScore !== null && score.awayScore !== null)
    : displayStatus === "live";
  const homeScore = showScore ? score?.homeScore ?? 0 : null;
  const awayScore = showScore ? score?.awayScore ?? 0 : null;

  return (
    <section className="match-summary-card">
      <div className="match-summary-top">
        <span>{match.group ?? match.round}</span>
        <FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} />
      </div>

      <div className="match-summary-status">
        <span className={displayStatus === "live" ? "match-summary-live" : ""}>
          {statusLabel(score, displayStatus, elapsedByClock)}
        </span>
        <small className="data">{formatKickoff(match.kickoffAt)}</small>
      </div>

      <div className="match-summary-main">
        <TeamBlock side="home" team={home} />

        <div className="match-summary-center">
          {showScore ? (
            <div className="match-summary-score data" aria-label={`Tỉ số ${homeScore} - ${awayScore}`}>
              <strong>{homeScore}</strong>
              <span>-</span>
              <strong>{awayScore}</strong>
            </div>
          ) : (
            <div className="match-summary-score-empty" aria-label="Chưa có tỷ số" />
          )}
          <small>Giờ Việt Nam</small>
        </div>

        <TeamBlock side="away" team={away} />
      </div>

      <div className="match-summary-meta">
        <span className="data">#{String(match.number).padStart(3, "0")}</span>
        <strong>{match.ground}</strong>
        <span>{match.round}</span>
      </div>
    </section>
  );
}
