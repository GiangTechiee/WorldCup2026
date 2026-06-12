import Link from "next/link";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { DragScroll } from "@/components/drag-scroll";
import { knockoutRoundLabels, slotLabel, sourceMatchNumber } from "@/lib/match-slots";
import { formatKickoff, type Match } from "@/lib/worldcup";

const roundOrder = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"] as const;

const board = {
  cardHeight: 104,
  cardWidth: 292,
  columnGap: 136,
  headerHeight: 56,
  left: 24,
  rowStep: 118,
  top: 92,
};

type BracketNode = {
  match: Match;
  x: number;
  y: number;
};

const roundX = (roundIndex: number) => board.left + roundIndex * (board.cardWidth + board.columnGap);

const childNumbers = (match: Match) =>
  [sourceMatchNumber(match.homeTeam), sourceMatchNumber(match.awayTeam)].filter(
    (value): value is number => value !== null,
  );

function BracketMatch({
  embedded = false,
  match,
  x,
  y,
}: BracketNode & {
  embedded?: boolean;
}) {
  return (
    <Link
      className="bracket-match"
      href={`/tran-dau/${match.id}`}
      style={{
        display: "grid",
        height: board.cardHeight,
        left: embedded ? undefined : x,
        position: embedded ? "relative" : "absolute",
        top: embedded ? undefined : y,
        width: board.cardWidth,
        zIndex: 2,
      }}
    >
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

function BracketConnector({ from, to }: { from: BracketNode; to: BracketNode }) {
  const startX = from.x + board.cardWidth;
  const startY = from.y + board.cardHeight / 2;
  const endX = to.x;
  const endY = to.y + board.cardHeight / 2;
  const middleX = startX + (endX - startX) / 2;

  return (
    <path
      className="bracket-connector"
      d={`M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`}
      fill="none"
      stroke="#c58c18"
      strokeLinecap="square"
      strokeLinejoin="round"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function KnockoutBracket({ matches }: { matches: Match[] }) {
  const matchesByNumber = new Map(matches.map((match) => [match.number, match]));
  const yByNumber = new Map<number, number>();
  let leafIndex = 0;

  const placeMatch = (match: Match): number => {
    const existing = yByNumber.get(match.number);
    if (existing !== undefined) return existing;

    const children = childNumbers(match)
      .map((number) => matchesByNumber.get(number))
      .filter((child): child is Match => Boolean(child));

    if (!children.length) {
      const y = board.top + leafIndex * board.rowStep;
      leafIndex += 1;
      yByNumber.set(match.number, y);
      return y;
    }

    const y = children.reduce((total, child) => total + placeMatch(child), 0) / children.length;
    yByNumber.set(match.number, y);
    return y;
  };

  const finalMatch = matchesByNumber.get(104) ?? matches.find((match) => match.round === "Final");
  if (finalMatch) placeMatch(finalMatch);

  const nodesByNumber = new Map<number, BracketNode>();
  const rounds = roundOrder.map((round, roundIndex) => {
    const roundMatches = matches
      .filter((match) => match.round === round)
      .sort((left, right) => (yByNumber.get(left.number) ?? 0) - (yByNumber.get(right.number) ?? 0));

    const nodes = roundMatches.map((match, matchIndex) => {
      const sourceNodes = childNumbers(match)
        .map((number) => nodesByNumber.get(number))
        .filter((node): node is BracketNode => Boolean(node));
      const fallbackY = board.top + matchIndex * board.rowStep * 2 ** roundIndex;
      const sourceY = sourceNodes.length
        ? sourceNodes.reduce((total, node) => total + node.y, 0) / sourceNodes.length
        : yByNumber.get(match.number) ?? fallbackY;
      const node = {
        match,
        x: roundX(roundIndex),
        y: sourceY,
      };

      nodesByNumber.set(match.number, node);
      return node;
    });

    return { round, nodes };
  });
  const connectors = rounds.flatMap(({ nodes }) =>
    nodes.flatMap((node) =>
      childNumbers(node.match)
        .map((number) => (number === null ? null : nodesByNumber.get(number)))
        .filter((source): source is BracketNode => Boolean(source))
        .map((source) => ({ from: source, to: node })),
    ),
  );
  const thirdPlace = matches.find((match) => match.round === "Match for third place");
  const finalNode = nodesByNumber.get(104);
  const boardWidth = roundX(roundOrder.length - 1) + board.cardWidth + board.left;
  const boardHeight = board.top + board.rowStep * 16 + 150;

  return (
    <section className="bracket-shell" aria-label="Nhánh đấu loại trực tiếp">
      <DragScroll className="bracket-scroll">
        <div
          className="bracket-board"
          style={{
            height: boardHeight,
            position: "relative",
            width: boardWidth,
          }}
        >
          <svg
            aria-hidden="true"
            className="bracket-connectors"
            style={{
              inset: 0,
              overflow: "visible",
              pointerEvents: "none",
              position: "absolute",
              zIndex: 1,
            }}
            viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          >
            {connectors.map((connector) => (
              <BracketConnector
                from={connector.from}
                key={`${connector.from.match.number}-${connector.to.match.number}`}
                to={connector.to}
              />
            ))}
          </svg>

          {rounds.map(({ round, nodes }, roundIndex) => (
            <section
              className="bracket-round-header"
              key={round}
              style={{
                left: roundX(roundIndex),
                position: "absolute",
                top: 18,
                width: board.cardWidth,
                zIndex: 3,
              }}
            >
              <header
                style={{
                  alignItems: "center",
                  borderBottom: "2px solid #e9a91b",
                  color: "#ffc940",
                  display: "flex",
                  gap: "0.45rem",
                  justifyContent: "center",
                  minHeight: "3rem",
                  textAlign: "center",
                }}
              >
                {round === "Final" && <TrophyIcon size={18} weight="fill" aria-hidden="true" />}
                <strong>{knockoutRoundLabels[round]}</strong>
                <span style={{ color: "#aaa39c", fontSize: "0.62rem" }}>{nodes.length} trận</span>
              </header>
            </section>
          ))}

          {rounds.flatMap(({ nodes }) =>
            nodes.map((node) => <BracketMatch key={node.match.id} {...node} />),
          )}

          {thirdPlace && finalNode && (
            <div
              className="bracket-third-place"
              style={{
                left: finalNode.x,
                position: "absolute",
                top: finalNode.y + board.cardHeight + 26,
                width: board.cardWidth,
                zIndex: 3,
              }}
            >
              <strong>Tranh hạng ba</strong>
              <BracketMatch embedded match={thirdPlace} x={0} y={0} />
            </div>
          )}
        </div>
      </DragScroll>
      <p className="bracket-note">Nhánh được xác định theo số trận chính thức. Tên đội sẽ thay thế các slot sau khi vòng trước kết thúc.</p>
    </section>
  );
}
