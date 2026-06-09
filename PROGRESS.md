# NHỊP BÓNG 26 - Tiến độ triển khai

> Quy tắc: một giai đoạn chỉ được đánh dấu hoàn thành sau khi các lệnh kiểm tra của checkpoint đều chạy thành công.

## Trạng thái tổng thể

| Giai đoạn | Trạng thái | Checkpoint bắt buộc |
|---|---|---|
| Khởi tạo scaffold | Hoàn thành | `npm run lint`, `npm run build` |
| Giai đoạn 1: Foundation và data layer | Hoàn thành | `npm run data:validate`, `npm run lint`, `npm run build` |
| Giai đoạn 2: Design system và app shell | Hoàn thành | `npm run lint`, `npm run build`, smoke test route |
| Giai đoạn 3: Các màn hình MVP | Hoàn thành | `npm run lint`, `npm run build`, smoke test toàn bộ route |
| Giai đoạn 4: Kiểm thử tổng thể | Hoàn thành | lint, build, route smoke test, responsive review |

## Nhật ký checkpoint

### Khởi tạo scaffold

- Kết quả: **Đạt**
- Next.js App Router, TypeScript, Tailwind CSS v4 và ESLint đã được khởi tạo.
- Dữ liệu nguồn đã được copy vào `src/data/raw`.
- `npm run lint`: đạt.
- `npm run build`: đạt.
- Route đã prerender: `/`, `/_not-found`.

### Giai đoạn 1: Foundation và data layer

- Kết quả: **Đạt**
- Đã có typed query layer và normalize thời gian trận.
- `npm run data:validate`: đạt, xác nhận 104 trận, 48 đội, 12 bảng, 16 sân.
- `npm run lint`: đạt.
- `npm run build`: đạt.

### Giai đoạn 2: Design system và app shell

- Kết quả: **Đạt**
- Đã có design tokens, typography, desktop header, mobile bottom navigation và footer.
- `npm run check`: đạt.
- Production smoke test `/`: HTTP 200, title và nội dung thương hiệu đúng.

### Giai đoạn 3: Các màn hình MVP

- Kết quả: **Đạt**
- Đã xây trang Hôm nay, lịch có filter URL, bảng, đội, chi tiết trận/đội và favorite cục bộ.
- Favorite dùng `useSyncExternalStore` để tránh hydration mismatch.
- `npm run check`: đạt.
- Build tạo 160 trang tĩnh/SSG.
- Production smoke test đạt HTTP 200 cho 8 route đại diện.

### Giai đoạn 4: Kiểm thử tổng thể

- Kết quả: **Đạt**
- Đã bổ sung not-found, robots, sitemap, README và script smoke test.
- `npm run check`: đạt.
- Production build tạo 162 trang tĩnh/SSG/dynamic.
- `npm run smoke`: đạt 8/8 route đại diện.
- Đã rà trực quan desktop và mobile bằng Chrome headless.
- Đã sửa hero desktop quá lớn và CTA mobile gây tràn.
- DevTools xác nhận mobile có đủ 5 navigation item và không có horizontal overflow.

## Trạng thái hiện tại

MVP chạy được và toàn bộ bốn giai đoạn đã qua checkpoint. Các hạng mục MVP+ như search toàn cục, bracket, sân vận động và calendar chưa được triển khai.

## Checkpoint sửa hydration và UI

- Kết quả: **Đạt**
- Đã đổi thương hiệu từ Lửa Sân thành Nhịp Bóng.
- Đã bỏ câu chữ kỹ thuật khỏi footer.
- Đã thay display font thiếu glyph tiếng Việt bằng Geist Black.
- Đã bỏ ép uppercase cho display typography để dấu tiếng Việt đọc tự nhiên.
- Đã thay emoji cờ bằng SVG 3:2 thật cho 48 đội.
- Đã thêm root hydration guard cho attribute do extension trình duyệt chèn vào.
- `npm run check`: đạt, build 162 trang.
- `npm run smoke`: đạt 8/8 route.
- Browser console production: không có hydration mismatch qua 3 lượt tải, kể cả khi mô phỏng extension chèn attribute và có favorite trong `localStorage`.
- Visual audit: font tiếng Việt hiển thị đúng; trang đội có 48 cờ thật và 0 placeholder.
- Ghi chú: harness tự động với Next dev/Turbopack bị treo kết nối reload; production hydration test hoạt động ổn định và đã đạt.
