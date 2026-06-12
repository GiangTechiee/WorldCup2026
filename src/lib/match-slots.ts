export const knockoutRoundLabels: Record<string, string> = {
  "Round of 32": "Vòng 32 đội",
  "Round of 16": "Vòng 16 đội",
  "Quarter-final": "Tứ kết",
  "Semi-final": "Bán kết",
  "Match for third place": "Tranh hạng ba",
  Final: "Chung kết",
};

export const slotLabel = (slot: string) => {
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

export const isPlaceholderSlot = (slot: string) =>
  /^W\d+$/.test(slot) ||
  /^L\d+$/.test(slot) ||
  /^[123][A-L](?:\/[A-L])*$/.test(slot);

export const sourceMatchNumber = (slot: string) => {
  const winner = slot.match(/^W(\d+)$/);
  return winner ? Number(winner[1]) : null;
};
