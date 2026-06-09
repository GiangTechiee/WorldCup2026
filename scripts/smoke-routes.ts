const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const routes = [
  "/",
  "/lich-dau",
  "/lich-dau?date=2026-06-11&team=Mexico",
  "/bang-dau",
  "/doi-tuyen",
  "/doi-tuyen/mexico",
  "/tran-dau/match-1",
  "/yeu-thich",
];

async function main() {
  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    if (!response.ok) throw new Error(`${route} trả về HTTP ${response.status}`);
    const html = await response.text();
    if (!html.includes("Nhịp Bóng")) throw new Error(`${route} thiếu app shell`);
    console.log(`HTTP ${response.status} ${route}`);
  }

  console.log(`Smoke test đạt ${routes.length}/${routes.length} route.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
