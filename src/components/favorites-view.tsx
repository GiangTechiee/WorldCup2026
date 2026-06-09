"use client";

import { useSyncExternalStore } from "react";
import { MatchCard } from "@/components/match-card";
import {
  getFavoritesSnapshot,
  getServerFavoritesSnapshot,
  subscribeFavorites,
} from "@/lib/favorites-store";
import type { Match } from "@/lib/worldcup";

export function FavoritesView({ matches }: { matches: Match[] }) {
  const ids = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );

  const favorites = matches.filter((match) => ids.includes(match.id));
  if (!favorites.length) {
    return (
      <div className="empty-state">
        <strong>Chưa giữ chỗ cho trận nào.</strong>
        <p>Nhấn biểu tượng trái tim ở một trận, nó sẽ nằm gọn ở đây.</p>
      </div>
    );
  }

  return <div className="match-list">{favorites.map((match) => <MatchCard match={match} key={match.id} />)}</div>;
}
