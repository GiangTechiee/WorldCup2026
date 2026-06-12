"use client";

import { useEffect, useState } from "react";
import { Lightning, SoccerBall } from "@phosphor-icons/react";
import type { LiveMatchEvent, LiveMatchScore, LiveScoresResponse } from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";
import type { Match } from "@/lib/worldcup";

const statusLabel = (score: LiveMatchScore) => {
  if (score.status === "live") return `Đang đá${score.elapsed !== null ? ` · ${score.elapsed}'` : ""}`;
  if (score.status === "halftime") return "Nghỉ giữa hiệp";
  if (score.status === "finished") return "Đã kết thúc";
  if (score.status === "postponed") return "Đã hoãn";
  if (score.status === "cancelled") return "Đã hủy";
  return score.statusLong || "Chưa có trạng thái";
};

const eventTitle = (event: LiveMatchEvent) => {
  if (event.type.toLowerCase() === "goal") return "Bàn thắng";
  return event.detail || event.type;
};

export function LiveMatchPanel({ match }: { match: Match }) {
  const [score, setScore] = useState<LiveMatchScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const response = await fetch(`/api/live-scores?matchId=${match.id}&events=1`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as LiveScoresResponse;
        if (!isMounted) return;

        setError(payload.error ?? null);
        setScore(payload.matches[0] ?? null);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu trận đấu");
        setScore(null);
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

  const hasVisibleScore = score ? isScoreVisible(score) : false;
  const events = score?.events ?? [];

  return (
    <section className="live-match-panel">
      <div className="live-match-panel-head">
        <div>
          <span className="eyebrow">Diễn biến trận đấu</span>
          <h2 className="live-match-title">Tỉ số & sự kiện</h2>
        </div>
        {score && <span className={`live-pill live-pill-${score.status}`}>{statusLabel(score)}</span>}
      </div>

      {hasVisibleScore && score ? (
        <>
          <div className="live-match-scoreboard">
            <strong>{match.homeTeam}</strong>
            <div className="live-match-score data">
              <span>{score.homeScore}</span>
              <i>-</i>
              <span>{score.awayScore}</span>
            </div>
            <strong>{match.awayTeam}</strong>
          </div>

          <div className="live-events" aria-label="Dòng sự kiện trận đấu">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div className="live-event" key={`${event.elapsed}-${event.type}-${index}`}>
                  <span className="live-event-minute data">
                    {event.elapsed ?? "-"}&apos;{event.extra ? `+${event.extra}` : ""}
                  </span>
                  <span className="live-event-icon">
                    <SoccerBall size={16} weight={event.type === "Goal" ? "fill" : "regular"} />
                  </span>
                  <div className="live-event-body">
                    <strong>{eventTitle(event)}</strong>
                    <span>
                      {event.teamName ?? "Sự kiện"}
                      {event.playerName ? ` · ${event.playerName}` : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="live-event-empty">
                <strong>Chưa có sự kiện chi tiết.</strong>
                <span>Nguồn live hiện chỉ có tỉ số cho trận này.</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="live-match-empty">
          <Lightning size={20} weight="fill" />
          <div>
            <strong>Chưa có dữ liệu diễn biến cho trận này.</strong>
            <p>
              {error ??
                "Khi nguồn World Cup 2026 có tỉ số hoặc sự kiện, khu vực này sẽ tự cập nhật."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
