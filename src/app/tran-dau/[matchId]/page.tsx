import { notFound } from "next/navigation";
import { MatchCenter } from "@/components/match-center";
import { getMatch, getTeam, matches } from "@/lib/worldcup";

export const generateStaticParams = () => matches.map((match) => ({ matchId: match.id }));

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getMatch(matchId);
  if (!match) notFound();

  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);

  return (
    <div className="match-center-page">
      <MatchCenter
        away={{
          countryCode: away?.countryCode ?? "",
          id: away?.id ?? null,
          name: match.awayTeam,
        }}
        home={{
          countryCode: home?.countryCode ?? "",
          id: home?.id ?? null,
          name: match.homeTeam,
        }}
        match={match}
      />
    </div>
  );
}
