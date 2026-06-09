import Image from "next/image";
import { ChatDots, Quotes, ShieldCheck, Heart, ShareNetwork, Warning } from "@phosphor-icons/react/dist/ssr";

type Comment = {
  id: string;
  author: string;
  avatar?: string;
  role?: string;
  time: string;
  content: string;
  likes: number;
  isExpert?: boolean;
};

export default function BinhLuanPage() {
  const datKaQuotes = [
    {
      match: "Mexico vs South Africa (Khai mạc)",
      quote: "Hôm nay anh em cứ đặt trọn niềm tin vào cửa trên Mexico nhé. Đất nước Nam Phi phong thủy không hợp màu áo đỏ lửa của Mexico đâu. Macao ra kèo chấp nửa trái ăn đủ là có ý đồ cả rồi, tin tôi đi, không ăn tôi đi đầu xuống đất!",
      time: "10 phút trước",
    },
    {
      match: "Germany vs Ivory Coast (Vòng bảng)",
      quote: "Bữa trước tin mấy ông tuyển Đức làm tôi đi bộ mỏi cả chân, suýt nữa phải bán cả xe. Đợt này tôi khuyên thật lòng: Đức chấp 1 trái rưỡi thì cứ nằm dưới Bờ Biển Ngà cho lành. Đừng cãi anh Đạt, Macao đang muốn thu lưới đấy!",
      time: "2 giờ trước",
    },
    {
      match: "Portugal vs DR Congo (Vòng bảng)",
      quote: "Ronaldo giải này 41 tuổi rồi nhưng vẫn gân lắm, Bồ Đào Nha chấp Congo 2 trái cơ mà. Nhưng từ kinh nghiệm đi Macao nhiều năm, anh khuyên anh em cứ bắt Congo đi, bóng rung hiệp 2 kiểu gì cũng nổ. Quay đầu là bờ!",
      time: "5 giờ trước",
    },
  ];

  const userComments: Comment[] = [
    {
      id: "1",
      author: "Hải Quay Xe",
      time: "2 phút trước",
      content: "Uy tín quá anh Đạt ơi! Hôm qua nghe lời anh nằm dưới ăn ngập mồm, nay em lại xuống tiền theo anh tiếp đây. Khai mạc rực rỡ!",
      likes: 42,
    },
    {
      id: "2",
      author: "Tuấn Híp",
      time: "8 phút trước",
      content: "Anh Đạt phán thế này thì em tự tin đi ngược lại rồi, tối nay nằm Nam Phi thôi anh em ơi! Cứ ngược anh Đạt là giàu sang phú quý =)))",
      likes: 128,
    },
    {
      id: "3",
      author: "Linh Xe Ôm",
      time: "15 phút trước",
      content: "Anh Đạt còn cái nịt nào không cho em mượn tạm qua mùa World Cup với... Vừa nghe anh trận trước xong giờ đang đứng ngoài đê lộng gió quá.",
      likes: 85,
    },
    {
      id: "4",
      author: "Cường Tỉ Đô",
      time: "30 phút trước",
      content: "Đạt Ka Macao ra kèo thì chỉ có chuẩn. Khung giờ 2h sáng đúng là cần những nhận định tâm linh thế này để anh em có động lực thức đêm xem bóng.",
      likes: 19,
    },
  ];

  return (
    <div className="page-shell section-space">
      {/* Page Heading */}
      <div className="page-heading">
        <span className="eyebrow">Góc Chém Gió & Thảo Luận</span>
        <h1 className="display">Nhịp Đập<br />Cộng Đồng</h1>
        <p>Nơi thảo luận, phân tích vui vẻ và cập nhật những nhận định siêu thực tế từ các “chiến thần” phân tích bóng đá.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Dat Ka Macao Pinned Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-sm p-6 shadow-md relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--fire)]/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Expert Info Card */}
            <div className="flex items-start gap-5 border-b border-zinc-100 pb-5">
              <div className="relative">
                <Image 
                  src="/dat-ka-macao.jpg" 
                  alt="Anh Đạt Ka Macao" 
                  width={96}
                  height={96}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-[var(--fire)] shadow-md"
                />
                <span className="absolute -bottom-2 -right-2 bg-[var(--fire)] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow">
                  <ShieldCheck weight="fill" className="w-3 h-3" /> VIP
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-zinc-900">Anh Đạt Ka Macao</h2>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Kỷ lục gia bờ đê
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-1">@dat_ka_macao_real</p>
                <p className="text-xs text-zinc-700 mt-2 leading-relaxed font-semibold italic text-zinc-600">
                  &ldquo;Macao đã ra kèo thì chỉ có chuẩn. Thắng làm vua, thua thì ta đi bộ dưỡng sinh.&rdquo;
                </p>
              </div>
            </div>

            {/* Pinned Quotes Stream */}
            <div className="mt-6 space-y-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Quotes size={16} weight="fill" className="text-[var(--fire)]" /> Nhận định nóng từ Ma Cao
              </h3>

              <div className="space-y-4">
                {datKaQuotes.map((q, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border border-zinc-100 bg-white/70 shadow-sm relative hover:border-[var(--fire)] transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[var(--fire-dark)] bg-[var(--fire)]/5 px-2.5 py-1 rounded-md">
                        {q.match}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400 font-mono">{q.time}</span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed pl-2 border-l-2 border-zinc-200">
                      &ldquo;{q.quote}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-100 pt-4">
              <span className="flex items-center gap-1"><Warning size={12} /> Nhận định mang tính chất chém gió tâm linh giải trí.</span>
              <button className="flex items-center gap-1 hover:text-[var(--fire)] transition-colors">
                <ShareNetwork size={14} /> Chia sẻ góc Macao
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Other Fan Comments (Interactive-looking Feed) */}
        <div className="space-y-6">
          <div className="border border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-sm p-6 shadow-md">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ChatDots size={18} weight="fill" className="text-[var(--fire)]" /> Trực Tiếp Fanzone
            </h3>

            {/* Fake post action */}
            <div className="mb-6">
              <textarea 
                placeholder="Chia sẻ nhận định của bạn về trận đấu hôm nay..."
                className="w-full h-20 p-3 text-xs border border-zinc-200 rounded-xl bg-white resize-none focus:outline-none focus:border-[var(--fire)]"
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-zinc-400">Không cần đăng nhập</span>
                <button className="button-primary !min-height-0 py-1.5 px-4 text-xs font-extrabold rounded-lg">
                  Gửi chém gió
                </button>
              </div>
            </div>

            {/* Comments Feed */}
            <div className="space-y-4">
              {userComments.map((comment) => (
                <div key={comment.id} className="p-3 bg-white rounded-xl border border-zinc-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-[10px] uppercase">
                        {comment.author.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-zinc-800">{comment.author}</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono">{comment.time}</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-400 pt-1">
                    <button className="flex items-center gap-1 hover:text-[var(--fire)] transition-colors">
                      <Heart size={12} /> Thích ({comment.likes})
                    </button>
                    <span>Phản hồi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
