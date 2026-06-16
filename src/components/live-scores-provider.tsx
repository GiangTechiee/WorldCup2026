"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LiveMatchScore, LiveScoresResponse } from "@/lib/live-score";

type LiveScoresContextValue = {
  configured: boolean;
  error: string | null;
  isLoading: boolean;
  source: LiveScoresResponse["source"];
  scoresByMatchId: Record<string, LiveMatchScore>;
  updatedAt: string | null;
};

const LiveScoresContext = createContext<LiveScoresContextValue | null>(null);

export function LiveScoresProvider({
  children,
  refreshMs = 15_000,
}: {
  children: ReactNode;
  refreshMs?: number;
}) {
  const [response, setResponse] = useState<LiveScoresResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const loadScores = async () => {
      const controller = new AbortController();

      try {
        const result = await fetch("/api/live-scores", {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await result.json()) as LiveScoresResponse;
        if (isMounted) setResponse(payload);
      } catch (error) {
        if (isMounted) {
          setResponse({
            source: "fallback",
            configured: false,
            updatedAt: new Date().toISOString(),
            matches: [],
            error: error instanceof Error ? error.message : "Cannot load live scores",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          timeoutId = setTimeout(loadScores, refreshMs);
        }
      }

      return () => controller.abort();
    };

    void loadScores();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshMs]);

  const value = useMemo<LiveScoresContextValue>(() => {
    const scoresByMatchId = Object.fromEntries(
      (response?.matches ?? []).map((score) => [score.matchId, score]),
    );

    return {
      configured: response?.configured ?? false,
      error: response?.error ?? null,
      isLoading,
      source: response?.source ?? "fallback",
      scoresByMatchId,
      updatedAt: response?.updatedAt ?? null,
    };
  }, [isLoading, response]);

  return <LiveScoresContext.Provider value={value}>{children}</LiveScoresContext.Provider>;
}

export const useLiveScores = () => useContext(LiveScoresContext);
