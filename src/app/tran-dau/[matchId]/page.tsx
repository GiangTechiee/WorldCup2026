import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { TeamFlag } from "@/components/team-flag";
import { formatKickoff, getMatch, getTeam, matches } from "@/lib/worldcup";
import { MatchInteractiveCenter } from "@/components/match-interactive-center";

export const generateStaticParams = () => matches.map((match) => ({ matchId: match.id }));

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getMatch(matchId);
  if (!match) notFound();
  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);

  return (
    <div className="page-shell section-space">
      <section className="match-detail">
        <div className="match-detail-top"><span className="eyebrow">{match.group ?? match.round}</span><FavoriteButton id={match.id} label={`${match.homeTeam} gặp ${match.awayTeam}`} /></div>
        <div className="match-detail-teams">
          <div><TeamFlag countryCode={home?.countryCode ?? ""} label={match.homeTeam} />{home ? <Link href={`/doi-tuyen/${home.id}`}>{home.name}</Link> : <strong>{match.homeTeam}</strong>}</div>
          <div className="match-detail-time"><span className="data">{formatKickoff(match.kickoffAt)}</span><small>Giờ Việt Nam</small><b>VS</b></div>
          <div><TeamFlag countryCode={away?.countryCode ?? ""} label={match.awayTeam} />{away ? <Link href={`/doi-tuyen/${away.id}`}>{away.name}</Link> : <strong>{match.awayTeam}</strong>}</div>
        </div>
        <div className="match-detail-ground"><span className="data">#{String(match.number).padStart(3, "0")}</span><strong>{match.ground}</strong><span>{match.round}</span></div>
      </section>
      
      <MatchInteractiveCenter match={match} />
    </div>
  );
}
