import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Layers, Trophy, AlertTriangle, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LuckyJarProps {
  initialParticipants: string[];
}

export default function LuckyJar({ initialParticipants }: LuckyJarProps) {
  const [pool, setPool] = useState<string[]>([]);
  const [drawnList, setDrawnList] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnName, setDrawnName] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [funnyMessage, setFunnyMessage] = useState("");
  const [customInputList, setCustomInputList] = useState("");

  // Sound generator for a cute sweep/pop sound when a paper is drawn
  const playDrawSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context blocked
    }
  };

  useEffect(() => {
    // Only apply initialParticipants if we don't have an active game going to avoid resetting
    const cachedDrawn = localStorage.getItem("jar_drawn");
    const cachedPool = localStorage.getItem("jar_pool");

    if (cachedDrawn && cachedPool) {
      try {
        setDrawnList(JSON.parse(cachedDrawn));
        const p = JSON.parse(cachedPool);
        setPool(p);
        const combined = [...p, ...JSON.parse(cachedDrawn)].sort();
        setCustomInputList(combined.join("\n"));
        return;
      } catch (e) {}
    }

    if (initialParticipants.length > 0) {
      setPool(initialParticipants);
      setCustomInputList(initialParticipants.join("\n"));
    } else {
      const defaults = [
        "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Chung", 
        "Phạm Minh Đức", "Đỗ Hải Yến", "Vũ Nhật Hùng", 
        "Hoàng Anh Thư", "Đặng Quang Minh"
      ];
      setPool(defaults);
      setCustomInputList(defaults.join("\n"));
    }
    setDrawnList([]);
    setDrawnName(null);
  }, [initialParticipants]);

  const saveState = (newPool: string[], newDrawn: string[]) => {
    setPool(newPool);
    setDrawnList(newDrawn);
    localStorage.setItem("jar_pool", JSON.stringify(newPool));
    localStorage.setItem("jar_drawn", JSON.stringify(newDrawn));
  };

  const handleUpdatePool = () => {
    const list = customInputList
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    saveState(list, []);
    setDrawnName(null);
  };

  const getFunnyChamberLoadingMessage = () => {
    const messages = [
      "Quay đều hũ sâm... 🍯",
      "Khuấy động linh khí... ✨",
      "Binh pháp Tôn Tử, chọn trúng đại thần... 📜",
      "May mắn đang tìm chủ nhân...",
      "Thần tài đang chọn lá thư...",
      "Ai sẽ lên bảng vàng đây? 🏆"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const drawOne = () => {
    if (isDrawing) return;
    if (pool.length === 0) {
      setWarning("Hũ bốc thăm đã trống! Vui lòng thêm danh sách mới hoặc đặt lại (Reset) để tiếp tục.");
      return;
    }

    setIsDrawing(true);
    setWarning(null);
    setDrawnName(null);
    setFunnyMessage(getFunnyChamberLoadingMessage());

    // Shake time simulation
    setTimeout(() => {
      // Pick random
      const winnerIdx = Math.floor(Math.random() * pool.length);
      const winner = pool[winnerIdx];

      playDrawSound();
      setDrawnName(winner);
      
      const newDrawnList = [winner, ...drawnList];
      const newPool = pool.filter((_, idx) => idx !== winnerIdx);
      saveState(newPool, newDrawnList);
      
      setIsDrawing(false);
    }, 1800);
  };

  const resetGame = () => {
    // Reset pool back to initial state (combining current pool and drawn list)
    const combined = [...pool, ...drawnList].sort();
    saveState(combined, []);
    setDrawnName(null);
    setIsDrawing(false);
  };

  const clearHistory = () => {
    saveState([...pool, ...drawnList].sort(), []);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual glowing glass teambuilding jar panel */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full max-w-[320px] xs:max-w-[370px] sm:max-w-[380px] bg-slate-800/20 border border-slate-700/80 p-4 xs:p-6 rounded-3xl flex flex-col items-center relative overflow-hidden">
          {/* Glass glare overlay */}
          <div className="absolute top-0 right-0 w-32 h-64 bg-white/5 skew-x-12 translate-x-12 pointer-events-none" />

          <h3 className="text-sm font-bold text-slate-300 tracking-wider uppercase mb-4 sm:mb-6 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Hũ Bốc Thăm May Mắn
          </h3>

          {/* Actual physical glass jar rendering: Tap-to-draw gesture support */}
          <div 
            onClick={drawOne}
            className="relative w-52 h-60 xs:w-56 xs:h-64 flex items-center justify-center my-2 sm:my-4 cursor-pointer select-none group touch-manipulation active:scale-[0.98] transition-transform"
            title="Chạm trực tiếp vào hũ để rút thăm!"
          >
            {/* The jar glass frame with shake animation during isDrawing */}
            <motion.div
              animate={isDrawing ? {
                x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0],
                y: [0, 4, -4, 3, -3, 2, -2, 1, -1, 0],
                rotate: [0, -3, 3, -2, 2, -1, 1, 0]
              } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="relative w-44 h-52 xs:w-48 xs:h-56 bg-slate-900/40 border-[5px] border-emerald-500/30 group-hover:border-emerald-500/50 rounded-t-[30px] rounded-b-[40px] flex items-center justify-center shadow-inner shadow-emerald-500/10 transition-colors"
            >
              {/* Jar lid */}
              <div className="absolute top-[-16px] left-[15%] w-[70%] h-4 bg-slate-700 border-2 border-emerald-500/30 rounded-md" />
              <div className="absolute top-[-22px] left-[40%] w-[20%] h-2 bg-emerald-500/50 rounded-t-sm" />

              {/* Floating papers / tickets left inside the jar context */}
              <div className="absolute inset-x-4 bottom-4 top-8 flex flex-wrap gap-2 gap-y-1 items-end justify-center overflow-hidden pointer-events-none">
                {pool.length === 0 && drawnName === null && !isDrawing ? (
                  <div className="text-slate-500 text-xs text-center mb-12">Hũ trống rỗng</div>
                ) : (
                  pool.slice(0, 24).map((_, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        y: [0, Math.sin(idx) * 6, 0],
                        rotate: [0, (idx % 2 === 0 ? 15 : -15), 0]
                      }}
                      transition={{
                        duration: 2 + (idx % 3),
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-7 h-3.5 xs:w-8 xs:h-4 bg-gradient-to-tr from-emerald-400 to-teal-200 rounded-sm shadow-sm opacity-80 border border-emerald-500/20 flex-shrink-0"
                    />
                  ))
                )}
              </div>

              {/* Tap-gesture help banner for touch devices */}
              <div className="absolute bottom-4 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-400 tracking-wider uppercase pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                👋 Chạm hũ để bốc thăm
              </div>

              {/* Status or loading labels */}
              {isDrawing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/70 rounded-t-[25px] rounded-b-[35px] backdrop-blur-[1px]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"
                  />
                  <p className="text-xs font-medium text-emerald-400 leading-relaxed max-w-[120px]">{funnyMessage}</p>
                </div>
              )}
            </motion.div>

            {/* Animation representing paper drawing flight out! */}
            <AnimatePresence>
              {drawnName && !isDrawing && (
                <motion.div
                  initial={{ scale: 0.1, y: 100, rotate: -45, opacity: 0 }}
                  animate={{ scale: [0.1, 1.2, 1], y: [100, -80, -90], rotate: [0, 10, 0], opacity: 1 }}
                  exit={{ scale: 0.5, y: -200, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute z-60 w-56 xs:w-64 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl p-4 text-center shadow-xl shadow-emerald-500/20 border border-emerald-300 pointer-events-auto"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 border-2 border-white text-slate-900 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Đã chọn!
                  </div>
                  <h4 className="text-slate-950 font-black text-xl break-words mt-1">{drawnName}</h4>
                  <p className="text-[11px] text-slate-950/70 font-semibold mt-1">Lá thư may mắn vàng từ trong hũ</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-xs text-slate-400 font-medium text-center mt-2 mb-4">
            {pool.length > 0 ? (
              <span>Còn lại <b className="text-white bg-slate-800 px-1.5 py-0.5 rounded ml-0.5">{pool.length}</b> người chưa gọi tên</span>
            ) : (
              <span className="text-amber-400 font-bold">Mọi người đã được bốc thăm hết!</span>
            )}
          </div>

          {warning && (
            <div className="text-center text-rose-400 text-xs font-semibold bg-rose-500/10 py-2 px-3 rounded-lg border border-rose-500/20 w-full mb-3">
              {warning}
            </div>
          )}

          {/* Trigger bốc thăm */}
          <button
            onClick={drawOne}
            disabled={isDrawing || pool.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-600/10 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition duration-200 shadow-md touch-manipulation"
          >
            <Play className="w-5 h-5 fill-current" />
            BỐC THĂM LÁ TIẾP
          </button>
        </div>
      </div>

      {/* Roster & Drawn roster manager sidebar */}
      <div className="lg:col-span-5 space-y-6">
        {/* Draw participant pool manager */}
        <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Sửa danh sách chờ ({pool.length})
            </h4>
            {drawnList.length > 0 && (
              <button
                onClick={resetGame}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nạp lại hũ
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Mỗi người một dòng. Bạn có thể chép nhanh danh sách vào đây và lưu lại.
          </p>
          <textarea
            value={customInputList}
            onChange={(e) => setCustomInputList(e.target.value)}
            className="w-full h-[120px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition custom-scrollbar font-mono leading-relaxed"
            placeholder="Nguyen Van A&#10;Tran Thi B..."
          />
          <button
            onClick={handleUpdatePool}
            className="w-full mt-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold text-xs py-2 px-4 rounded-xl border border-slate-700 transition"
          >
            Nạp danh sách mới vào hũ
          </button>
        </div>

        {/* List of drawn candidates */}
        <div className="bg-slate-850 border border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-805 bg-slate-800/20">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Lịch sử rút quân ({drawnList.length})
            </h4>
            {drawnList.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
              >
                Xóa lịch sử
              </button>
            )}
          </div>

          <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-700/60 custom-scrollbar">
            {drawnList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Chưa có ai may mắn được gọi tên
              </div>
            ) : (
              drawnList.map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-800/15">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-5">#{drawnList.length - idx}</span>
                    <span className="text-slate-200 text-sm font-medium">{name}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                    Đã rút
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
