import type { MetadataRoute } from "next";
import { matches, teams } from "@/lib/worldcup";

const baseUrl = "https://lua-san-26.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/lich-dau", "/bang-dau", "/doi-tuyen", "/yeu-thich"];
  return [
    ...staticRoutes.map((route) => ({ url: `${baseUrl}${route}` })),
    ...teams.map((team) => ({ url: `${baseUrl}/doi-tuyen/${team.id}` })),
    ...matches.map((match) => ({ url: `${baseUrl}/tran-dau/${match.id}` })),
  ];
}
