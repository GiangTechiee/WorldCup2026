import Link from "next/link";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { formatKickoff, type Match } from "@/lib/worldcup";

const roundOrder = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"] as const;

const roundLabels: Record<(typeof roundOrder)[number], string> = {
  "Round of 32": "Vòng 32 đội",
  "Round of 16": "Vòng 16 đội",
  "Quarter-final": "Tứ kết",
  "Semi-final": "Bán kết",
  Final: "Chung kết",
};

const slotLabel = (slot: string) => {
  const winner = slot.match(/^W(\d+)$/);
  if (winner) return `Thắng trận ${winner[1]}`;

  const loser = slot.match(/^L(\d+)$/);
  if (loser) return `Thua trận ${loser[1]}`;

  const groupPlace = slot.match(/^([123])([A-L](?:\/[A-L])*)$/);
  if (groupPlace) {
    const place = groupPlace[1] === "1" ? "Nhất" : groupPlace[1] === "2" ? "Nhì" : "Hạng ba tốt nhất";
    return `${place} bảng ${groupPlace[2]}`;
  }

  return slot;
};

function BracketMatch({ match }: { match: Match }) {
  return (
    <Link className="bracket-match" href={`/tran-dau/${match.id}`}>
      <div className="bracket-match-meta">
        <strong className="data">#{match.number}</strong>
        <time dateTime={match.kickoffAt}>{formatKickoff(match.kickoffAt)}</time>
      </div>
      <span>{slotLabel(match.homeTeam)}</span>
      <span>{slotLabel(match.awayTeam)}</span>
      <small>{match.ground}</small>
    </Link>
  );
}

export function KnockoutBracket({ matches }: { matches: Match[] }) {
  const rounds = roundOrder.map((round) => ({
    round,
    matches: matches.filter((match) => match.round === round).sort((left, right) => left.number - right.number),
  }));
  const thirdPlace = matches.find((match) => match.round === "Match for third place");

  return (
    <section className="bracket-shell" aria-label="Nhánh đấu loại trực tiếp">
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {rounds.map(({ round, matches: roundMatches }) => (
            <section className={`bracket-round bracket-round-${roundMatches.length}`} key={round}>
              <header>
                {round === "Final" && <TrophyIcon size={18} weight="fill" aria-hidden="true" />}
                <strong>{roundLabels[round]}</strong>
                <span>{roundMatches.length} trận</span>
              </header>
              <div className="bracket-round-matches">
                {roundMatches.map((match) => <BracketMatch match={match} key={match.id} />)}
              </div>
              {round === "Final" && thirdPlace && (
                <div className="bracket-third-place">
                  <strong>Tranh hạng ba</strong>
                  <BracketMatch match={thirdPlace} />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
      <p className="bracket-note">Nhánh được xác định theo số trận chính thức. Tên đội sẽ thay thế các slot sau khi vòng trước kết thúc.</p>
    </section>
  );
}
