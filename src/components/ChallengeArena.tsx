import React, { useState } from "react";
import { RefreshCw, Eye, EyeOff, ShieldAlert, Award, Copy, Check, SmilePlus, HelpCircle } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  
  const [prompts, setPrompts] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [warning, setWarning] = useState<string | null>(null);

  // Bonus physical penalty generator items
  const [isPenaltyLoading, setIsPenaltyLoading] = useState(false);
  const [penaltyText, setPenaltyText] = useState<string | null>(null);
  const [penaltyDuration, setPenaltyDuration] = useState("");
  const [penaltyCopied, setPenaltyCopied] = useState(false);

  // Load history from local storage
  React.useEffect(() => {
    try {
      const cachedPrompts = localStorage.getItem("challenge_prompts");
      const cachedFlipped = localStorage.getItem("challenge_flipped");
      const cachedActive = localStorage.getItem("challenge_active");
      const cachedPenalty = localStorage.getItem("challenge_penalty");
      if (cachedPrompts) setPrompts(JSON.parse(cachedPrompts));
      if (cachedFlipped) setFlippedCards(JSON.parse(cachedFlipped));
      if (cachedActive) setActiveCategory(cachedActive as "truth" | "dare" | "icebreaker");
      if (cachedPenalty) setPenaltyText(cachedPenalty);
    } catch (e) {}
  }, []);

  const saveState = (newPrompts: string[], newFlipped: Record<number, boolean>, newCategory: string, newPenalty: string | null) => {
    localStorage.setItem("challenge_prompts", JSON.stringify(newPrompts));
    localStorage.setItem("challenge_flipped", JSON.stringify(newFlipped));
    localStorage.setItem("challenge_active", newCategory);
    if (newPenalty) {
      localStorage.setItem("challenge_penalty", newPenalty);
    } else {
      localStorage.removeItem("challenge_penalty");
    }
  };

  const clearHistory = () => {
    setPrompts([]);
    setFlippedCards({});
    setPenaltyText(null);
    localStorage.removeItem("challenge_prompts");
    localStorage.removeItem("challenge_flipped");
    localStorage.removeItem("challenge_penalty");
    localStorage.removeItem("challenge_active");
  };

  // Generate prompts
  const generatePrompts = async (catId = activeCategory) => {
    setIsLoading(true);
    setFlippedCards({});
    setWarning(null);

    setTimeout(() => {
      // Traditional offline list fallback triggers
      const fallbacks: Record<string, string[]> = {
        truth: [
          "Bí mật lớn nhất bạn đang giấu người đồng nghiệp ngay bên trái là gì?",
          "Nếu được thay thế Sếp trong 1 buổi sáng, việc đầu tiên bạn sướng nhất là làm gì?",
          "Kể tên 1 thói quen bầy hầy kì lạ nhất của bạn ở nhà mà không ai hay biết!",
          "Bạn đã bao giờ ngủ gật trong giờ làm việc hay cuộc thảo luận trực tuyến chưa?",
          "Điều gì tại công ty khiến bạn cảm thấy mắc cười nhất mỗi khi nhớ tới?",
          "Ai trong nhóm này là người bạn cảm giác đáng tin nhất khi cần mượn tiền?",
          "Bạn đã từng nói dối sếp để xin nghỉ phép chưa? Và lý do là gì?",
          "Nếu phải chọn một người trong phòng để đi dạt vào hoang đảo, bạn chọn ai và tại sao?",
          "Có bao giờ bạn 'tình cờ' nghe được một bí mật động trời của công ty chưa?",
          "Món đồ đắt tiền nhất bạn từng ấn mua trong lúc căng thẳng công việc là gì?",
          "Kể tên một người bạn từng crush ngầm trong công ty (không tính người đã có gia đình)!",
          "Bạn thấy điểm yếu lớn nhất của bản thân trong công việc hiện tại là gì?",
          "Bạn đã từng khóc vì áp lực công việc bao giờ chưa? Lúc nào?"
        ],
        dare: [
          "Nhảy múa vui nhộn hoặc múa lân không nhạc tại chỗ trong vòng 20 giây!",
          "Vỗ ngực hô to câu: 'Tôi vô địch thiên hà, tôi là ngôi sao teambuilding!' 3 lần liên tiếp!",
          "Nhắn tin cảm ơn chân thành đến một thành viên không có mặt trong phòng vì lý do bá đạo!",
          "Dùng vai vẽ lại một hình vuông, hình tròn đồng thời trong 15 giây!",
          "Tự sướng 1 cú ảnh xấu dã man bằng điện thoại rồi gửi thẳng vào nhóm chat chung!",
          "Líu lưỡi rực rỡ nói nhanh: 'Nồi đồng nấu ốc nồi đất nấu ếch' thật nhanh 3 lần liên tiếp!",
          "Tỏ tềnh một cách sến súa với cái ghế bạn đang ngồi!",
          "Đội một chiếc thùng carton hoặc áo khoác trùm đầu và đi vòng quanh phòng làm điệu bộ phi hành gia!",
          "Thực hiện plank hoặc chống đẩy 10 cái ngay tại chỗ!",
          "Cầm chai nước giả làm míc và cover một đoạn rap thật phiêu!",
          "Nói tiếng ngoài hành tinh (tự chế) với người đối diện trong 1 phút không được cười!",
          "Đổi ảnh avatar điện thoại hoặc máy tính thành hình một con vật hài hước trong 24h!"
        ],
        icebreaker: [
          "Nếu cả nhóm lạc lên sao Hỏa và chỉ mang theo 1 vật phẩm văn phòng dã man, bạn mang gì?",
          "Món trà sữa hay loại sinh tố khoái khẩu nhất giúp bạn giải cứu áp lực là gì?",
          "Nếu được tuyển chọn sếp mới từ các loài động vật hoạt hình, loài nào sẽ cai trị bạn?",
          "Kể về chuyến đi phượt hoặc kì nghỉ tấu hài nhất cùng đám bạn thân!",
          "Mẹo làm việc năng xuất nhất mà bạn tự thấy hãnh diện mà chưa chia sẻ cho ai?",
          "Nếu bạn bất ngờ trúng giải đặc biệt xổ số Vietlott, ai trong phòng này bạn chiêu đãi đầu tiên?",
          "Năng lực siêu nhiên nào bạn muốn sở hữu nhất để áp dụng vào công việc?",
          "Kỉ niệm ngày đầu tiên bạn bước chân vào công ty là như thế nào?",
          "Giữa việc được tăng 50% lương nhưng làm việc với người bạn ghét, và giữ nguyên lương nhưng làm với idol, bạn chọn gì?",
          "Một bài hát luôn nằm trong danh sách phát 'chữa lành' của bạn?",
          "Nơi nào là 'thánh địa' để bạn chốn vào suy ngẫm trong văn phòng?",
          "Bạn thích làm việc 4 ngày/tuần mỗi ngày 10 tiếng, hay 5 ngày mỗi ngày 8 tiếng?"
        ]
      };
      
      const catList = fallbacks[catId] || fallbacks.truth;
      // pick 6 random distinct items
      const p = [...catList].sort(() => 0.5 - Math.random()).slice(0, 6);
      
      setPrompts(p);
      saveState(p, {}, catId, penaltyText);
      setIsLoading(false);
    }, 600);
  };

  // Run on mount only if there's no cached data
  React.useEffect(() => {
    if (prompts.length === 0 && !localStorage.getItem("challenge_prompts")) {
      generatePrompts();
    }
  }, []);

  const handleCategorySwitch = (catId: "truth" | "dare" | "icebreaker") => {
    setActiveCategory(catId);
    generatePrompts(catId);
  };

  const handleCardFlip = (idx: number) => {
    setFlippedCards(prev => {
      const next = {
        ...prev,
        [idx]: !prev[idx]
      };
      saveState(prompts, next, activeCategory, penaltyText);
      return next;
    });
  };

  const drawQuickPenalty = async () => {
    setIsPenaltyLoading(true);
    setPenaltyText(null);
    setPenaltyDuration("");

    setTimeout(() => {
      const fallbacks = [
        "Bắt chước âm thanh tiếng sủa của chó con đáng yêu trong 15 giây!",
        "Làm động tác nhảy lò cò xung quanh phòng khách 2 vòng!",
        "Hát tặng cả đội một bài hát ca ngợi quê hương đất nước!",
        "Chịu phạt uống một ngụm nước lọc thật đầy miệng rồi cố gượng giữ im lặng 30 giây!",
        "Đứng thăng bằng một chân, hai tay giang rộng làm hình chim bay 1 phút!",
        "Vẽ chân dung bằng bút dạ trên giấy người bên cạnh trong 30 giây mắt nhắm nghiền!",
        "Nhảy lò cò một chân và đọc bảng cửu chương 7!",
        "Phải gọi người đối diện là 'Đại Vương' trong suốt 1 tiếng tiếp theo!",
        "Đội một cuốn sách lên đầu và đi catwalk qua lại 3 lần không rớt!",
        "Thụt dầu (Squat) 15 cái liên tục cùng với một nụ cười rạng rỡ!"
      ];
      const p = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setPenaltyText(p);
      setPenaltyDuration("ngay lập tức");
      saveState(prompts, flippedCards, activeCategory, p);
      setIsPenaltyLoading(false);
    }, 400);
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Chọn thể loại bốc thăm, lật thẻ bài để kích hoạt</p>
            {Object.keys(flippedCards).length > 0 && (
              <button onClick={clearHistory} className="ml-4 text-[10px] text-red-400 hover:text-red-300 transition">Xóa lịch sử</button>
            )}
          </div>
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

        {/* Quick Penalty Generator draws */}
        <div className="lg:col-span-4 space-y-6">
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
