import React, { useState } from "react";
import { Sparkles, RefreshCw, Eye, EyeOff, ShieldAlert, Award, Copy, Check, SmilePlus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChallengeCategory } from "../types";

const CATEGORIES: ChallengeCategory[] = [
  {
    id: "truth",
    label: "Thật (Truth)",
    description: "Những câu hỏi tiết lộ bí mật hài hước ẩn giấu tại nơi làm việc.",
    color: "from-amber-500/15 to-orange-500/15 border-amber-500/30 text-amber-400"
  },
  {
    id: "dare",
    label: "Thách (Dare)",
    description: "Thử thách hành động thể chất, tấu hài văn phòng tại chỗ.",
    color: "from-rose-500/15 to-pink-500/15 border-rose-500/30 text-rose-400"
  },
  {
    id: "icebreaker",
    label: "Phá Băng (Icebreaker)",
    description: "Câu hỏi mở kích thích trò chuyện thân thiện giữa mọi người.",
    color: "from-indigo-500/15 to-cyan-500/15 border-indigo-500/30 text-indigo-400"
  }
];

export default function ChallengeArena() {
  const [activeCategory, setActiveCategory] = useState<"truth" | "dare" | "icebreaker">("truth");
  const [customVibe, setCustomVibe] = useState("");
  const [audienceContext, setAudienceContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [prompts, setPrompts] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [warning, setWarning] = useState<string | null>(null);

  // Bonus physical penalty generator items
  const [isPenaltyLoading, setIsPenaltyLoading] = useState(false);
  const [penaltyText, setPenaltyText] = useState<string | null>(null);
  const [penaltyDuration, setPenaltyDuration] = useState("");
  const [penaltyCopied, setPenaltyCopied] = useState(false);

  // Generate prompts
  const generatePrompts = async (catId = activeCategory) => {
    setIsLoading(true);
    setFlippedCards({});
    setWarning(null);

    try {
      const response = await fetch("/api/gemini/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: catId,
          topic: customVibe || "Vui bựa, phá bĩnh nhưng lịch thiệp",
          customContext: audienceContext || "Đồng nghiệp công sở văn phòng"
        })
      });

      const data = await response.json();
      if (response.ok && data.prompts) {
        setPrompts(data.prompts);
        if (data.warning) setWarning(data.warning);
      } else {
        throw new Error(data.error || "Gặp lỗi tạo prompts.");
      }
    } catch (err: any) {
      console.warn("Lỗi tạo thử thách tự động:", err);
      setWarning("Đang sài bộ câu hỏi độc quyền có sẵn do AI của bạn đang hồi năng lượng!");
      
      // Traditional offline list fallback triggers
      const fallbacks: Record<string, string[]> = {
        truth: [
          "Bí mật lớn nhất bạn đang giấu người đồng nghiệp ngay bên trái là gì?",
          "Nếu được thay thế Sếp trong 1 buổi sáng, việc đầu tiên bạn sướng nhất là làm gì?",
          "Kể tên 1 thói quen bầy hầy kì lạ nhất của bạn ở nhà mà không ai hay biết!",
          "Bạn đã bao giờ ngủ gật trong giờ làm việc hay cuộc thảo luận trực tuyến chưa?",
          "Điều gì tại công ty khiến bạn cảm thấy mắc cười nhất mỗi khi nhớ tới?",
          "Ai trong nhóm này là người bạn cảm giác đáng tin nhất khi cần mượn tiền?"
        ],
        dare: [
          "Nhảy múa vui nhộn hoặc múa lân không nhạc tại chỗ trong vòng 20 giây!",
          "Vỗ ngực hô to câu: 'Tôi vô địch thiên hà, tôi là ngôi sao teambuilding!' 3 lần liên tiếp!",
          "Nhắn tin cảm ơn chân thành đến một thành viên không có mặt trong phòng vì lý do bá đạo!",
          "Dùng vai vẽ lại một hình vuông, hình tròn đồng thời trong 15 giây!",
          "Tự sướng 1 cú ảnh xấu dã man bằng điện thoại rồi gửi thẳng vào nhóm chat chung!",
          "Líu lưỡi rực rỡ nói nhanh: 'Nồi đồng nấu ốc nồi đất nấu ếch' thật nhanh 3 lần liên tiếp!"
        ],
        icebreaker: [
          "Nếu cả nhóm lạc lên sao Hỏa và chỉ mang theo 1 vật phẩm văn phòng dã man, bạn mang gì?",
          "Món trà sữa hay loại sinh tố khoái khẩu nhất giúp bạn giải cứu áp lực là gì?",
          "Nếu được tuyển chọn sếp mới từ các loài động vật hoạt hình, loài nào sẽ cai trị bạn?",
          "Kể về chuyến đi phượt hoặc kì nghỉ tấu hài nhất cùng đám bạn thân!",
          "Mẹo làm việc năng xuất nhất mà bạn tự thấy hãnh diện mà chưa chia sẻ cho ai?",
          "Nếu bạn bất ngờ trúng giải đặc biệt xổ số Vietlott, ai trong phòng này bạn chiêu đãi đầu tiên?"
        ]
      };
      setPrompts(fallbacks[catId] || fallbacks.truth);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount
  React.useEffect(() => {
    generatePrompts();
  }, []);

  const handleCategorySwitch = (catId: "truth" | "dare" | "icebreaker") => {
    setActiveCategory(catId);
    generatePrompts(catId);
  };

  const handleCardFlip = (idx: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const drawQuickPenalty = async () => {
    setIsPenaltyLoading(true);
    setPenaltyText(null);
    setPenaltyDuration("");

    try {
      const response = await fetch("/api/gemini/penalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intensity: "funny",
          userContext: audienceContext || "Hoạt động teambuilding"
        })
      });

      const data = await response.json();
      if (response.ok && data.penalty) {
        setPenaltyText(data.penalty);
        setPenaltyDuration(data.duration || "ngay lập tức");
      } else {
        throw new Error();
      }
    } catch {
      const fallbacks = [
        "Bắt chước âm thanh tiếng sủa của chó con đáng yêu trong 15 giây!",
        "Làm động tác nhảy lò cò xung quanh phòng khách 2 vòng!",
        "Hát tặng cả đội một bài hát ca ngợi quê hương đất nước!",
        "Chịu phạt uống một ngụm nước lọc thật đầy miệng rồi cố gượng giữ im lặng 30 giây!",
        "Đứng thăng bằng một chân, hai tay giang rộng làm hình chim bay 1 phút!",
        "Vẽ chân dung bằng bút dạ trên giấy người bên cạnh trong 30 giây mắt nhắm nghiền!"
      ];
      setPenaltyText(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      setPenaltyDuration("ngay lập tức");
    } finally {
      setIsPenaltyLoading(false);
    }
  };

  const handleCopyPenalty = () => {
    if (!penaltyText) return;
    navigator.clipboard.writeText(`${penaltyText} (${penaltyDuration})`);
    setPenaltyCopied(true);
    setTimeout(() => setPenaltyCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Navigation Categories */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/25 border border-slate-700/60 p-5 rounded-2xl">
        <div className="flex flex-col">
          <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
            <SmilePlus className="w-4 h-4 text-rose-400" />
            Đại Chiến Thử Thách
          </h3>
          <p className="text-xs text-slate-400">Chọn thể loại bốc thăm, lật thẻ bài để kích hoạt</p>
        </div>

        {/* Tab Switcher - Grid layout for perfect touch target widths on mobile */}
        <div className="w-full md:w-auto grid grid-cols-3 gap-1 bg-slate-900 border border-slate-750 p-1.5 rounded-xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySwitch(cat.id)}
              className={`px-2 sm:px-4 py-2.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-lg transition-all capitalize cursor-pointer touch-manipulation text-center ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/15"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {cat.id === "truth" ? "Thật" : cat.id === "dare" ? "Thách" : "Mở"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of play boards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Customized Prompts List section */}
        <div className="lg:col-span-8 space-y-5">
          {warning && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Tin nhắn:</span> {warning}
              </div>
            </div>
          )}

          {isLoading ? (
            /* Loading skeletons cards grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/20 border border-slate-750 rounded-2xl h-44 flex flex-col items-center justify-center text-center animate-pulse p-4"
                >
                  <RefreshCw className="w-6 h-6 text-slate-650 animate-spin mb-4" />
                  <div className="h-3 w-2/3 bg-slate-700/60 rounded" />
                </div>
              ))}
            </div>
          ) : (
            /* Cards rendering with full 3D flip illusion transition */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prompts.map((promptText, idx) => {
                const isFlipped = flippedCards[idx] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => handleCardFlip(idx)}
                    className="relative h-44 cursor-pointer group select-none touch-manipulation active:scale-[0.98] transition-all"
                    style={{ perspective: "1000px" }}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full duration-500 rounded-2xl border transition-colors shadow-sm"
                      style={{
                        transformStyle: "preserve-3d",
                        backgroundColor: isFlipped ? "#090d16" : "#1e293b",
                        borderColor: isFlipped ? "#4f46e5" : "#334155"
                      }}
                    >
                      {/* CARD FRONT: Hidden mystique label */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 group-hover:scale-110 duration-200 shadow-inner">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-300 mt-3 capitalize tracking-wide">
                          Thử thách #{idx + 1}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">Click để lật bài</p>
                      </div>

                      {/* CARD BACK: Question revealed */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center overflow-y-auto custom-scrollbar"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)"
                        }}
                      >
                        <p className="text-sm font-semibold text-slate-100 leading-relaxed pr-1">
                          {promptText}
                        </p>
                        <span className="text-[10px] text-indigo-400 font-extrabold tracking-widest uppercase mt-3 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded">
                          <Award className="w-3 h-3" /> ĐÚNG GIAI ĐIỆU
                        </span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trigger to reload custom list */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => generatePrompts()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Gợi ý thử thách khác
            </button>
          </div>
        </div>

        {/* AI custom prompt modifiers & Quick Penalty Generator draws */}
        <div className="lg:col-span-4 space-y-6">
          {/* Interactive AI customization setup */}
          <div className="bg-slate-800/20 border border-slate-700 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Cá nhân hoá thử thách AI
            </h4>

            {/* Custom Audience setup */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Đối tượng tham gia (audience)</label>
              <input
                type="text"
                value={audienceContext}
                onChange={(e) => setAudienceContext(e.target.value)}
                placeholder="Ví dụ: Lập trình viên, Phòng Sales, Nhóm Sinh Viên..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 transition"
              />
            </div>

            {/* Custom vibe filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Không khí / Mood mong muốn</label>
              <input
                type="text"
                value={customVibe}
                onChange={(e) => setCustomVibe(e.target.value)}
                placeholder="Ví dụ: Thâm sâu tinh tế, Lầy quằn quại, Nhẹ nhàng..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 transition"
              />
            </div>

            <button
              onClick={() => generatePrompts()}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition duration-200 select-none shadow-sm cursor-pointer"
            >
              CẬP NHẬT CÂU HỎI AI MỚI
            </button>
          </div>

          {/* Quick random penalty trigger cards for losers */}
          <div className="bg-gradient-to-br from-rose-950/20 to-slate-900 border border-rose-500/20 p-5 rounded-2xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                💔 Máy Bốc Hình Phạt Nhanh
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Người thua cuộc do quay vòng quay hoặc bốc hũ xui xẻo? Click vào súng búa tạ để chỉ định nhiệm vụ phạt bất ngờ!
              </p>
            </div>

            <AnimatePresence mode="wait">
              {penaltyText ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-950 border border-rose-500/10 p-4 rounded-xl text-center relative"
                >
                  <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                    {penaltyText}
                  </p>
                  <p className="text-[10px] text-rose-400 font-extrabold uppercase mt-2">
                    ⏱️ Thực hiện: {penaltyDuration}
                  </p>
                  
                  <button
                    onClick={handleCopyPenalty}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white transition"
                    title="Sao chép hình phạt"
                  >
                    {penaltyCopied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              onClick={drawQuickPenalty}
              disabled={isPenaltyLoading}
              className="w-full bg-rose-600/25 border border-rose-500/40 hover:bg-rose-600/35 text-rose-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isPenaltyLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                "🎯 BÁC THƯỢNG HÌNH PHẠT"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
