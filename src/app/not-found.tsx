import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell section-space">
      <div className="empty-state">
        <span className="eyebrow">404 · Bóng ngoài đường biên</span>
        <strong>Không tìm thấy trang này.</strong>
        <p>Đường dẫn có thể đã đổi hoặc trận bạn tìm chưa được xếp lịch.</p>
        <Link className="button-primary" href="/">Về Hôm nay</Link>
      </div>
    </div>
  );
}
