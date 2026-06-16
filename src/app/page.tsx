import Link from "next/link";
import { connection } from "next/server";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { HeroMatchCarousel } from "@/components/hero-match-carousel";
import { LiveScoresNotice } from "@/components/live-scores-notice";
import { LiveScoresProvider } from "@/components/live-scores-provider";
import { MatchCard } from "@/components/match-card";
import { getCurrentDisplayDayMatches, getNextDisplayDayMatches, tournamentStats } from "@/lib/worldcup";

export default async function Home() {
  await connection();

  const currentDay = getCurrentDisplayDayMatches();
  const tomorrowDay = getNextDisplayDayMatches();
  const dayMatches = currentDay.matches;

  return (
    <LiveScoresProvider>
      <LiveScoresNotice />
      <section className="hero">
        <div className="page-shell hero-grid">
          <div>
            <span className="eyebrow">World Cup 2026 · giờ Việt Nam</span>
            <h1 className="display">Biết giờ đá.<br /><span>Giữ nhịp xem.</span></h1>
            <p>Lịch đấu rõ ràng cho những người yêu bóng đá nhưng vẫn quý giấc ngủ của mình.</p>
            <div className="hero-actions">
              <Link className="button-primary" href="/lich-dau">
                Xem toàn bộ lịch <ArrowRightIcon weight="bold" aria-hidden="true" />
              </Link>
              <Link className="button-secondary" href="/doi-tuyen">Tìm đội của bạn</Link>
            </div>
          </div>
          <div>
            <span className="poster-number" aria-hidden="true">26</span>
            <HeroMatchCarousel date={tomorrowDay.date} matches={tomorrowDay.matches} />
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Ngày mở màn</span>
              <h2 className="display">Cùng ngày, cùng nóng.</h2>
            </div>
            <Link className="text-link" href={`/lich-dau?date=${currentDay.date}`}>Xem ngày này →</Link>
          </div>
          <div className="match-list">{dayMatches.map((match) => <MatchCard match={match} key={match.id} />)}</div>
        </div>
      </section>

      <section className="stats-band">
        <div className="page-shell stats-grid">
          {[
            ["Trận", tournamentStats.matches],
            ["Đội", tournamentStats.teams],
            ["Bảng", tournamentStats.groups],
            ["Sân", tournamentStats.stadiums],
          ].map(([label, value]) => (
            <div key={label}><strong className="display">{value}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>
    </LiveScoresProvider>
  );
}
