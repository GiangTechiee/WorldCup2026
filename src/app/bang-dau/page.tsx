import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { TeamFlag } from "@/components/team-flag";
import { groups } from "@/lib/worldcup";

export const metadata = { title: "Bảng đấu" };

export default function GroupsPage() {
  return (
    <div className="page-shell section-space">
      <PageHeading eyebrow="12 bảng · 48 đội" title="Bảng đấu" description="Cục diện chưa có điểm số, nhưng đội hình từng bảng đã sẵn sàng lên sân." />
      <div className="group-grid">
        {groups.map((group) => (
          <section className="group-panel" key={group.id}>
            <div className="group-title"><span className="data">{group.name.replace("Group ", "Bảng ")}</span><strong className="display">{group.name.at(-1)}</strong></div>
            <ol>
              {group.teams.map((team, index) => (
                <li key={team.id}><span className="data">{String(index + 1).padStart(2, "0")}</span><Link href={`/doi-tuyen/${team.id}`}><TeamFlag countryCode={team.countryCode} label={team.name} /> {team.name}</Link><small>{team.code}</small></li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
