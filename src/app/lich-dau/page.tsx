import { LiveScoresNotice } from "@/components/live-scores-notice";
import { LiveScoresProvider } from "@/components/live-scores-provider";
import { MatchCard } from "@/components/match-card";
import { PageHeading } from "@/components/page-heading";
import { matches, teams } from "@/lib/worldcup";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = { title: "Lịch đấu" };

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : "";
  const team = typeof params.team === "string" ? params.team : "";
  const view = params.view === "bracket" ? "bracket" : "list";
  const filtered = matches.filter(
    (match) =>
      (!date || match.date === date) &&
      (!team || match.homeTeam === team || match.awayTeam === team),
  );

  return (
    <div className="page-shell section-space">
      <PageHeading
        eyebrow="104 trận · 39 ngày"
        title="Lịch đấu"
        description="Chọn ngày hoặc đội. Link sau khi lọc có thể gửi thẳng cho hội bạn cùng thức."
      />
      <nav className="schedule-view-switch" aria-label="Kiểu hiển thị lịch đấu">
        <Link aria-current={view === "list" ? "page" : undefined} href="/lich-dau">
          <ListBulletsIcon size={18} weight="bold" aria-hidden="true" />
          Danh sách
        </Link>
        <Link aria-current={view === "bracket" ? "page" : undefined} href="/lich-dau?view=bracket">
          <GitBranchIcon size={18} weight="bold" aria-hidden="true" />
          Nhánh đấu
        </Link>
      </nav>

      {view === "bracket" ? (
        <KnockoutBracket matches={matches.filter((match) => !match.group)} />
      ) : (
        <>
          <form className="filter-bar">
            <label>
              Ngày
              <input type="date" name="date" defaultValue={date} />
            </label>
            <label>
              Đội tuyển
              <select name="team" defaultValue={team}>
                <option value="">Tất cả đội</option>
                {teams.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <button className="button-primary" type="submit">Lọc lịch</button>
            {(date || team) && <a className="button-secondary" href="/lich-dau">Xóa lọc</a>}
          </form>
          <p className="result-count data">{filtered.length} trận phù hợp</p>
          <LiveScoresProvider>
            <LiveScoresNotice />
            {filtered.length ? (
              <div className="match-list">
                {filtered.map((match) => <MatchCard match={match} key={match.id} />)}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Không có trận phù hợp.</strong>
                <p>Thử đổi ngày hoặc bớt một bộ lọc.</p>
              </div>
            )}
          </LiveScoresProvider>
        </>
      )}
    </div>
  );
}
import Link from "next/link";
import { GitBranchIcon, ListBulletsIcon } from "@phosphor-icons/react/dist/ssr";
import { KnockoutBracket } from "@/components/knockout-bracket";
