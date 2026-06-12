import Link from "next/link";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { FavoriteButton } from "@/components/favorite-button";
import { LiveScoreDisplay } from "@/components/live-score-display";
import { TeamFlag } from "@/components/team-flag";
import { isPlaceholderSlot, slotLabel } from "@/lib/match-slots";
import type { DisplayTeam } from "@/lib/resolved-teams";
import { formatKickoff, getTeam, type Match } from "@/lib/worldcup";

function TeamLine({
  align = "left",
  display,
  name,
}: {
  align?: "left" | "right";
  display?: DisplayTeam;
  name: string;
}) {
  const team = getTeam(name);
  const isSlot = display?.isPlaceholder ?? (!team && isPlaceholderSlot(name));
  const label = display?.name ?? (isSlot ? slotLabel(name) : name);
  const countryCode = display?.countryCode ?? team?.countryCode ?? null;
  const flagOrSlot = countryCode ? (
    <TeamFlag countryCode={countryCode} label={label} />
  ) : (
    <span className="flag-placeholder match-slot-placeholder" aria-label="Chưa xác định đội" />
  );

  return (
    <div className={`team-line${align === "right" ? " team-line-away" : ""}${isSlot ? " team-line-slot" : ""}`}>
      {align === "left" && flagOrSlot}
      <strong>{label}</strong>
      {align === "right" && flagOrSlot}
    </div>
  );
}

export function MatchCard({
  awayDisplay,
  featured = false,
  homeDisplay,
  match,
}: {
  awayDisplay?: DisplayTeam;
  featured?: boolean;
  homeDisplay?: DisplayTeam;
  match: Match;
}) {
  return (
    <article className={featured ? "match-card match-card-featured" : "match-card"}>
      <div className="match-meta">
        <span className="data">#{String(match.number).padStart(3, "0")}</span>
        <time dateTime={match.kickoffAt}>{formatKickoff(match.kickoffAt)}</time>
        <span>{match.group ?? match.round}</span>
      </div>
      <Link className="match-main" href={`/tran-dau/${match.id}`}>
        <TeamLine display={homeDisplay} name={match.homeTeam} />
        <LiveScoreDisplay kickoffAt={match.kickoffAt} matchId={match.id} />
        <TeamLine align="right" display={awayDisplay} name={match.awayTeam} />
      </Link>
      <div className="match-footer">
        <span>
          <MapPinIcon weight="bold" aria-hidden="true" /> {match.ground}
        </span>
        <FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} />
      </div>
    </article>
  );
}
