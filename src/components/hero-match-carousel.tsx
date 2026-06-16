"use client";

import Link from "next/link";
import { ArrowRightIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { LiveScoreDisplay } from "@/components/live-score-display";
import { TeamFlag } from "@/components/team-flag";
import { formatKickoff, getTeam, type Match } from "@/lib/worldcup";

function TeamSide({ align = "left", name }: { align?: "left" | "right"; name: string }) {
  const team = getTeam(name);
  const flag = team?.countryCode ? (
    <TeamFlag countryCode={team.countryCode} label={name} />
  ) : (
    <span className="flag-placeholder" aria-label={`Chưa xác định cờ của ${name}`}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

  return (
    <div className={`hero-carousel-team${align === "right" ? " hero-carousel-team-away" : ""}`}>
      {align === "left" && flag}
      <strong>{name}</strong>
      {align === "right" && flag}
    </div>
  );
}

export function HeroMatchCarousel({
  date,
  matches,
}: {
  date: string;
  matches: Match[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = matches.length ? activeIndex % matches.length : 0;
  const activeMatch = matches[safeIndex];
  const label = useMemo(() => {
    const [year, month, day] = date.split("-");
    return day && month && year ? `${day}/${month}` : date;
  }, [date]);

  useEffect(() => {
    if (matches.length <= 1) return;
    const intervalId = setInterval(() => {
      setActiveIndex((index) => (index + 1) % matches.length);
    }, 3_000);

    return () => clearInterval(intervalId);
  }, [matches.length]);

  if (!activeMatch) return null;

  const previous = () => setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
  const next = () => setActiveIndex((index) => (index + 1) % matches.length);

  return (
    <div className="hero-carousel" aria-label={`Trận đấu ngày ${label}`}>
      <div className="hero-carousel-eyebrow">
        <span>Ngày mai</span>
        <strong>{label}</strong>
      </div>
      <article className="match-card match-card-featured hero-carousel-card">
        <div className="match-meta">
          <span className="data">#{String(activeMatch.number).padStart(3, "0")}</span>
          <time dateTime={activeMatch.kickoffAt}>{formatKickoff(activeMatch.kickoffAt)}</time>
          <span>{activeMatch.group ?? activeMatch.round}</span>
        </div>
        <Link className="match-main" href={`/tran-dau/${activeMatch.id}`}>
          <TeamSide name={activeMatch.homeTeam} />
          <LiveScoreDisplay kickoffAt={activeMatch.kickoffAt} matchId={activeMatch.id} />
          <TeamSide align="right" name={activeMatch.awayTeam} />
        </Link>
        <div className="match-footer">
          <span>{activeMatch.ground}</span>
          <FavoriteButton id={activeMatch.id} label={`${activeMatch.homeTeam} gặp ${activeMatch.awayTeam}`} />
        </div>
      </article>
      <div className="hero-carousel-actions">
        <button type="button" onClick={previous} aria-label="Trận trước">
          <CaretLeftIcon weight="bold" aria-hidden="true" />
        </button>
        <div className="hero-carousel-dots" aria-hidden="true">
          {matches.map((match, index) => (
            <span className={index === safeIndex ? "active" : ""} key={match.id} />
          ))}
        </div>
        <button type="button" onClick={next} aria-label="Trận tiếp theo">
          <CaretRightIcon weight="bold" aria-hidden="true" />
        </button>
        <Link className="hero-carousel-link" href={`/lich-dau?date=${date}`}>
          Xem ngày này <ArrowRightIcon weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
