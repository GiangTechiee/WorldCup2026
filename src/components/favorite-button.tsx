"use client";

import { HeartIcon } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";
import {
  getFavoritesSnapshot,
  getServerFavoritesSnapshot,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites-store";

export function FavoriteButton({ id, label }: { id: string; label: string }) {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );
  const selected = favorites.includes(id);

  return (
    <button
      className="favorite-button"
      type="button"
      onClick={() => toggleFavorite(id)}
      aria-label={selected ? `Bỏ lưu ${label}` : `Lưu ${label}`}
      aria-pressed={selected}
    >
      <HeartIcon weight={selected ? "fill" : "bold"} aria-hidden="true" />
    </button>
  );
}
