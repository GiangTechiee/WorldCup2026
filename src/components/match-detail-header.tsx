"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import type { LiveMatchScore, LiveScoresResponse } from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";
import { formatKickoff, type Match } from "@/lib/worldcup";

type TeamSummary = {
  countryCode: string;
  id: string | null;
  name: string;
};

const statusLabel = (score: LiveMatchScore | null) => {
  if (!score) return "Chưa đá";
  if (score.status === "finished") return "Đã kết thúc";
  if (score.status === "live") return score.elapsed !== null ? `Đang đá · ${score.elapsed}'` : "Đang đá";
  if (score.status === "halftime") return "Nghỉ giữa hiệp";
  if (score.status === "postponed") return "Đã hoãn";
  if (score.status === "cancelled") return "Đã hủy";
  return score.statusLong || "Chưa đá";
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

  const showScore = score ? isScoreVisible(score) : false;

  return (
    <section className="match-summary-card">
      <div className="match-summary-top">
        <span>{match.group ?? match.round}</span>
        <FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} />
      </div>

      <div className="match-summary-status">
        <span className={score?.status === "live" ? "match-summary-live" : ""}>{statusLabel(score)}</span>
        <small className="data">{formatKickoff(match.kickoffAt)}</small>
      </div>

      <div className="match-summary-main">
        <TeamBlock side="home" team={home} />

        <div className="match-summary-center">
          {showScore && score ? (
            <div className="match-summary-score data" aria-label={`Tỉ số ${score.homeScore} - ${score.awayScore}`}>
              <strong>{score.homeScore}</strong>
              <span>-</span>
              <strong>{score.awayScore}</strong>
            </div>
          ) : (
            <div className="match-summary-vs">VS</div>
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
