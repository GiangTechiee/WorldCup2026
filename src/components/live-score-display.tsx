"use client";

import { useLiveScores } from "@/components/live-scores-provider";
import type { LiveMatchScore } from "@/lib/live-score";

const labelForStatus = (score: LiveMatchScore | undefined) => {
  if (!score) return "Chưa đá";

  switch (score.status) {
    case "live":
      return "LIVE";
    case "halftime":
      return "HT";
    case "finished":
      return "KT";
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

  return (
    <div className={`match-score-display match-score-${score?.status ?? "scheduled"}`} aria-label={statusLabel}>
      <div className="match-score-kicker">
        <span className="match-score-status">{statusLabel}</span>
        {score?.elapsed != null && score.status === "live" && (
          <span className="match-score-minute data">{score.elapsed}&apos;</span>
        )}
      </div>
    </div>
  );
}
