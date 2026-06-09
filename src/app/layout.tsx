import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileNavigation, SiteFooter, SiteHeader } from "@/components/site-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nhịp Bóng 26",
    template: "%s | Nhịp Bóng 26",
  },
  description: "Lịch World Cup 2026 theo giờ Việt Nam, nhanh, rõ và đúng nhịp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">
          Bỏ qua tới nội dung
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <MobileNavigation />
      </body>
    </html>
  );
}
