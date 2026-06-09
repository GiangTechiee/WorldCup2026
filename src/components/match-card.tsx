import Link from "next/link";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import { formatKickoff, getTeam, type Match } from "@/lib/worldcup";

export function MatchCard({ match, featured = false }: { match: Match; featured?: boolean }) {
  const homeTeam = getTeam(match.homeTeam);
  const awayTeam = getTeam(match.awayTeam);

  return (
    <article className={featured ? "match-card match-card-featured" : "match-card"}>
      <div className="match-meta">
        <span className="data">#{String(match.number).padStart(3, "0")}</span>
        <span>{match.group ?? match.round}</span>
      </div>
      <Link className="match-main" href={`/tran-dau/${match.id}`}>
        <div className="team-line">
          <TeamFlag countryCode={homeTeam?.countryCode ?? ""} label={match.homeTeam} />
          <strong>{match.homeTeam}</strong>
        </div>
        <div className="match-time">
          <strong className="data">{formatKickoff(match.kickoffAt)}</strong>
          <span>Giờ Việt Nam</span>
        </div>
        <div className="team-line team-line-away">
          <strong>{match.awayTeam}</strong>
          <TeamFlag countryCode={awayTeam?.countryCode ?? ""} label={match.awayTeam} />
        </div>
      </Link>
      <div className="match-footer">
        <span><MapPinIcon weight="bold" aria-hidden="true" /> {match.ground}</span>
        <FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} />
      </div>
    </article>
  );
}
