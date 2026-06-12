"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { SoccerBall } from "@phosphor-icons/react";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import type {
  LiveMatchEvent,
  LiveMatchScore,
  LiveScoresResponse,
  MatchDetailsResponse,
  MatchLineup,
  MatchStatistic,
} from "@/lib/live-score";
import { isScoreVisible } from "@/lib/live-score";
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
  if (event.detail.toLowerCase().includes("yellow")) return "Thẻ vàng";
  if (event.detail.toLowerCase().includes("red")) return "Thẻ đỏ";
  if (event.type.toLowerCase() === "subst") return "Thay người";
  return event.detail || event.type;
};

const isGoal = (event: LiveMatchEvent) => event.type.toLowerCase() === "goal";

const statisticLabels: Record<string, string> = {
  "Shots on Goal": "Sút trúng đích",
  "Shots off Goal": "Sút không trúng đích",
  "Total Shots": "Tổng số cú sút",
  "Blocked Shots": "Sút bị cản",
  "Shots insidebox": "Sút trong vòng cấm",
  "Shots outsidebox": "Sút ngoài vòng cấm",
  Fouls: "Phạm lỗi",
  "Corner Kicks": "Phạt góc",
  Offsides: "Việt vị",
  "Ball Possession": "Kiểm soát bóng",
  "Yellow Cards": "Thẻ vàng",
  "Red Cards": "Thẻ đỏ",
  "Goalkeeper Saves": "Cứu thua",
  "Total passes": "Lượt chuyền bóng",
  "Passes accurate": "Chuyền chính xác",
  "Passes %": "Tỷ lệ chuyền chính xác",
  expected_goals: "Bàn thắng kỳ vọng (xG)",
};

const statisticOrder = [
  "Total Shots",
  "Shots on Goal",
  "Ball Possession",
  "Total passes",
  "Passes %",
  "Fouls",
  "Yellow Cards",
  "Red Cards",
  "Offsides",
  "Corner Kicks",
  "Goalkeeper Saves",
  "expected_goals",
];

const sortStatistics = (statistics: MatchStatistic[]) =>
  [...statistics].sort((left, right) => {
    const leftIndex = statisticOrder.indexOf(left.type);
    const rightIndex = statisticOrder.indexOf(right.type);
    if (leftIndex === -1 && rightIndex === -1) return left.type.localeCompare(right.type);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

const eventSide = (event: LiveMatchEvent, homeName: string, awayName: string) => {
  if (event.teamName === homeName) return "home";
  if (event.teamName === awayName) return "away";
  return "neutral";
};

function TeamColumn({ team }: { team: TeamSummary }) {
  const content = (
    <>
      <TeamFlag className="match-center-flag" countryCode={team.countryCode} label={team.name} />
      <strong>{team.name}</strong>
    </>
  );

  return (
    <div className="match-center-team">
      {team.id ? <Link href={`/doi-tuyen/${team.id}`}>{content}</Link> : content}
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

function EventGlyph({ event }: { event: LiveMatchEvent }) {
  const detail = event.detail.toLowerCase();
  if (isGoal(event)) return <SoccerBall size={16} weight="fill" aria-hidden="true" />;
  if (detail.includes("yellow")) return <span className="match-card-glyph match-card-yellow" aria-label="Thẻ vàng" />;
  if (detail.includes("red")) return <span className="match-card-glyph match-card-red" aria-label="Thẻ đỏ" />;
  return <span className="match-event-glyph" aria-hidden="true" />;
}

const pitchY = (position: string | null) => {
  const value = position ?? "";
  if (value === "G") return 9;
  if (value.startsWith("CD") || value === "LB" || value === "RB") return 28;
  if (value === "DM") return 43;
  if (value.startsWith("CM")) return 58;
  if (value === "LM" || value === "RM" || value.includes("W")) return 72;
  if (value === "F" || value.startsWith("CF") || value.includes("ST")) return 86;
  return 58;
};

const pitchX = (position: string | null, reversed: boolean) => {
  const value = position ?? "";
  const left = reversed ? 18 : 82;
  const leftCenter = reversed ? 36 : 64;
  const rightCenter = reversed ? 64 : 36;
  const right = reversed ? 82 : 18;

  if (value === "G" || value === "F" || value === "CF" || value === "CM" || value === "DM" || value === "CD") return 50;
  if (value.endsWith("-L")) return leftCenter;
  if (value.endsWith("-R")) return rightCenter;
  if (value === "LB" || value === "LM" || value === "LW") return left;
  if (value === "RB" || value === "RM" || value === "RW") return right;
  return 50;
};

const pitchCoordinates = (player: MatchLineup["starters"][number], reversed: boolean) => {
  const baseY = pitchY(player.position);
  return {
    x: pitchX(player.position, reversed),
    y: reversed ? 100 - baseY : baseY,
  };
};

function PitchPlayer({
  player,
  reversed = false,
}: {
  player: MatchLineup["starters"][number];
  reversed?: boolean;
}) {
  const coordinates = pitchCoordinates(player, reversed);
  const shortName = player.name.split(" ").at(-1) ?? player.name;
  return (
    <div
      className="match-pitch-player"
      style={{
        left: `${coordinates.x}%`,
        top: `${coordinates.y}%`,
      }}
    >
      <span className="data">
        {player.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={player.imageUrl} />
        ) : (
          player.number ?? "-"
        )}
      </span>
      <strong title={player.name}>{shortName}</strong>
    </div>
  );
}

function PitchTeam({ lineup, reversed = false }: { lineup: MatchLineup; reversed?: boolean }) {
  return (
    <section className={`match-pitch-team${reversed ? " match-pitch-team-reversed" : ""}`}>
      <header>
        <strong>{lineup.teamName}</strong>
        {lineup.formation && <span className="data">{lineup.formation}</span>}
      </header>
      <div className="match-pitch-formation">
        {lineup.starters.map((player, playerIndex) => (
          <PitchPlayer
            key={`${player.id ?? player.name}-${playerIndex}`}
            player={player}
            reversed={reversed}
          />
        ))}
      </div>
    </section>
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
  const [details, setDetails] = useState<MatchDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadDetails = async () => {
      try {
        const response = await fetch(`/api/match-details?matchId=${match.id}`, { cache: "no-store" });
        const payload = (await response.json()) as MatchDetailsResponse;
        if (!isMounted) return;
        setDetails(payload);
        setDetailsError(payload.error ?? null);
      } catch (fetchError) {
        if (!isMounted) return;
        setDetailsError(fetchError instanceof Error ? fetchError.message : "Không tải được chi tiết trận đấu");
      } finally {
        if (isMounted) timeoutId = setTimeout(loadDetails, 60_000);
      }
    };

    void loadDetails();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [match.id]);

  const events = details?.events.length ? details.events : score?.events ?? [];
  const goalEvents = events.filter(isGoal);
  const homeEvents = goalEvents.filter((event) => eventSide(event, match.homeTeam, match.awayTeam) === "home");
  const awayEvents = goalEvents.filter((event) => eventSide(event, match.homeTeam, match.awayTeam) === "away");
  const homeScore = score?.homeScore;
  const awayScore = score?.awayScore;
  const showScore = score ? isScoreVisible(score) : false;

  return (
    <section className="match-center-shell">
      <div className="match-center-card">
        <div className="match-center-topline">
          <span>World Cup 2026 · {formatKickoff(match.kickoffAt)}</span>
          <strong>{statusLabel(score)}</strong>
        </div>

        <div className="match-center-scoreboard">
          <TeamColumn team={home} />

          <div
            className="match-center-score data"
            aria-label={showScore ? `Tỉ số ${homeScore} - ${awayScore}` : "Chưa có tỷ số"}
          >
            {showScore && (
              <>
                <strong>{homeScore}</strong>
                <span>-</span>
                <strong>{awayScore}</strong>
              </>
            )}
          </div>

          <TeamColumn team={away} />
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
                  <EventGlyph event={event} />
                  <div>
                    <strong>{eventLabel(event)}</strong>
                    <p>{event.teamName}{event.playerName ? ` · ${event.playerName}` : ""}</p>
                  </div>
                </div>
              ))
            ) : (
              <MissingData title="Chưa có diễn biến chi tiết">
                {detailsError ?? error ?? "Nguồn dữ liệu chưa cung cấp timeline cho trận này."}
              </MissingData>
            )}
          </div>
        )}

        {activeTab === "lineups" && (
          details?.lineups.length ? (
            <div className="match-lineup-pitch">
              {details.lineups[0] && <PitchTeam lineup={details.lineups[0]} />}
              <div className="match-pitch-center" aria-hidden="true"><span /></div>
              {details.lineups[1] && <PitchTeam lineup={details.lineups[1]} reversed />}
            </div>
          ) : (
            <MissingData title="Chưa có đội hình ra sân">
              {detailsError ?? "Đội hình thường được cập nhật gần giờ bóng lăn."}
            </MissingData>
          )
        )}

        {activeTab === "stats" && (
          details?.statistics.length ? (
            <div className="match-statistics">
              <div className="match-statistics-head">
                <strong>{home.name}</strong>
                <span>Thống kê đội</span>
                <strong>{away.name}</strong>
              </div>
              {sortStatistics(details.statistics).map((statistic) => (
                <div className="match-statistic-row" key={statistic.type}>
                  <strong className="data">{statistic.home ?? "-"}</strong>
                  <span>{statisticLabels[statistic.type] ?? statistic.type}</span>
                  <strong className="data">{statistic.away ?? "-"}</strong>
                </div>
              ))}
            </div>
          ) : (
            <MissingData title="Chưa có thống kê trận đấu">
              {detailsError ?? "Thống kê sẽ xuất hiện khi nhà cung cấp bắt đầu ghi nhận trận đấu."}
            </MissingData>
          )
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
