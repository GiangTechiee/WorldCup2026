import "server-only";

type PlayerImageInput = {
  allowPlayerSearch?: boolean;
  espnHeadshotUrl: string | null;
  name: string;
  teamName: string;
};

type CachedImage = {
  expiresAt: number;
  value: string | null;
};

type SportsDbPlayer = {
  strCutout?: string | null;
  strNationality?: string | null;
  strPlayer?: string | null;
  strRender?: string | null;
  strTeam?: string | null;
  strThumb?: string | null;
};

type SportsDbSearchResponse = {
  player?: SportsDbPlayer[] | null;
};

type WikidataSearchResponse = {
  search?: Array<{
    description?: string;
    id?: string;
    label?: string;
  }>;
};

type WikidataEntitiesResponse = {
  entities?: Record<
    string,
    {
      claims?: {
        P18?: Array<{
          mainsnak?: {
            datavalue?: {
              value?: string;
            };
          };
        }>;
      };
    }
  >;
};

const SPORTS_DB_API_KEY = process.env.THESPORTSDB_KEY ?? "123";
const IMAGE_CACHE_VERSION = "v8";
const ONE_DAY = 24 * 60 * 60 * 1000;
const imageCache = new Map<string, CachedImage>();
const sportsDbTeamCache = new Map<string, Promise<SportsDbPlayer[]>>();

const aliases: Record<string, string> = {
  "czech republic": "czechia",
  "south korea": "korea republic",
  usa: "united states",
};

const normalize = (value: string) => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return aliases[normalized] ?? normalized;
};

const fetchJson = async <T>(url: string, revalidate: number) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WorldCup2026App/1.0 (player image enrichment)",
    },
    next: {
      revalidate,
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
};

const playerImage = (player: SportsDbPlayer) => player.strCutout ?? player.strRender ?? player.strThumb ?? null;

const nameWithoutDiacritics = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const nameVariants = (name: string) => {
  const clean = name.replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim();
  const noDiacritics = nameWithoutDiacritics(clean);
  const parts = noDiacritics.split(/\s+/).filter(Boolean);
  const reversed = parts.length > 1 ? [...parts.slice(1), parts[0]].join(" ") : "";

  return [...new Set([clean, noDiacritics, reversed].filter(Boolean))];
};

const getSportsDbTeamPlayers = (teamName: string) => {
  const cacheKey = normalize(teamName);
  const cached = sportsDbTeamCache.get(cacheKey);
  if (cached) return cached;

  const query = encodeURIComponent(teamName.replaceAll(" ", "_"));
  const request = fetchJson<SportsDbSearchResponse>(
    `https://www.thesportsdb.com/api/v1/json/${SPORTS_DB_API_KEY}/searchplayers.php?t=${query}`,
    7 * 24 * 60 * 60,
  ).then((payload) => payload?.player?.filter((player) => playerImage(player)) ?? []);

  sportsDbTeamCache.set(cacheKey, request);
  return request;
};

const getSportsDbTeamImage = async (name: string, teamName: string) => {
  const players = await getSportsDbTeamPlayers(teamName);
  const normalizedName = normalize(name);
  const player = players.find((item) => {
    const candidate = normalize(item.strPlayer ?? "");
    return candidate === normalizedName || candidate.includes(normalizedName) || normalizedName.includes(candidate);
  });

  return player ? playerImage(player) : null;
};

const getSportsDbSearchImage = async (name: string) => {
  for (const variant of nameVariants(name)) {
    const query = encodeURIComponent(variant.replaceAll(" ", "_"));
    const payload = await fetchJson<SportsDbSearchResponse>(
      `https://www.thesportsdb.com/api/v1/json/${SPORTS_DB_API_KEY}/searchplayers.php?p=${query}`,
      7 * 24 * 60 * 60,
    );
    const players = payload?.player?.filter((player) => playerImage(player)) ?? [];
    if (players.length) return playerImage(players[0]);
  }

  return null;
};

const isFootballDescription = (description: string | undefined) => {
  const value = description?.toLowerCase() ?? "";
  return value.includes("football") || value.includes("soccer");
};

const isString = (value: string | undefined): value is string => Boolean(value);

const commonsFileUrl = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename).replaceAll("%20", "_")}`;

const getWikidataImage = async (name: string) => {
  for (const variant of nameVariants(name)) {
    const search = await fetchJson<WikidataSearchResponse>(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(variant)}&language=en&format=json&limit=5`,
      7 * 24 * 60 * 60,
    );
    const candidates = search?.search ?? [];
    const ids = [
      ...candidates.filter((candidate) => isFootballDescription(candidate.description)).map((candidate) => candidate.id),
      ...candidates.map((candidate) => candidate.id),
    ].filter(isString);

    for (const id of [...new Set(ids)]) {
      const entity = await fetchJson<WikidataEntitiesResponse>(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=claims&format=json`,
        7 * 24 * 60 * 60,
      );
      const filename = entity?.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (filename) return commonsFileUrl(filename);
    }
  }

  return null;
};

export const resolvePlayerImage = async ({
  allowPlayerSearch = false,
  espnHeadshotUrl,
  name,
  teamName,
}: PlayerImageInput) => {
  if (espnHeadshotUrl) return espnHeadshotUrl;

  const cacheKey = `${IMAGE_CACHE_VERSION}:${normalize(teamName)}:${normalize(name)}`;
  const cached = imageCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: string | null = null;

  if (allowPlayerSearch) {
    try {
      value = await getSportsDbSearchImage(name);
    } catch {
      value = null;
    }
  }

  if (!value && allowPlayerSearch) {
    try {
      value = await getWikidataImage(name);
    } catch {
      value = null;
    }
  }

  if (!value && allowPlayerSearch) {
    try {
      value = await getSportsDbTeamImage(name, teamName);
    } catch {
      value = null;
    }
  }

  imageCache.set(cacheKey, {
    expiresAt: Date.now() + ONE_DAY,
    value,
  });

  return value;
};
