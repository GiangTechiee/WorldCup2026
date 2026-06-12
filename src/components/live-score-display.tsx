"use client";

import { useLiveScores } from "@/components/live-scores-provider";
import type { LiveMatchScore } from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";

const labelForStatus = (score: LiveMatchScore | undefined) => {
  if (!score) return "Chưa đá";

  switch (score.status) {
    case "live":
      return "LIVE";
    case "halftime":
      return "HT";
    case "postponed":
      return "Hoãn";
    case "cancelled":
      return "Hủy";
    default:
      return "Chưa đá";
  }
};

export function LiveScoreDisplay({
  matchId,
}: {
  kickoffAt: string;
  matchId: string;
}) {
  const liveScores = useLiveScores();
  const score = liveScores?.scoresByMatchId[matchId];
  const statusLabel = labelForStatus(score);
  const visibleScore = score && isScoreVisible(score) ? score : null;
  const showFinalScore = score?.status === "finished" && isScoreVisible(score);

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
    <div className={`match-score-display match-score-${score?.status ?? "scheduled"}`} aria-label={statusLabel}>
      {visibleScore && (
        <div className="match-scoreline data">
          <strong>{visibleScore.homeScore}</strong>
          <span>-</span>
          <strong>{visibleScore.awayScore}</strong>
        </div>
      )}
      <div className="match-score-kicker">
        <span className="match-score-status">{statusLabel}</span>
        {score?.elapsed != null && score.status === "live" && (
          <span className="match-score-minute data">{score.elapsed}&apos;</span>
        )}
      </div>
    </div>
  );
}
