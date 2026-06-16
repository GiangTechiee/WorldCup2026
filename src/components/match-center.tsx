"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowCircleUp, FirstAidKit, Prohibit, SoccerBall } from "@phosphor-icons/react";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import type {
  LiveMatchEvent,
  LiveMatchScore,
  LiveMatchStatus,
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

type MatchCenterTab = "events" | "lineups" | "stats";

const LIVE_WINDOW_MS = 2.75 * 60 * 60 * 1000;

const useClock = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  return now;
};

const tabFromLocation = (): MatchCenterTab => {
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "lineups" || tab === "stats" ? tab : "events";
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

const displayStatusLabel = (
  score: LiveMatchScore | null,
  displayStatus: LiveMatchStatus | "scheduled",
  elapsedByClock: number | null,
) => {
  if (displayStatus === "live") {
    const elapsed = score?.elapsed ?? elapsedByClock;
    return elapsed !== null ? `Đang đá · ${elapsed}'` : "Đang đá";
  }
  if (displayStatus === "finished") return "Kết thúc";
  if (displayStatus === "halftime") return "Nghỉ giữa hiệp";
  if (displayStatus === "postponed") return "Hoãn";
  if (displayStatus === "cancelled") return "Hủy";
  return statusLabel(score);
};

const eventLabel = (event: LiveMatchEvent) => {
  if (event.type.toLowerCase() === "goal") return "Bàn thắng";
  if (event.detail.toLowerCase().includes("yellow")) return "Thẻ vàng";
  if (event.detail.toLowerCase().includes("red")) return "Thẻ đỏ";
  if (event.type.toLowerCase() === "subst") return "Thay người";
  return event.detail || event.type;
};

const isGoal = (event: LiveMatchEvent) => event.type.toLowerCase() === "goal";

const formatMinute = (event: LiveMatchEvent) => {
  if (event.elapsed === null) return "-";
  return event.extra ? `${event.elapsed}+${event.extra}` : `${event.elapsed}`;
};

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
  const teamNameAliases: Record<string, string> = {
    "bosnia herzegovina": "bosnia and herzegovina",
    "czech republic": "czechia",
    "korea republic": "south korea",
    "republic of korea": "south korea",
    "united states": "usa",
    "united states of america": "usa",
    turkiye: "turkey",
  };
  const normalize = (value: string | null | undefined) => {
    const normalized = (value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/-/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    return teamNameAliases[normalized] ?? normalized;
  };

  const eventTeam = normalize(event.teamName);
  const homeTeam = normalize(homeName);
  const awayTeam = normalize(awayName);

  if (!eventTeam) return "neutral";
  if (eventTeam === homeTeam || eventTeam.includes(homeTeam) || homeTeam.includes(eventTeam)) return "home";
  if (eventTeam === awayTeam || eventTeam.includes(awayTeam) || awayTeam.includes(eventTeam)) return "away";
  return "away";
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
  if (value === "CM-L") return rightCenter;
  if (value === "CM-R") return leftCenter;
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

const abbreviatedPlayerName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  const lastName = parts.at(-1) ?? name;
  const initials = parts
    .slice(0, -1)
    .map((part) => part[0])
    .filter(Boolean)
    .join(".");

  return initials ? `${initials}. ${lastName}` : lastName;
};

const lineupPlayerLabel = (player: MatchLineup["starters"][number]) =>
  `${player.number ? `${player.number} ` : ""}${abbreviatedPlayerName(player.name)}`;

const playerInitials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : name.slice(0, 2)).toUpperCase();
};

const generatedPlayerAvatar = (player: MatchLineup["starters"][number]) => {
  const label = playerInitials(player.name);
  const hue = Math.abs(player.name.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="hsl(${hue} 62% 58%)"/>
          <stop offset="1" stop-color="hsl(${(hue + 42) % 360} 58% 34%)"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="18" fill="url(#g)"/>
      <circle cx="48" cy="34" r="16" fill="rgba(255,255,255,.78)"/>
      <path d="M18 88c4-22 18-34 30-34s26 12 30 34" fill="rgba(255,255,255,.78)"/>
      <text x="48" y="53" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#16341f">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const kitPalettes: Record<string, { accent: string; primary: string; secondary: string }> = {
  argentina: { accent: "#f4c542", primary: "#75aadb", secondary: "#ffffff" },
  brazil: { accent: "#1d8b45", primary: "#f7d117", secondary: "#1d8b45" },
  canada: { accent: "#ffffff", primary: "#d71920", secondary: "#ffffff" },
  czechia: { accent: "#d7141a", primary: "#174ea6", secondary: "#ffffff" },
  "czech republic": { accent: "#d7141a", primary: "#174ea6", secondary: "#ffffff" },
  france: { accent: "#ef4135", primary: "#1f3c88", secondary: "#ffffff" },
  germany: { accent: "#f6c800", primary: "#ffffff", secondary: "#111111" },
  japan: { accent: "#e60012", primary: "#1b4f9c", secondary: "#ffffff" },
  mexico: { accent: "#ce1126", primary: "#006847", secondary: "#ffffff" },
  morocco: { accent: "#006233", primary: "#c1272d", secondary: "#006233" },
  paraguay: { accent: "#0038a8", primary: "#d52b1e", secondary: "#ffffff" },
  qatar: { accent: "#ffffff", primary: "#8a1538", secondary: "#ffffff" },
  "korea republic": { accent: "#0047a0", primary: "#c60c30", secondary: "#ffffff" },
  "republic of korea": { accent: "#0047a0", primary: "#c60c30", secondary: "#ffffff" },
  "south africa": { accent: "#ffb612", primary: "#007a4d", secondary: "#ffb612" },
  "south korea": { accent: "#0047a0", primary: "#c60c30", secondary: "#ffffff" },
  switzerland: { accent: "#ffffff", primary: "#d52b1e", secondary: "#ffffff" },
  usa: { accent: "#b31942", primary: "#ffffff", secondary: "#0a3161" },
};

const normalizeTeamName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const teamKitPalette = (teamName: string) => {
  const normalized = normalizeTeamName(teamName);
  const direct = kitPalettes[normalized];
  if (direct) return direct;

  const hue = Math.abs(normalized.split("").reduce((total, char) => total + char.charCodeAt(0), 0)) % 360;
  return {
    accent: `hsl(${(hue + 160) % 360} 76% 48%)`,
    primary: `hsl(${hue} 72% 42%)`,
    secondary: "#ffffff",
  };
};

const teamKitAvatar = (player: MatchLineup["starters"][number], teamName: string) => {
  const { accent, primary, secondary } = teamKitPalette(teamName);
  const number = player.number ?? "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="18" fill="#b9c9bf"/>
      <path d="M31 18 18 27 10 48l14 6 5-12v38h38V42l5 12 14-6-8-21-13-9-10 8H41z" fill="${primary}" stroke="rgba(0,0,0,.18)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M41 18c2 6 12 6 14 0l5 7c-6 8-18 8-24 0z" fill="${secondary}" opacity=".92"/>
      <path d="M28 23 20 30l-6 16 9 4 6-17zM68 23l8 7 6 16-9 4-6-17z" fill="${accent}" opacity=".95"/>
      <text x="48" y="57" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="${secondary}" stroke="rgba(0,0,0,.45)" stroke-width="1">${number}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const playerImageSrc = (player: MatchLineup["starters"][number], teamName: string) =>
  player.imageUrl ?? teamKitAvatar(player, teamName) ?? generatedPlayerAvatar(player);

const eventDescription = (event: LiveMatchEvent) => {
  if (event.type.toLowerCase() === "subst" && event.assistName) {
    return `${event.playerName ?? ""} vào sân · ${event.assistName} ra sân`;
  }

  return event.playerName ?? event.teamName ?? "";
};

const normalizePersonName = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const playerEvents = (playerName: string, events: LiveMatchEvent[]) => {
  const normalizedName = normalizePersonName(playerName);
  return events.filter((event) => {
    const player = normalizePersonName(event.playerName);
    const assist = normalizePersonName(event.assistName);
    return player === normalizedName || assist === normalizedName;
  });
};

const substituteInMinute = (playerName: string, events: LiveMatchEvent[]) => {
  const normalizedName = normalizePersonName(playerName);
  const event = events.find(
    (item) => item.type.toLowerCase() === "subst" && normalizePersonName(item.playerName) === normalizedName,
  );
  return event?.elapsed ?? null;
};

const firstPlayerEventMinute = (playerName: string, events: LiveMatchEvent[]) =>
  playerEvents(playerName, events).reduce<number | null>((earliest, event) => {
    if (event.elapsed === null) return earliest;
    return earliest === null ? event.elapsed : Math.min(earliest, event.elapsed);
  }, null);

const sortSubstitutes = (players: MatchLineup["substitutes"], events: LiveMatchEvent[]) =>
  [...players].sort((left, right) => {
    const leftSubMinute = substituteInMinute(left.name, events);
    const rightSubMinute = substituteInMinute(right.name, events);
    if (leftSubMinute !== null || rightSubMinute !== null) {
      if (leftSubMinute === null) return 1;
      if (rightSubMinute === null) return -1;
      return leftSubMinute - rightSubMinute;
    }

    const leftEventMinute = firstPlayerEventMinute(left.name, events);
    const rightEventMinute = firstPlayerEventMinute(right.name, events);
    if (leftEventMinute !== null || rightEventMinute !== null) {
      if (leftEventMinute === null) return 1;
      if (rightEventMinute === null) return -1;
      return leftEventMinute - rightEventMinute;
    }

    return 0;
  });

function PlayerEventBadges({
  align = "left",
  events,
  playerName,
}: {
  align?: "left" | "right";
  events: LiveMatchEvent[];
  playerName: string;
}) {
  const relatedEvents = playerEvents(playerName, events);
  if (!relatedEvents.length) return null;

  return (
    <span className="match-lineup-player-events">
      {relatedEvents.map((event, index) => {
        const detail = event.detail.toLowerCase();
        const minute = event.elapsed !== null ? `${formatMinute(event)}'` : "";
        if (event.type.toLowerCase() === "subst") {
          const isIn = normalizePersonName(event.playerName) === normalizePersonName(playerName);
          return (
            <span className={isIn ? "match-lineup-sub-in" : "match-lineup-sub-out"} key={`${event.type}-${event.elapsed}-${index}`}>
              {align === "right" && minute}
              <ArrowCircleUp size={13} weight="fill" aria-hidden="true" />
              {align === "left" && minute}
            </span>
          );
        }
        if (isGoal(event)) {
          return (
            <span key={`${event.type}-${event.elapsed}-${index}`}>
              {align === "right" && minute}
              <SoccerBall size={12} weight="fill" aria-hidden="true" />
              {align === "left" && minute}
            </span>
          );
        }
        if (detail.includes("yellow")) {
          return (
            <span key={`${event.type}-${event.elapsed}-${index}`}>
              {align === "right" && minute}
              <span className="match-card-glyph match-card-yellow" title={minute} />
              {align === "left" && minute}
            </span>
          );
        }
        if (detail.includes("red")) {
          return (
            <span key={`${event.type}-${event.elapsed}-${index}`}>
              {align === "right" && minute}
              <span className="match-card-glyph match-card-red" title={minute} />
              {align === "left" && minute}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

function PitchPlayer({
  player,
  reversed = false,
  teamName,
}: {
  player: MatchLineup["starters"][number];
  reversed?: boolean;
  teamName: string;
}) {
  const coordinates = pitchCoordinates(player, reversed);
  const displayName = lineupPlayerLabel(player);
  const avatarSrc = playerImageSrc(player, teamName);
  const popupSide = coordinates.y < 16 ? "below" : coordinates.x > 62 ? "left" : "right";
  return (
    <div
      className={`match-pitch-player match-pitch-player-has-image match-pitch-popup-${popupSide}`}
      style={{
        left: `${coordinates.x}%`,
        top: `${coordinates.y}%`,
      }}
      tabIndex={0}
    >
      <span className="data">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={avatarSrc} />
      </span>
      <strong title={player.name}>{displayName}</strong>
      <span className="match-pitch-player-popup" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={avatarSrc} />
        <b>{displayName}</b>
      </span>
    </div>
  );
}

function BenchPlayer({
  align = "left",
  events,
  player,
  teamName,
}: {
  align?: "left" | "right";
  events: LiveMatchEvent[];
  player: MatchLineup["substitutes"][number] | null;
  teamName: string;
}) {
  if (!player) return <div className="match-bench-player match-bench-player-empty" />;

  const label = lineupPlayerLabel(player);
  const avatarSrc = playerImageSrc(player, teamName);
  return (
    <div
      className={`match-bench-player match-bench-player-${align} match-bench-player-has-image`}
      tabIndex={0}
    >
      {align === "left" && (
        <span className="match-bench-avatar data">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={avatarSrc} />
        </span>
      )}
      <div>
        <strong title={player.name}>{label}</strong>
        <p>{player.position && player.position !== "SUB" ? player.position : ""}</p>
        <PlayerEventBadges align={align} events={events} playerName={player.name} />
      </div>
      {align === "right" && (
        <span className="match-bench-avatar data">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={avatarSrc} />
        </span>
      )}
      <span className="match-bench-player-popup" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={avatarSrc} />
        <b>{label}</b>
      </span>
    </div>
  );
}

function LineupLegend() {
  return (
    <div className="match-lineup-legend">
      <span>
        <SoccerBall size={14} weight="fill" aria-hidden="true" />
        Bàn thắng
      </span>
      <span>
        <span className="match-card-glyph match-card-yellow" />
        Thẻ vàng
      </span>
      <span>
        <span className="match-card-glyph match-card-red" />
        Thẻ đỏ
      </span>
      <span>
        <ArrowCircleUp className="match-lineup-sub-in" size={15} weight="fill" aria-hidden="true" />
        Thay người vào sân
      </span>
      <span>
        <ArrowCircleUp className="match-lineup-sub-out" size={15} weight="fill" aria-hidden="true" />
        Thay người ra sân
      </span>
      <span>
        <FirstAidKit size={14} weight="fill" aria-hidden="true" />
        Chấn thương
      </span>
      <span>
        <Prohibit size={14} aria-hidden="true" />
        Treo giò
      </span>
      <span>
        <SoccerBall className="match-lineup-assist" size={14} aria-hidden="true" />
        Kiến tạo
      </span>
    </div>
  );
}

function EventTimelineRow({
  event,
  side,
}: {
  event: LiveMatchEvent;
  side: "away" | "home" | "neutral";
}) {
  const content = (
    <div className="match-event-card">
      <strong>{eventLabel(event)}</strong>
      <p>{eventDescription(event)}</p>
    </div>
  );

  return (
    <div className={`match-event-row match-event-row-${side}`}>
      <div className="match-event-cell match-event-cell-home">{side === "home" ? content : null}</div>
      <div className="match-event-center">
        <span className="match-event-minute data">{formatMinute(event)}&apos;</span>
        <EventGlyph event={event} />
      </div>
      <div className="match-event-cell match-event-cell-away">{side === "away" || side === "neutral" ? content : null}</div>
    </div>
  );
}

const timelineNameAliases: Record<string, string> = {
  "bosnia herzegovina": "bosnia and herzegovina",
  "czech republic": "czechia",
  "korea republic": "south korea",
  "republic of korea": "south korea",
  "united states": "usa",
  "united states of america": "usa",
};

const normalizeTimelineName = (value: string | null | undefined) => {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return timelineNameAliases[normalized] ?? normalized;
};

const timelineEventKey = (event: LiveMatchEvent) =>
  [
    event.elapsed ?? "",
    event.extra ?? "",
    event.type.toLowerCase(),
    normalizeTimelineName(event.teamName),
  ].join("|");

const sortTimelineEvents = (events: LiveMatchEvent[]) =>
  [...events].sort((left, right) => {
    if ((left.elapsed ?? 999) !== (right.elapsed ?? 999)) return (left.elapsed ?? 999) - (right.elapsed ?? 999);
    return (left.extra ?? 999) - (right.extra ?? 999);
  });

const mergeTimelineEvents = (detailEvents: LiveMatchEvent[], matchEvents: LiveMatchEvent[]) => {
  const eventsByKey = new Map<string, LiveMatchEvent>();

  [...detailEvents, ...matchEvents].forEach((event) => {
    const key = timelineEventKey(event);
    if (!eventsByKey.has(key)) eventsByKey.set(key, event);
  });

  return sortTimelineEvents([...eventsByKey.values()]);
};

function LineupExtras({
  away,
  events,
  home,
  lineups,
}: {
  away: TeamSummary;
  events: LiveMatchEvent[];
  home: TeamSummary;
  lineups: MatchLineup[];
}) {
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];
  const homeSubstitutes = homeLineup ? sortSubstitutes(homeLineup.substitutes, events) : [];
  const awaySubstitutes = awayLineup ? sortSubstitutes(awayLineup.substitutes, events) : [];
  const substituteRows = Math.max(homeSubstitutes.length, awaySubstitutes.length);
  const hasCoaches = Boolean(homeLineup?.coachName || awayLineup?.coachName);

  return (
    <div className="match-lineup-extras">
      <section className="match-bench-card">
        <header>
          <TeamFlag countryCode={home.countryCode} label={home.name} />
          <strong>Băng ghế dự bị</strong>
          <TeamFlag countryCode={away.countryCode} label={away.name} />
        </header>
        <div className="match-bench-list">
          {Array.from({ length: substituteRows }).map((_, index) => (
            <div className="match-bench-row" key={`bench-${index}`}>
              <BenchPlayer
                events={events}
                player={homeSubstitutes[index] ?? null}
                teamName={homeLineup?.teamName ?? home.name}
              />
              <BenchPlayer
                align="right"
                events={events}
                player={awaySubstitutes[index] ?? null}
                teamName={awayLineup?.teamName ?? away.name}
              />
            </div>
          ))}
        </div>
      </section>

      {hasCoaches && (
        <section className="match-coach-card">
          <div>
            <strong>{homeLineup?.coachName}</strong>
            <p>
              <TeamFlag countryCode={home.countryCode} label={home.name} />
              Người quản lý
            </p>
          </div>
          <div>
            <strong>{awayLineup?.coachName}</strong>
            <p>
              Người quản lý
              <TeamFlag countryCode={away.countryCode} label={away.name} />
            </p>
          </div>
        </section>
      )}

      <p className="match-lineup-note">Điểm xếp hạng cầu thủ (0-10) sẽ hiển thị khi nguồn dữ liệu trận đấu cung cấp.</p>
      <LineupLegend />
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
            teamName={lineup.teamName}
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
  const [activeTab, setActiveTab] = useState<MatchCenterTab>("events");
  const [score, setScore] = useState<LiveMatchScore | null>(null);
  const [details, setDetails] = useState<MatchDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const now = useClock();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setActiveTab(tabFromLocation()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

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
    let initialDelayId: ReturnType<typeof setTimeout> | null = null;
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
        if (isMounted) timeoutId = setTimeout(loadDetails, activeTab === "events" ? 120_000 : 60_000);
      }
    };

    initialDelayId = setTimeout(loadDetails, activeTab === "events" ? 1_200 : 0);

    return () => {
      isMounted = false;
      if (initialDelayId) clearTimeout(initialDelayId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTab, match.id]);

  const matchEvents = score?.events ?? [];
  const detailEvents = details?.events ?? [];
  const timelineEvents = mergeTimelineEvents(detailEvents, matchEvents);
  const matchEventSide = (event: LiveMatchEvent) => eventSide(event, match.homeTeam, match.awayTeam);
  const goalEvents = timelineEvents.filter(isGoal);
  const homeEvents = goalEvents.filter((event) => matchEventSide(event) === "home");
  const awayEvents = goalEvents.filter((event) => matchEventSide(event) === "away");
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
  const showScore = score ? isScoreVisible(score) || (displayStatus === "live" && score.homeScore !== null && score.awayScore !== null) : displayStatus === "live";
  const homeScore = showScore ? score?.homeScore ?? 0 : null;
  const awayScore = showScore ? score?.awayScore ?? 0 : null;

  return (
    <section className="match-center-shell">
      <div className="match-center-card">
        <div className="match-center-topline">
          <span>World Cup 2026 · {formatKickoff(match.kickoffAt)}</span>
          <strong>{displayStatusLabel(score, displayStatus, elapsedByClock)}</strong>
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
                {event.playerName ?? event.teamName} {formatMinute(event)}&apos;
              </span>
            ))}
          </div>
          <SoccerBall size={15} weight="fill" aria-hidden="true" />
          <div>
            {awayEvents.map((event, index) => (
              <span key={`away-${event.elapsed}-${index}`}>
                {event.playerName ?? event.teamName} {formatMinute(event)}&apos;
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
            {timelineEvents.length ? (
              timelineEvents.map((event, index) => (
                <EventTimelineRow
                  event={event}
                  key={`${timelineEventKey(event)}-${index}`}
                  side={matchEventSide(event)}
                />
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
            <div className="match-lineup-stack">
              <div className="match-lineup-pitch">
                {details.lineups[0] && <PitchTeam lineup={details.lineups[0]} />}
                <div className="match-pitch-center" aria-hidden="true"><span /></div>
                {details.lineups[1] && <PitchTeam lineup={details.lineups[1]} reversed />}
              </div>
              <LineupExtras away={away} events={timelineEvents} home={home} lineups={details.lineups} />
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
