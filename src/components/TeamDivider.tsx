import React, { useState } from "react";
import { Users, AlertCircle, RefreshCw, Copy, Check, Info } from "lucide-react";
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
  const [useCustomNames, setUseCustomNames] = useState(false);
  const [customNamesText, setCustomNamesText] = useState("Đội 1\nĐội 2");
  const [pickCaptain, setPickCaptain] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [history, setHistory] = useState<{ id: string; date: string; teams: TeamResult[] }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Initialize with initial state and local storage history
  React.useEffect(() => {
    const cachedHistory = localStorage.getItem("team_history");
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) {}
    }

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

  const handleUpdateTeams = (result: TeamResult[]) => {
    setTeams(result);
    setHistory(prev => {
      const newHistory = [
        { id: Date.now().toString(), date: new Date().toLocaleString("vi-VN"), teams: result },
        ...prev.slice(0, 9)
      ];
      localStorage.setItem("team_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("team_history");
    setShowHistory(false);
  };

  const handleSplitTeams = async () => {
    const members = participantsText
      .split("\n")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (members.length === 0) {
      setWarning("Vui lòng nhập danh sách tham gia trước khi chia đội!");
      return;
    }

    if (members.length < teamCount) {
      setWarning(`Số thành viên (${members.length}) không đủ để chia làm ${teamCount} đội! Cần ít nhất 1 thành viên cho mỗi đội.`);
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setWarning(null);

    // Rotate loading messages
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < funnyLoadingSteps.length - 1 ? prev + 1 : prev));
    }, 700);

    setTimeout(() => {
      try {
        const shuffled = [...members].sort(() => Math.random() - 0.5);
        const fallbackThemes = [
          { name: "Sư Tử Lửa", slogan: "Lướt trên bão lửa 🦁", emoji: "🦁" },
          { name: "Cá Mập Vĩ Đại", slogan: "Cắn cắp mọi cơ hội 🦈", emoji: "🦈" },
          { name: "Phượng Hoàng", slogan: "Tái sinh rực rỡ ✨", emoji: "✨" },
          { name: "Đại Bàng Sấm", slogan: "Tìm kiếm đỉnh cao 🦅", emoji: "🦅" },
          { name: "Gấu Hoang", slogan: "Bền bỉ can trường 🐻", emoji: "🐻" },
          { name: "Khủng Long Tinh Nghịch", slogan: "Quẩy tung bãi tiệc 🦖", emoji: "🦖" },
          { name: "Soái Ca Trỗi Dậy", slogan: "Vẻ đẹp đè bẹp tất cả 😎", emoji: "😎" },
          { name: "Bóng Đêm Săn Mồi", slogan: "Ẩn mình đón chờ thời cơ 🐺", emoji: "🐺" },
          { name: "Mãnh Hổ Khởi Nguyên", slogan: "Gầm vang rừng xanh 🐯", emoji: "🐯" },
          { name: "Khỉ Đột Tăng Động", slogan: "Quẩy nát muôn nơi 🦧", emoji: "🦧" },
          { name: "Biệt Đội Chuối Tây", slogan: "Vàng tươi roi rói 🍌", emoji: "🍌" },
          { name: "Tia Chớp Nhanh Chứa", slogan: "Tốc biến trong chớp mắt ⚡", emoji: "⚡" },
        ];

        // Shuffle themes
        const shuffledThemes = [...fallbackThemes].sort(() => Math.random() - 0.5);
        
        const parsedCustomNames = customNamesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);

        const result: TeamResult[] = Array.from({ length: teamCount }, (_, i) => {
          if (useCustomNames && parsedCustomNames.length > 0) {
            const nameToUse = parsedCustomNames[i] || `${parsedCustomNames[i % parsedCustomNames.length]} ${Math.floor(i / parsedCustomNames.length) + 1}`;
            return {
              teamName: nameToUse,
              slogan: "Làm hết sức, chiến hết mình!",
              emoji: "🎯",
              members: [],
              captain: null
            };
          } else {
            const theme = shuffledThemes[i % shuffledThemes.length];
            return {
              teamName: `${theme.name} ${i + 1}`,
              slogan: theme.slogan,
              emoji: theme.emoji,
              members: [],
              captain: null
            };
          }
        });

        shuffled.forEach((m, idx) => {
          result[idx % teamCount].members.push(m);
        });

        if (pickCaptain) {
          result.forEach(team => {
            if (team.members.length > 0) {
              const captainIdx = Math.floor(Math.random() * team.members.length);
              team.captain = team.members[captainIdx];
            }
          });
        }

        handleUpdateTeams(result);
      } catch (err: any) {
        console.warn("Lỗi chia đội:", err);
      } finally {
        clearInterval(stepInterval);
        setIsLoading(false);
      }
    }, 1200); // Simulate some thought time
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
        <h3 className="text-sm font-bold text-slate-300 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Thiết Lập Chia Đội
          </div>
          {history.length > 0 && (
            <button 
              onClick={() => setShowHistory(true)}
              className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md transition font-bold"
            >
              Lịch Sử ({history.length})
            </button>
          )}
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
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setTeamCount(prev => Math.max(2, prev - 1))}
              disabled={teamCount <= 2}
              className="w-12 h-12 bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-lg font-black text-slate-200 flex items-center justify-center transition active:scale-95 touch-manipulation cursor-pointer"
            >
              －
            </button>
            <input
              type="number"
              min={2}
              max={200}
              value={teamCount}
              onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)}
              className="w-20 h-12 bg-slate-900 border border-slate-700 rounded-xl text-center font-bold text-lg text-white focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setTeamCount(prev => Math.min(200, prev + 1))}
              disabled={teamCount >= 200}
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

        {/* Advanced Output Settings */}
        <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={useCustomNames}
                onChange={(e) => setUseCustomNames(e.target.checked)}
                className="w-3.5 h-3.5 bg-slate-800 border-slate-700 rounded text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs font-semibold text-slate-300">Sử dụng tên đội tuỳ chỉnh</span>
            </label>
            <AnimatePresence>
              {useCustomNames && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={customNamesText}
                    onChange={(e) => setCustomNamesText(e.target.value)}
                    placeholder="Nhập tên đội (mỗi dòng một tên)"
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition min-h-[80px]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Mỗi dòng một tên. Nếu số đội nhiều hơn số tên, tên sẽ tự động lặp lại kèm theo số (VD: Đội 1 2).</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pickCaptain}
                onChange={(e) => setPickCaptain(e.target.checked)}
                className="w-3.5 h-3.5 bg-slate-800 border-slate-700 rounded text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs font-semibold text-slate-300">Chọn đội trưởng ngẫu nhiên</span>
            </label>
          </div>
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
                        {team.members.map((member, mIdx) => {
                          const isCaptain = team.captain === member;
                          return (
                            <span
                              key={mIdx}
                              className={`text-xs py-1 px-2.5 rounded-lg border flex items-center gap-1 ${
                                isCaptain 
                                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-bold" 
                                  : "bg-slate-800 border-slate-750 text-slate-300"
                              }`}
                            >
                              {isCaptain && <span className="text-sm leading-none" title="Đội Trưởng">👑</span>}
                              {member}
                            </span>
                          );
                        })}
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
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl flex flex-col w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden relative"
            >
              <div className="p-4 sm:p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/40">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Lịch Sử Chia Đội
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition"
                  >
                    Xoá Lịch Sử
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
                {history.map((item, idx) => (
                  <div key={item.id} className="bg-slate-850 border border-slate-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-400 font-mono">Lần {history.length - idx}</span>
                      <span className="text-[10px] text-slate-500">{item.date}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {item.teams.map((t, i) => (
                        <div key={i} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                          <p className="text-xs font-bold text-white mb-1">{t.emoji} {t.teamName}</p>
                          <p className="text-[10px] text-slate-500 italic mb-2">"{t.slogan}"</p>
                          <div className="flex flex-wrap gap-1">
                            {t.members.map((m, mIdx) => {
                              const isCaptain = t.captain === m;
                              return (
                                <span 
                                  key={mIdx} 
                                  className={`text-[9px] px-1.5 py-0.5 rounded leading-tight flex items-center gap-0.5 ${
                                    isCaptain ? "bg-indigo-500/20 text-indigo-300 font-bold" : "bg-slate-800 text-slate-300"
                                  }`}
                                >
                                  {isCaptain && <span>👑</span>}
                                  {m}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-right">
                       <button
                        onClick={() => {
                          setTeams(item.teams);
                          setShowHistory(false);
                        }}
                        className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded border border-indigo-500/20 transition font-bold"
                      >
                        Mở Lại Kết Quả Này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
