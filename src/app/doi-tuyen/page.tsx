import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { TeamFlag } from "@/components/team-flag";
import { getMatchesByTeam, teams } from "@/lib/worldcup";

export const metadata = { title: "Đội tuyển" };

export default function TeamsPage() {
  return (
    <div className="page-shell section-space">
      <PageHeading eyebrow="48 đội · 6 liên đoàn" title="Đội tuyển" description="Tìm lá cờ bạn sẽ bảo vệ bằng cả giọng nói và lịch ngủ." />
      <div className="team-grid">
        {teams.map((team) => {
          const next = getMatchesByTeam(team.id)[0];
          return (
            <Link className="team-card" href={`/doi-tuyen/${team.id}`} key={team.id}>
              <TeamFlag className="team-card-flag" countryCode={team.countryCode} label={team.name} />
              <div><span className="data">Bảng {team.group} · {team.code}</span><h2>{team.name}</h2><p>{next ? `Trận đầu: ${next.date}` : "Chưa có lịch"}</p></div>
              <span aria-hidden="true">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
