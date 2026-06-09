"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Quotes, ShieldCheck, ShareNetwork, Warning, ChatDots } from "@phosphor-icons/react";

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

// Giscus Chat Component to load GitHub Discussions comments widget dynamically
function GiscusChat() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any existing giscus container to avoid duplicate widgets
    const iframe = document.querySelector("iframe.giscus-frame");
    if (iframe) {
      iframe.remove();
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "GiangTechiee/WorldCup2026");
    script.setAttribute("data-repo-id", "R_kgDOS1n9UA");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOS1n9UM4C-1jC");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-lang", "vi");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    ref.current?.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div ref={ref} className="giscus w-full mt-4" />;
}

export default function BinhLuanPage() {
  return (
    <div className="page-shell section-space">
      {/* Page Heading */}
      <div className="page-heading">
        <span className="eyebrow">Góc Chém Gió & Thảo Luận</span>
        <h1 className="display">Nhịp Đập<br />Cộng Đồng</h1>
        <p>Thảo luận sôi nổi, chém gió xuyên đêm và bình luận trực tiếp cùng cộng đồng bóng đá thế giới.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Real-time Giscus Discussion Widget (Takes 2/3 of the width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-sm p-6 shadow-md">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 mb-4">
              <ChatDots size={24} weight="fill" className="text-[var(--fire)]" />
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900">Trực Tiếp Fanzone</h2>
                <p className="text-xs text-zinc-500">Bình luận đồng bộ qua GitHub Discussions toàn cầu</p>
              </div>
            </div>
            
            {/* Embedded Giscus chat widget */}
            <GiscusChat />
          </div>
        </div>

        {/* Right Column: Dat Ka Macao Pinned Section (Takes 1/3 of the width) */}
        <div className="space-y-6">
          <div className="border border-zinc-200 rounded-2xl bg-white/50 backdrop-blur-sm p-6 shadow-md relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--fire)]/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Expert Info Card */}
            <div className="flex items-start gap-4 border-b border-zinc-100 pb-4">
              <div className="relative flex-shrink-0">
                <Image 
                  src="/dat-ka-macao.jpg" 
                  alt="Anh Đạt Ka Macao" 
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--fire)] shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 bg-[var(--fire)] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow">
                  <ShieldCheck weight="fill" className="w-2.5 h-2.5" /> VIP
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-zinc-900 truncate">Anh Đạt Ka Macao</h2>
                </div>
                <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                  Kỷ lục gia bờ đê
                </span>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">@dat_ka_macao_real</p>
              </div>
            </div>
            
            <p className="text-xs text-zinc-600 italic mt-3 leading-relaxed border-l-2 border-zinc-200 pl-2">
              &ldquo;Macao đã ra kèo thì chỉ có chuẩn. Thắng làm vua, thua thì ta đi bộ dưỡng sinh.&rdquo;
            </p>

            {/* Pinned Quotes Stream */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Quotes size={14} weight="fill" className="text-[var(--fire)]" /> Nhận định Ma Cao
              </h3>

              <div className="space-y-3">
                {datKaQuotes.map((q, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl border border-zinc-100 bg-white/70 shadow-sm relative hover:border-[var(--fire)] transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-[var(--fire-dark)] bg-[var(--fire)]/5 px-2 py-0.5 rounded">
                        {q.match}
                      </span>
                      <span className="text-[9px] font-medium text-zinc-400 font-mono">{q.time}</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      &ldquo;{q.quote}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 text-[10px] text-zinc-400 border-t border-zinc-100 pt-4">
              <span className="flex items-center gap-1"><Warning size={12} /> Chỉ mang tính chất giải trí.</span>
              <button className="flex items-center gap-1 hover:text-[var(--fire)] transition-colors self-start">
                <ShareNetwork size={12} /> Chia sẻ góc Macao
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
