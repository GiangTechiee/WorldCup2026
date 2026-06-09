# NHỊP BÓNG 26

Website lịch World Cup 2026 theo giờ Việt Nam, xây bằng Next.js App Router. Sản phẩm không yêu cầu đăng nhập, không dùng database; favorite được lưu trong `localStorage`.

## Chạy dự án

```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:3000`.

## Checkpoint

```powershell
npm.cmd run check
```

Lệnh này lần lượt kiểm tra dữ liệu, lint và production build.

Để smoke test production routes:

```powershell
npm.cmd run build
node.exe node_modules/next/dist/bin/next start
$env:BASE_URL="http://localhost:3000"
npm.cmd run smoke
```

## Dữ liệu

- Nguồn tĩnh nằm tại `src/data/raw`.
- Query và normalize nằm tại `src/lib/worldcup.ts`.
- `npm run data:validate` kiểm tra quan hệ, ID, ngày giờ và sân vận động.

## Tiến độ

Xem [PROGRESS.md](./PROGRESS.md). Một giai đoạn chỉ được đánh dấu hoàn thành sau khi checkpoint đạt.
