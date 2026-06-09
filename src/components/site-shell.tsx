import Link from "next/link";
import {
  CalendarDotsIcon,
  HeartIcon,
  HouseIcon,
  ListNumbersIcon,
  UsersThreeIcon,
  ChatDotsIcon,
} from "@phosphor-icons/react/dist/ssr";

const navigation = [
  { href: "/", label: "Hôm nay", icon: HouseIcon },
  { href: "/lich-dau", label: "Lịch đấu", icon: CalendarDotsIcon },
  { href: "/bang-dau", label: "Bảng đấu", icon: ListNumbersIcon },
  { href: "/doi-tuyen", label: "Đội tuyển", icon: UsersThreeIcon },
  { href: "/binh-luan", label: "Bình luận", icon: ChatDotsIcon },
  { href: "/yeu-thich", label: "Đã lưu", icon: HeartIcon },
];

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Nhịp Bóng 26, trang chủ">
      <span className="brand-mark">26</span>
      <span>Nhịp Bóng</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="button-primary" href="/lich-dau">
          Xem lịch
        </Link>
      </div>
    </header>
  );
}

export function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Điều hướng mobile">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link href={item.href} key={item.href}>
            <Icon weight="bold" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        <div>
          <Brand />
          <p>Đúng giờ bóng lăn, đúng nhịp cổ vũ.</p>
        </div>
        <p className="data">Mexico · Canada · United States · 2026</p>
      </div>
    </footer>
  );
}
