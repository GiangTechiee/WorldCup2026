import { notFound } from "next/navigation";
import { LiveScoresProvider } from "@/components/live-scores-provider";
import { MatchCard } from "@/components/match-card";
import { TeamFlag } from "@/components/team-flag";
import { getMatchesByTeam, getTeam, teams } from "@/lib/worldcup";

export const generateStaticParams = () => teams.map((team) => ({ teamId: team.id }));

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const team = getTeam(teamId);
  if (!team) notFound();
  const fixtures = getMatchesByTeam(team.id);

  return (
    <div className="page-shell section-space">
      <header className="team-hero"><TeamFlag className="team-hero-flag" countryCode={team.countryCode} label={team.name} /><div><span className="eyebrow">Bảng {team.group} · {team.confed}</span><h1 className="display">{team.name}</h1><p>{fixtures.length} trận đã được xếp lịch cho hành trình này.</p></div></header>
      <div className="section-heading"><h2 className="display">Lịch của đội</h2></div>
      <LiveScoresProvider>
        <div className="match-list">{fixtures.map((match) => <MatchCard match={match} key={match.id} />)}</div>
      </LiveScoresProvider>
    </div>
  );
}
