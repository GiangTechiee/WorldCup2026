"use client";

import { useEffect, useState } from "react";
import { useLiveScores } from "@/components/live-scores-provider";
import type { LiveMatchStatus } from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";

const LIVE_WINDOW_MS = 2.75 * 60 * 60 * 1000;

const labelForStatus = (status: LiveMatchStatus | "scheduled") => {
  if (status === "live") return "LIVE";
  if (status === "halftime") return "HT";
  if (status === "postponed") return "Hoãn";
  if (status === "cancelled") return "Hủy";
  return "Chưa đá";
};

const useClock = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  return now;
};

export function LiveScoreDisplay({
  kickoffAt,
  matchId,
}: {
  kickoffAt: string;
  matchId: string;
}) {
  const now = useClock();
  const liveScores = useLiveScores();
  const score = liveScores?.scoresByMatchId[matchId];
  const kickoffTime = new Date(kickoffAt).getTime();
  const shouldBeLiveByClock =
    Number.isFinite(kickoffTime) &&
    now >= kickoffTime &&
    now < kickoffTime + LIVE_WINDOW_MS &&
    score?.status !== "finished" &&
    score?.status !== "postponed" &&
    score?.status !== "cancelled";
  const displayStatus = shouldBeLiveByClock ? "live" : score?.status ?? "scheduled";
  const statusLabel = labelForStatus(displayStatus);
  const visibleScore =
    score && (isScoreVisible(score) || (displayStatus === "live" && score.homeScore !== null && score.awayScore !== null))
      ? score
      : null;
  const showFinalScore = score?.status === "finished" && isScoreVisible(score);
  const elapsedByClock = shouldBeLiveByClock ? Math.max(0, Math.floor((now - kickoffTime) / 60_000) + 1) : null;
  const displayScore = visibleScore ?? (displayStatus === "live" ? { homeScore: 0, awayScore: 0 } : null);
  const scoreAriaLabel = displayScore ? `Tỉ số ${displayScore.homeScore} - ${displayScore.awayScore}. ${statusLabel}` : statusLabel;

  if (score?.status === "finished") {
    return (
      <div
        className="match-score-display match-score-finished"
        aria-label={showFinalScore ? `Kết thúc, tỷ số ${score.homeScore} - ${score.awayScore}` : "Kết thúc"}
      >
        {showFinalScore && (
          <div className="match-scoreline data">
            <strong>{score.homeScore}</strong>
            <span>-</span>
            <strong>{score.awayScore}</strong>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`match-score-display match-score-${displayStatus}`} aria-label={scoreAriaLabel}>
      {displayScore && (
        <div className="match-scoreline data">
          <strong>{displayScore.homeScore}</strong>
          <span>-</span>
          <strong>{displayScore.awayScore}</strong>
        </div>
      )}
      <div className="match-score-kicker">
        <span className="match-score-status">{statusLabel}</span>
        {displayStatus === "live" && (score?.elapsed != null || elapsedByClock != null) && (
          <span className="match-score-minute data">{score?.elapsed ?? elapsedByClock}&apos;</span>
        )}
      </div>
    </div>
  );
}
