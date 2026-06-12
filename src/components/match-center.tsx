"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SoccerBall } from "@phosphor-icons/react";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import type { LiveMatchEvent, LiveMatchScore, LiveScoresResponse } from "@/lib/live-score";
import { formatKickoff, type Match } from "@/lib/worldcup";

type TeamSummary = {
  countryCode: string;
  id: string | null;
  name: string;
};

const statusLabel = (score: LiveMatchScore | null) => {
  if (!score) return "Chưa đá";
  if (score.status === "finished") return "Kết thúc";
  if (score.status === "live") return score.elapsed !== null ? `Đang đá · ${score.elapsed}'` : "Đang đá";
  if (score.status === "halftime") return "Nghỉ giữa hiệp";
  if (score.status === "postponed") return "Hoãn";
  if (score.status === "cancelled") return "Hủy";
  return score.statusLong || "Chưa đá";
};

const eventLabel = (event: LiveMatchEvent) => {
  if (event.type.toLowerCase() === "goal") return "Bàn thắng";
  return event.detail || event.type;
};

const eventSide = (event: LiveMatchEvent, homeName: string, awayName: string) => {
  if (event.teamName === homeName) return "home";
  if (event.teamName === awayName) return "away";
  return "neutral";
};

function TeamColumn({ seed, team }: { seed: string; team: TeamSummary }) {
  const content = (
    <>
      <TeamFlag className="match-center-flag" countryCode={team.countryCode} label={team.name} />
      <strong>{team.name}</strong>
    </>
  );

  return (
    <div className="match-center-team">
      {team.id ? <Link href={`/doi-tuyen/${team.id}`}>{content}</Link> : content}
      <span>{seed}</span>
    </div>
  );
}

function MissingData({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="match-data-missing">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function MatchCenter({
  away,
  home,
  match,
}: {
  away: TeamSummary;
  home: TeamSummary;
  match: Match;
}) {
  const [activeTab, setActiveTab] = useState<"events" | "lineups" | "stats">("events");
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
        setScore(payload.matches[0] ?? null);
        setError(payload.error ?? null);
      } catch (fetchError) {
        if (!isMounted) return;
        setScore(null);
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu trận đấu");
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

  const events = useMemo(() => score?.events ?? [], [score?.events]);
  const homeEvents = events.filter((event) => eventSide(event, match.homeTeam, match.awayTeam) === "home");
  const awayEvents = events.filter((event) => eventSide(event, match.homeTeam, match.awayTeam) === "away");
  const homeScore = score?.homeScore;
  const awayScore = score?.awayScore;

  return (
    <section className="match-center-shell">
      <div className="match-center-card">
        <div className="match-center-topline">
          <span>World Cup 2026 · {formatKickoff(match.kickoffAt)}</span>
          <strong>{statusLabel(score)}</strong>
        </div>

        <div className="match-center-scoreboard">
          <TeamColumn seed="chủ nhà" team={home} />

          <div className="match-center-score data" aria-label={`Tỉ số ${homeScore ?? "-"} - ${awayScore ?? "-"}`}>
            <strong>{homeScore ?? ""}</strong>
            <span>-</span>
            <strong>{awayScore ?? ""}</strong>
          </div>

          <TeamColumn seed="đội khách" team={away} />
        </div>

        <div className="match-center-stage">{match.group ?? match.round}</div>

        <div className="match-center-scorers">
          <div>
            {homeEvents.map((event, index) => (
              <span key={`home-${event.elapsed}-${index}`}>
                {event.playerName ?? event.teamName} {event.elapsed}&apos;
              </span>
            ))}
          </div>
          <SoccerBall size={15} weight="fill" aria-hidden="true" />
          <div>
            {awayEvents.map((event, index) => (
              <span key={`away-${event.elapsed}-${index}`}>
                {event.playerName ?? event.teamName} {event.elapsed}&apos;
              </span>
            ))}
          </div>
        </div>

        <div className="match-center-tabs" role="tablist" aria-label="Thông tin trận đấu">
          <button
            aria-selected={activeTab === "events"}
            onClick={() => setActiveTab("events")}
            role="tab"
            type="button"
          >
            Diễn biến chính
          </button>
          <button
            aria-selected={activeTab === "lineups"}
            onClick={() => setActiveTab("lineups")}
            role="tab"
            type="button"
          >
            Đội hình ra sân
          </button>
          <button
            aria-selected={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
            role="tab"
            type="button"
          >
            Thống kê
          </button>
        </div>
      </div>

      <div className="match-center-panel">
        {activeTab === "events" && (
          <div className="match-event-list">
            {events.length ? (
              events.map((event, index) => (
                <div className="match-event-row" key={`${event.elapsed}-${event.type}-${index}`}>
                  <span className="data">{event.elapsed ?? "-"}&apos;</span>
                  <SoccerBall size={16} weight={event.type === "Goal" ? "fill" : "regular"} />
                  <div>
                    <strong>{eventLabel(event)}</strong>
                    <p>{event.teamName}{event.playerName ? ` · ${event.playerName}` : ""}</p>
                  </div>
                </div>
              ))
            ) : (
              <MissingData title="Chưa có diễn biến chi tiết">
                {error ?? "Nguồn worldcup26.ir hiện chưa cung cấp timeline cho trận này."}
              </MissingData>
            )}
          </div>
        )}

        {activeTab === "lineups" && (
          <MissingData title="Cần thêm nguồn đội hình">
            Để hiển thị giống Google, cần API có đội hình xuất phát, dự bị, sơ đồ chiến thuật và huấn luyện viên cho từng fixture.
          </MissingData>
        )}

        {activeTab === "stats" && (
          <MissingData title="Cần thêm nguồn thống kê trận">
            Để lấy đủ như Google, cần API có kiểm soát bóng, cú sút, sút trúng đích, phạt góc, thẻ, lỗi, việt vị và các chỉ số theo đội.
          </MissingData>
        )}
      </div>

      <div className="match-center-footer">
        <span className="data">#{String(match.number).padStart(3, "0")}</span>
        <strong>{match.ground}</strong>
        <span>{match.round}</span>
        <FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} />
      </div>
    </section>
  );
}
