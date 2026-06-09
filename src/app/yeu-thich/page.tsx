import { FavoritesView } from "@/components/favorites-view";
import { PageHeading } from "@/components/page-heading";
import { matches } from "@/lib/worldcup";

export const metadata = { title: "Đã lưu" };

export default function FavoritesPage() {
  return (
    <div className="page-shell section-space">
      <PageHeading eyebrow="Chỉ trên thiết bị này" title="Đã lưu" description="Không tài khoản, không đồng bộ cloud. Chỉ là một cuốn sổ tay gọn gàng trong trình duyệt." />
      <FavoritesView matches={matches} />
    </div>
  );
}
