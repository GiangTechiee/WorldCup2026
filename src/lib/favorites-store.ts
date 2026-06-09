"use client";

const STORAGE_KEY = "lua-san-26:favorites";
const EMPTY: string[] = [];

let cachedText = "";
let cachedFavorites: string[] = EMPTY;

export const getFavoritesSnapshot = () => {
  try {
    const text = localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (text !== cachedText) {
      cachedText = text;
      cachedFavorites = JSON.parse(text) as string[];
    }
    return cachedFavorites;
  } catch {
    return EMPTY;
  }
};

export const getServerFavoritesSnapshot = () => EMPTY;

export const subscribeFavorites = (callback: () => void) => {
  window.addEventListener("favorites-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("favorites-change", callback);
    window.removeEventListener("storage", callback);
  };
};

export const toggleFavorite = (id: string) => {
  const favorites = new Set(getFavoritesSnapshot());
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  cachedText = "";
  window.dispatchEvent(new Event("favorites-change"));
};
