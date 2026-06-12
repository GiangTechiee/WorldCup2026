"use client";

import { useLiveScores } from "@/components/live-scores-provider";

export function LiveScoresNotice() {
  const liveScores = useLiveScores();

  if (!liveScores || liveScores.isLoading || !liveScores.error) return null;

  return (
    <div className="live-scores-notice" role="status">
      <strong>Dữ liệu tỉ số thật chưa khả dụng.</strong>
      <span>{liveScores.error}</span>
    </div>
  );
}
