/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Dices, 
  HelpCircle, 
  Users, 
  Sparkles, 
  FolderPlus, 
  Compass, 
  Edit3, 
  UserPlus, 
  Trash2, 
  Play, 
  RefreshCcw,
  Sparkle,
  Upload,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GameMode } from "./types";

// Import custom game components
import LuckyWheel from "./components/LuckyWheel";
import LuckyJar from "./components/LuckyJar";
import TeamDivider from "./components/TeamDivider";
import ChallengeArena from "./components/ChallengeArena";

// Mock preset rosters for easy Vietnamese-themed teambuilding deployment
const ROSTER_PRESETS: Record<string, string[]> = {
  office: [
    "Sếp Tổng (Director)", "P. Nhân sự (HR)", "Cậu Vàng Dev", 
    "Chị Cả Kế Toán", "Sơn Tùng M-Designer", "Tuấn Anh Sales Trưởng", 
    "Em út Marketing", "Anh Linh System Admin", "Chị Thảo Admin", 
    "Bảo vệ vui tính", "Thực tập sinh Sáng Tạo", "Hải Đăng Dev"
  ],
  friends: [
    "Gia Bảo", "Thuỳ Dương", "Minh Triết", "Ngọc Trinh", "Khánh Vy", 
    "Thế Lực", "Hồng Ngọc", "Trọng Nhân", "Ánh Tuyết", "Hoàng Long"
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<GameMode>("wheel");
  const [participants, setParticipants] = useState<string[]>([]);
  const [newMember, setNewMember] = useState("");
  const [showRosterManager, setShowRosterManager] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [showImportExamples, setShowImportExamples] = useState(false);
  const [showNumberPrompt, setShowNumberPrompt] = useState(false);
  const [numberN, setNumberN] = useState("50");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load participants from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("workspace_roster_data");
    if (cached) {
      try {
        setParticipants(JSON.parse(cached));
      } catch (e) {
        // Fallback default
        setParticipants(ROSTER_PRESETS.office);
      }
    } else {
      setParticipants(ROSTER_PRESETS.office);
    }
  }, []);

  // Save changes to localStorage
  const saveRoster = (newList: string[]) => {
    setParticipants(newList);
    localStorage.setItem("workspace_roster_data", JSON.stringify(newList));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim()) return;
    if (participants.includes(newMember.trim())) {
      alert("Tên này đã tồn tại trong danh sách!");
      return;
    }
    const updated = [...participants, newMember.trim()];
    saveRoster(updated);
    setNewMember("");
  };

  const handleRemoveMember = (idx: number) => {
    const updated = participants.filter((_, i) => i !== idx);
    saveRoster(updated);
  };

  const loadPreset = (key: keyof typeof ROSTER_PRESETS) => {
    saveRoster(ROSTER_PRESETS[key]);
  };

  const handleLoadNumberPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(numberN);
    if (isNaN(n) || n < 1) {
      alert("Vui lòng nhập một số hợp lệ lớn hơn 0");
      return;
    }
    const list = Array.from({ length: n }, (_, i) => (i + 1).toString());
    saveRoster(list);
    setShowNumberPrompt(false);
  };

  const importFromText = (text: string, source: string) => {
    try {
      let imported: string[] = [];
      
      // Attempt JSON parse
      if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            imported = parsed.map(item => {
              if (typeof item === "string") return item;
              if (typeof item === "object" && item !== null) {
                return item.name || item.title || item.username || item.fullName || Object.values(item)[0] || "";
              }
              return String(item);
            });
          } else if (typeof parsed === "object" && parsed !== null) {
            const arrays = Object.values(parsed).filter(v => Array.isArray(v));
            if (arrays.length > 0) {
              imported = (arrays[0] as any[]).map(item => typeof item === "string" ? item : (item.name || ""));
            }
          }
        } catch (e) {
          // fallback to standard text splitting if JSON parse fails
        }
      }

      // If not JSON or empty JSON result, split by comma/newline
      if (imported.length === 0) {
        imported = text.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
      }

      // Clean and deduplicate
      imported = imported.filter(s => typeof s === "string" && s.trim().length > 0).map(s => s.trim());
      const existingSet = new Set(participants);
      const newItems = imported.filter(i => !existingSet.has(i));
      
      if (newItems.length > 0) {
        saveRoster([...participants, ...newItems]);
        alert(`Đã nhập thành công ${newItems.length} người từ ${source}.`);
      } else {
        alert(`Không tìm thấy tên mới nào hoặc tất cả đã có trong danh sách từ ${source}.`);
      }
    } catch (e) {
      console.error("Import error:", e);
      alert("Có lỗi khi xử lý dữ liệu.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        importFromText(text, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setIsImportingUrl(true);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const text = await res.text();
      importFromText(text, "URL");
      setImportUrl("");
    } catch (e: any) {
      alert("Lỗi khi tải từ URL: " + e.message);
    } finally {
      setIsImportingUrl(false);
    }
  };

  const clearRoster = () => {
    if (window.confirm("Bạn có chắc chắn muốn xoá sạch danh sách tham gia không?")) {
      saveRoster([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden p-3 md:p-6 lg:p-8 flex flex-col justify-between">
      {/* Visual neon glowing decorative particles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Core Application Wrapper */}
      <div className="max-w-7xl mx-auto w-full space-y-8 z-10">
        
        {/* Header Block Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 ring-1 ring-white/10">
              <Dices className="w-8 h-8 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                NHÀ MÁY TRÒ CHƠI NGẪU NHIÊN
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  AI Powered
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Bốc thăm may mắn, quay vòng ngẫu hứu, rã đội thông thái và lật thẻ thử thách mặn mà cho các sự kiện teambuilding.
              </p>
            </div>
          </div>

          {/* Collapsible Global Roster Button */}
          <button
            onClick={() => setShowRosterManager(!showRosterManager)}
            className="flex items-center gap-2 px-4.5 py-3.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-slate-600 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            {showRosterManager ? "Ẩn danh sách tham gia 👥" : "Sửa danh sách tham gia (👥 " + participants.length + ")"}
          </button>
        </header>

        {/* Global Roster Drawer Manager */}
        <AnimatePresence>
          {showRosterManager && (
            <motion.div
              initial={{ opacity: 0, y: -15, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -15, height: 0 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 overflow-hidden shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Custom list controls */}
                <div className="md:col-span-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Cấu hình danh sách chung</h3>
                    <p className="text-[11px] text-slate-400">Tự động liên kết và cập nhật toàn phòng ban vào vòng quay, chia đội và rút hũ.</p>
                  </div>

                  <form onSubmit={handleAddMember} className="flex gap-2">
                    <input
                      type="text"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      placeholder="Tên người tham gia mới..."
                      className="flex-1 bg-slate-950 border border-slate-750 focus:border-indigo-500 px-4 py-2 text-xs text-white rounded-xl focus:outline-none transition placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-md flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-400 block">Nạp dữ liệu từ bên ngoài (CSV, JSON, Txt)</label>
                      <button 
                        type="button" 
                        onClick={() => setShowImportExamples(!showImportExamples)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        {showImportExamples ? "Ẩn ví dụ" : "Xem ví dụ"}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showImportExamples && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[10px] sm:text-xs text-slate-400 space-y-3 mb-3 font-mono">
                            <div>
                              <p className="text-emerald-400 font-bold mb-1">Ví dụ 1: JSON (Mảng hoặc Danh sách đối tượng)</p>
                              <code className="block bg-slate-900 border border-slate-800 p-2 rounded text-slate-300">
                                ["Nguyen Van A", "Tran Thi B"]<br/><br/>
                                <span className="text-slate-500">// Hoặc</span><br/>
                                [&#123;"name": "Nguyen Van A"&#125;, &#123;"name": "Tran Thi B"&#125;]
                              </code>
                            </div>
                            <div>
                              <p className="text-amber-400 font-bold mb-1">Ví dụ 2: Dạng văn bản (.txt) hoặc CSV (.csv)</p>
                              <code className="block bg-slate-900 border border-slate-800 p-2 rounded text-slate-300">
                                Nguyen Van A, Tran Thi B, Le Van C<br/><br/>
                                <span className="text-slate-500">// Hoặc mỗi tên một dòng:</span><br/>
                                Nguyen Van A<br/>
                                Tran Thi B
                              </code>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-2">
                      {/* Form inputs... */}
                      <input 
                        type="file" 
                        accept=".csv,.json,.txt" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="file-upload" 
                      />
                      <label 
                        htmlFor="file-upload"
                        className="py-2.5 px-3 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-emerald-400" />
                        Tải lên tệp danh sách
                      </label>
                      
                      <form onSubmit={handleUrlImport} className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="url"
                            value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="Nhập đường link URL (Raw JSON, CSV...)"
                            className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 pl-9 pr-3 py-2 text-xs text-white rounded-xl focus:outline-none transition placeholder-slate-600"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isImportingUrl || !importUrl.trim()}
                          className="px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 text-white rounded-xl transition border border-slate-700 flex items-center justify-center min-w-[40px]"
                          title="Tải từ URL"
                        >
                          {isImportingUrl ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Upload className="w-4 h-4 text-indigo-400" />}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <label className="text-[11px] font-semibold text-slate-400 block">Nạp nhanh danh sách mẫu</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loadPreset("office")}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg flex-1 border border-slate-700 transition min-w-[120px]"
                      >
                        Văn phòng năng động (12 người)
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPreset("friends")}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg flex-1 border border-slate-700 transition min-w-[120px]"
                      >
                        Hội bạn thân thiết (10 người)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNumberPrompt(true)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg flex-1 border border-slate-700 transition min-w-[120px]"
                      >
                        Số thứ tự (1 đến N)
                      </button>
                    </div>
                  </div>

                  {participants.length > 0 && (
                    <button
                      type="button"
                      onClick={clearRoster}
                      className="text-[10px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xoá sạch danh sách tham gia
                    </button>
                  )}
                </div>

                {/* Scroller layout for member list items */}
                <div className="md:col-span-7 bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2.5">
                    Danh sách hiện có ({participants.length} người)
                  </span>
                  
                  {participants.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Không có ai trong danh sách. Hãy bật mẫu sẵn hoặc thêm người dùng để bắt đầu!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                      {participants.map((name, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 py-1 px-3 bg-slate-900 hover:bg-slate-850/80 rounded-lg text-xs font-semibold text-slate-200 border border-slate-800 hover:border-slate-700 transition shadow-sm"
                        >
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-slate-500 hover:text-red-400 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Navigation hubs */}
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-900/40 p-2 border border-slate-800 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("wheel")}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation border ${
              activeTab === "wheel"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md active:scale-95"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">Vòng Quay May Mắn</span>
            <span className="xs:hidden">Vòng Quay</span>
          </button>

          <button
            onClick={() => setActiveTab("jar")}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation border ${
              activeTab === "jar"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md active:scale-95"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Sparkle className="w-4 h-4 text-emerald-400" />
            <span className="hidden xs:inline">Hũ Bốc Thăm Vàng</span>
            <span className="xs:hidden">Hũ Bốc Thăm</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation border ${
              activeTab === "teams"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md active:scale-95"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="hidden xs:inline">Chia Đội Đồng Đội</span>
            <span className="xs:hidden">Chia Đội</span>
          </button>

          <button
            onClick={() => setActiveTab("challenges")}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation border ${
              activeTab === "challenges"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md active:scale-95"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-rose-400" />
            <span className="hidden xs:inline">Đại Chiến Thử Thách</span>
            <span className="xs:hidden">Thử Thách</span>
          </button>
        </nav>

        {/* Modular Workspace Area dynamic swap view container with motion animations */}
        <main className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "wheel" && <LuckyWheel initialParticipants={participants} />}
              {activeTab === "jar" && <LuckyJar initialParticipants={participants} />}
              {activeTab === "teams" && <TeamDivider initialParticipants={participants} />}
              {activeTab === "challenges" && <ChallengeArena />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Aesthetic Footer pairing */}
      <footer className="mt-16 text-center border-t border-slate-800/50 pt-6 z-10">
        <p className="text-xs text-slate-500 font-mono tracking-wider flex items-center justify-center gap-1.5">
          <span>NHÀ MÁY TRÒ CHƠI TEAMBUILDING NGẪU NHIÊN © 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>POWERED BY GOOGLE COGNITIVE SERVICE</span>
        </p>
      </footer>

      {/* Number Preset Modal */}
      <AnimatePresence>
        {showNumberPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-lg font-bold text-white mb-2">Nhập số lượng (N)</h3>
              <p className="text-xs text-slate-400 mb-4">Hệ thống sẽ tự động tạo danh sách gồm các số thứ tự từ 1 đến N.</p>
              
              <form onSubmit={handleLoadNumberPreset}>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberN}
                  onChange={(e) => setNumberN(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white mb-5 focus:outline-none focus:border-indigo-500 transition font-mono text-center text-xl"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNumberPrompt(false)}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Tạo số
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
