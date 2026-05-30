import React, { useState } from "react";
import { Users, AlertCircle, RefreshCw, Sparkles, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TeamResult } from "../types";

const THEME_OPTIONS = [
  { id: "funny_animals", label: "Ú xù tinh nghịch (Thú cưng tấu hài)" },
  { id: "tech_warriors", label: "Hacker Đột Phá (AI & Tech cực sành)" },
  { id: "super_heroes", label: "Vũ Trụ Siêu Anh Hùng (Thần thoại & Marvel)" },
  { id: "tasty_food", label: "Ẩm Thực Bách Vị (Lẩu bò, Trà sữa, Sầu riêng)" },
  { id: "boss_vibes", label: "Vibe Tổng Tài Công Sở (Duyệt chi, Deal lương)" }
];

interface TeamDividerProps {
  initialParticipants: string[];
}

export default function TeamDivider({ initialParticipants }: TeamDividerProps) {
  const [participantsText, setParticipantsText] = useState("");
  const [teamCount, setTeamCount] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState("funny_animals");
  const [customThemeText, setCustomThemeText] = useState("");
  const [isAIActive, setIsAIActive] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Initialize with initial state
  React.useEffect(() => {
    if (initialParticipants.length > 0) {
      setParticipantsText(initialParticipants.join("\n"));
    } else {
      const defaults = [
        "Hoài Anh", "Đức Long", "Sơn Tùng", "Hải Đăng", "Quỳnh Chi",
        "Gia Bảo", "Thuỳ Dương", "Ngọc Trinh", "Vũ Hoàng", "Khắc Tiệp",
        "Mai Phương", "Duy Mạnh"
      ];
      setParticipantsText(defaults.join("\n"));
    }
  }, [initialParticipants]);

  // Loading indicator messages for extreme Vietnamese corporate teambuilding vibes
  const funnyLoadingSteps = [
    "Đang kiểm tra danh sách... 📝",
    "Đang vận lộn xin ngân sách teambuilding từ Sếp... 💰",
    "Đang nhờ Gemini phân bổ linh khí cân bằng đại cục... ✨",
    "Đang kết bái anh em đào viên ngẫu nhiên... 🤝",
    "Đang nấu lẩu gà teambuilding trực tiếp... 🍲",
    "Sắp xong rồi! Cân đối lực lượng đỉnh cao..."
  ];

  const handleSplitTeams = async () => {
    const members = participantsText
      .split("\n")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (members.length < teamCount) {
      alert(`Số thành viên (${members.length}) không thể ít hơn số lượng đội chia (${teamCount})!`);
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setWarning(null);

    // Rotate loading messages
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < funnyLoadingSteps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      if (isAIActive) {
        // Find theme text
        const themeObj = THEME_OPTIONS.find(t => t.id === selectedTheme);
        const themeLabel = customThemeText.trim() || (themeObj ? themeObj.label : "Thành viên độc đắc");

        const response = await fetch("/api/gemini/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members,
            teamCount,
            theme: themeLabel,
            mood: "Hài hước, vui tươi, vần điệu"
          })
        });

        const data = await response.json();
        if (response.ok && data.teams) {
          setTeams(data.teams);
          if (data.warning) setWarning(data.warning);
        } else {
          throw new Error(data.error || "Gặp lỗi khi hỏi ý kiến AI.");
        }
      } else {
        // Local classic random splitter fallback
        const shuffled = [...members].sort(() => Math.random() - 0.5);
        const result: TeamResult[] = Array.from({ length: teamCount }, (_, i) => ({
          teamName: `Đội ${i + 1}`,
          slogan: "Làm hết sức, chơi hết mình!",
          emoji: "🏆",
          members: []
        }));

        shuffled.forEach((m, idx) => {
          result[idx % teamCount].members.push(m);
        });
        setTeams(result);
      }
    } catch (err: any) {
      console.warn("Lỗi AI chia đội. Chuyển sang chia đội ngẫu nhiên cục bộ:", err);
      setWarning("AI tạm thời bận. Đã tự động chia đội bằng thuật toán nguyên bản.");
      
      // Perform manual fallback immediately
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      const fallbackThemes = [
        { name: "Sư Tử Lửa", slogan: "Lướt trên bão lửa 🦁", emoji: "🦁" },
        { name: "Cá Mập Vĩ Đại", slogan: "Cắn cắp mọi cơ hội 🦈", emoji: "🦈" },
        { name: "Phượng Hoàng", slogan: "Tái sinh rực rỡ ✨", emoji: "✨" },
        { name: "Đại Bàng Sấm", slogan: "Tìm kiếm đỉnh cao 🦅", emoji: "🦅" },
        { name: "Gấu Hoang", slogan: "Bền bỉ can trường 🐻", emoji: "🐻" },
        { name: "Khủng Long Tinh Nghịch", slogan: "Quẩy tung bãi tiệc 🦖", emoji: "🦖" }
      ];

      const result: TeamResult[] = Array.from({ length: teamCount }, (_, i) => {
        const theme = fallbackThemes[i % fallbackThemes.length];
        return {
          teamName: `${theme.name} ${i + 1}`,
          slogan: theme.slogan,
          emoji: theme.emoji,
          members: []
        };
      });

      shuffled.forEach((m, idx) => {
        result[idx % teamCount].members.push(m);
      });
      setTeams(result);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleCopyTeamsResult = () => {
    if (teams.length === 0) return;
    const textToCopy = teams
      .map(
        t => `${t.emoji} ${t.teamName.toUpperCase()} - Khẩu hiệu: "${t.slogan}"\nThành viên (${t.members.length}): ${t.members.join(", ")}`
      )
      .join("\n\n---\n\n");
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 bg-slate-800/20 border border-slate-700/80 p-5 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Thiết Lập Chia Đội
        </h3>

        {/* Members Roster Editor */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Danh sách tham gia</label>
          <textarea
            value={participantsText}
            onChange={(e) => setParticipantsText(e.target.value)}
            className="w-full h-[180px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition custom-scrollbar font-mono leading-relaxed"
            placeholder="Nguyen Van A&#10;Tran Thi B..."
          />
        </div>

        {/* Team quantity selectors */}
        <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/40">
          <label className="text-xs font-semibold text-slate-400 flex justify-between items-center">
            <span>Số lượng đội cần chia</span>
            <span className="text-indigo-400 font-extrabold text-sm px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">{teamCount} ĐÔI</span>
          </label>
          
          {/* Stepper controls for fingers - touch size friendly */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setTeamCount(prev => Math.max(2, prev - 1))}
              disabled={teamCount <= 2}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-lg font-black text-slate-200 flex items-center justify-center transition active:scale-95 touch-manipulation cursor-pointer"
            >
              －
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={2}
                max={8}
                value={teamCount}
                onChange={(e) => setTeamCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setTeamCount(prev => Math.min(8, prev + 1))}
              disabled={teamCount >= 8}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-lg font-black text-slate-200 flex items-center justify-center transition active:scale-95 touch-manipulation cursor-pointer"
            >
              ＋
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setTeamCount(num)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex-1 text-center touch-manipulation border cursor-pointer ${
                  teamCount === num
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700"
                }`}
              >
                {num} Đội
              </button>
            ))}
          </div>
        </div>

        {/* AI Activation Configs */}
        <div className="border-t border-slate-700/60 pt-4.5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Dùng AI đặt tên & slogan
              </span>
              <span className="text-[10px] text-slate-400">Sử dụng Gemini sinh khẩu hiệu, tên siêu bựa</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAIActive}
                onChange={(e) => setIsAIActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <AnimatePresence>
            {isAIActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2.5"
              >
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Chủ đề tên nhóm gợi ý</label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => {
                      setSelectedTheme(e.target.value);
                      if (e.target.value !== "custom") setCustomThemeText("");
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400.transition"
                  >
                    {THEME_OPTIONS.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.label}</option>
                    ))}
                    <option value="custom">✍️ Tự nhập chủ đề riêng...</option>
                  </select>
                </div>

                {selectedTheme === "custom" && (
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Mô tả chủ đề tự chọn của bạn</label>
                    <input
                      type="text"
                      value={customThemeText}
                      onChange={(e) => setCustomThemeText(e.target.value)}
                      placeholder="Ví dụ: Đại chiến hải tặc vương luffy"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-450 transition"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSplitTeams}
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition duration-200 shadow-md cursor-pointer"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          {isLoading ? "ĐANG CHIA ĐỘI DỄ THƯƠNG..." : "XÁO ĐỘI & CHIA NGAY"}
        </button>
      </div>

      {/* Roster Output results */}
      <div className="lg:col-span-8 space-y-5">
        {/* Loading display state */}
        {isLoading && (
          <div className="bg-slate-800/10 border border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-6"
            />
            <p className="text-base font-bold text-indigo-400 animate-pulse">{funnyLoadingSteps[loadingStep]}</p>
            <p className="text-xs text-slate-500 mt-2">Đang sử dụng hệ thống phân chia ngẫu nhiên thông thái</p>
          </div>
        )}

        {/* Display split blocks results */}
        {!isLoading && teams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-white text-base">Kết Quả Chia Đội</h4>
                <p className="text-xs text-slate-400">Tối ưu hóa ngẫu nhiên công bằng</p>
              </div>

              <button
                onClick={handleCopyTeamsResult}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-755 border border-slate-700/60 rounded-xl transition"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "Đã sao chép!" : "Sao chép toàn bộ"}
              </button>
            </div>

            {warning && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Tin nhắn quản trò:</span> {warning}
                </div>
              </div>
            )}

            {/* Grid of teams cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-slate-900/60 border border-slate-700 hover:border-slate-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Header: Title info */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl" role="img" aria-label="team emoji">
                        {team.emoji || "🏆"}
                      </span>
                      <div>
                        <h5 className="font-black text-rose-300 text-base leading-tight break-words pr-4">{team.teamName}</h5>
                        <p className="text-[10px] text-slate-400">Chiến mã #{idx + 1}</p>
                      </div>
                    </div>

                    {/* Slogan details */}
                    <div className="bg-slate-850/60 border-l-2 border-indigo-500 pl-3 py-1.5 mb-4 rounded-r-md">
                      <p className="text-xs italic text-indigo-200">
                        "{team.slogan || "Làm hết mình, quẩy cực đỉnh!"}"
                      </p>
                    </div>

                    {/* Team participant members labels */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        Thành viên ({team.members.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map((member, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-xs bg-slate-800 border border-slate-750 text-slate-300 py-1 px-2.5 rounded-lg"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Empty warning helper */}
                  {team.members.length === 0 && (
                    <p className="text-xs italic text-slate-600 mt-2">Chưa phân phối được thành viên</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty status display info onboarding */}
        {!isLoading && teams.length === 0 && (
          <div className="bg-slate-800/10 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-white font-bold text-sm mb-1.5">Sẵn Sàng Chia Đội Teambuilding</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-400 mb-4">
              Nhập danh sách đồng đội ở bên trái, thiết lập số lượng đội mong muốn, sau đó click nút hành động để xáo trộn siêu công bằng!
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-400 bg-indigo-500/5 py-1.5 px-3.5 rounded-full w-fit mx-auto border border-indigo-500/10">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Khuyên dùng: Bật AI để được tạo tên đội độc và các câu slogan bựa đỉnh phong!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
