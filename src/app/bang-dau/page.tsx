import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { TeamFlag } from "@/components/team-flag";
import { groups, getTeam } from "@/lib/worldcup";
import { getWorldCup26Standings, type WorldCup26Standing } from "@/lib/worldcup26-api";

export const metadata = { title: "Bảng xếp hạng" };

const fallbackStandings = (): WorldCup26Standing[] =>
  groups.map((group) => ({
    group: group.name.replace("Group ", ""),
    teams: group.teams.map((team) => ({
      teamId: team.id,
      name: team.name,
      code: team.code,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })),
  }));

const formatGoalDifference = (value: number) => {
  if (value > 0) return `+${value}`;
  return String(value);
};

export default async function GroupsPage() {
  let standings = fallbackStandings();
  let isLive = false;

  try {
    standings = await getWorldCup26Standings();
    isLive = true;
  } catch {
    standings = fallbackStandings();
  }

  return (
    <div className="page-shell section-space">
      <PageHeading
        eyebrow={isLive ? "BXH live · World Cup 2026" : "12 bảng · 48 đội"}
        title="Bảng xếp hạng"
        description="Cập nhật điểm số, hiệu số và thứ hạng từng bảng. Khi nguồn live tạm lỗi, trang tự quay về danh sách đội trong lịch gốc."
      />
      <div className="group-grid standings-grid">
        {standings.map((group) => (
          <section className="group-panel standings-panel" key={group.group}>
            <div className="group-title">
              <span className="data">Bảng {group.group}</span>
              <strong className="display">{group.group}</strong>
            </div>
            <div className="standings-table" role="table" aria-label={`Bảng ${group.group}`}>
              <div className="standings-row standings-head" role="row">
                <span role="columnheader">#</span>
                <span role="columnheader">Đội</span>
                <span role="columnheader">Tr</span>
                <span role="columnheader">T</span>
                <span role="columnheader">H</span>
                <span role="columnheader">B</span>
                <span role="columnheader">HS</span>
                <span role="columnheader">Đ</span>
              </div>
              {group.teams.map((row, index) => {
                const team = getTeam(row.name);

                return (
                  <div className="standings-row" role="row" key={`${group.group}-${row.teamId}`}>
                    <span className="data standings-rank" role="cell">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Link className="standings-team" href={team ? `/doi-tuyen/${team.id}` : "/doi-tuyen"} role="cell">
                      <TeamFlag countryCode={team?.countryCode ?? ""} label={team?.name ?? row.name} />
                      <strong>{team?.name ?? row.name}</strong>
                      <small>{row.code}</small>
                    </Link>
                    <span className="data" role="cell">{row.played}</span>
                    <span className="data" role="cell">{row.won}</span>
                    <span className="data" role="cell">{row.drawn}</span>
                    <span className="data" role="cell">{row.lost}</span>
                    <span className="data" role="cell">{formatGoalDifference(row.goalDifference)}</span>
                    <strong className="data standings-points" role="cell">{row.points}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
