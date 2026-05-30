import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Volume2, VolumeX, Plus, Trash2, ListPlus, Award, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WheelOption } from "../types";

// Standard pastel/bright color palette for gorgeous contrast on dark or light backgrounds
const PRESET_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7D794", "#786FA6", "#F8A5C2", "#63CDFF", "#778BEB",
  "#FF7979", "#E15F41", "#3dc1d3", "#f5cd79", "#574b90"
];

const PRESETS = {
  numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  drinks: ["Trà Sữa", "Cà Phê Muối", "Trà Đào Sả", "Nước Cam", "Chanh Tuyết", "Sinh Tố Bơ"],
  actions: ["Hát 1 bài", "Nhảy múa vui", "Uống 1 cốc nước", "Kể chuyện cười", "Làm mặt xấu", "Rót nước cho sếp"]
};

interface LuckyWheelProps {
  initialParticipants: string[];
}

export default function LuckyWheel({ initialParticipants }: LuckyWheelProps) {
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastSoundTickRef = useRef<number>(0);

  // Load initial options & history
  useEffect(() => {
    // Load history
    const cachedHistory = localStorage.getItem("wheel_history");
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) {
        console.error("Failed to parse wheel history", e);
      }
    }

    if (initialParticipants.length > 0) {
      const mapped = initialParticipants.map((p, idx) => ({
        id: `p-${idx}-${Date.now()}`,
        text: p,
        color: PRESET_COLORS[idx % PRESET_COLORS.length]
      }));
      setOptions(mapped);
    } else {
      // Default placeholder list
      const defaultSlices = ["Nhân viên A", "Nhân viên B", "Nhân viên C", "Nhân viên D", "Nhân viên E", "Nhân viên F"];
      setOptions(defaultSlices.map((name, idx) => ({
        id: `def-${idx}`,
        text: name,
        color: PRESET_COLORS[idx % PRESET_COLORS.length]
      })));
    }
  }, [initialParticipants]);

  // Audio oscillator generator for tick sound (teambuilding arcade style)
  const playTickSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Browser context fallback
    }
  };

  // Draw the wheel using Canvas API
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use high resolution fixed drawing sizes for flawless crisp rendering on mobile screens
    canvas.width = 600;
    canvas.height = 600;
    const size = 600;
    const center = size / 2;
    const radius = center - 16; // leaving margin for glowing border

    ctx.clearRect(0, 0, size, size);

    if (options.length === 0) {
      // Empty wheel state
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Nhập danh sách ô quay", center, center);
      return;
    }

    const arcSize = (2 * Math.PI) / options.length;

    // Draw slices
    options.forEach((opt, idx) => {
      const startAngle = currentAngleRef.current + idx * arcSize;
      const endAngle = startAngle + arcSize;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = opt.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text rotated inside the slice
      ctx.save();
      ctx.translate(center, center);
      // Align reading rotation along slice radius
      const textAngle = startAngle + arcSize / 2;
      ctx.rotate(textAngle);

      // Sizing the text dynamically based on count
      const textX = radius * 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      
      const fontSize = options.length > 16 
        ? "bold 13px 'Plus Jakarta Sans', sans-serif" 
        : options.length > 10 
          ? "bold 16px 'Plus Jakarta Sans', sans-serif" 
          : "bold 20px 'Plus Jakarta Sans', sans-serif";
          
      ctx.font = fontSize;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Cap text length if too long
      const text = opt.text.length > 16 ? opt.text.substring(0, 14) + ".." : opt.text;
      ctx.fillText(text, textX, 0);
      ctx.restore();
    });

    // Outer beautiful indicator rim with small indicator light circles
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#4f46e5"; // Indigo matching our theme
    ctx.lineWidth = 12;
    ctx.stroke();

    // Inner small center cap (the spinner peg)
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e1b4b";
    ctx.fill();
    ctx.strokeStyle = "#facc15"; // Yellow border helper
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#facc15";
    ctx.fill();
  };

  // Re-draw wheel on options changes or angle updates
  useEffect(() => {
    drawWheel();
  }, [options]);

  // Handle spin initiation with natural physics acceleration & deceleration
  const spinWheel = () => {
    if (isSpinning) return;
    if (options.length === 0) {
      setWarning("Vui lòng thêm người tham gia / tuỳ chọn trước khi quay!");
      return;
    }

    setIsSpinning(true);
    setWarning(null);
    setWinner(null);
    setShowWinnerModal(false);

    // Pick a random ending point (min 5 full rotations, max 9 full rotations)
    const baseRotations = 5 + Math.random() * 4;
    const finalAngle = baseRotations * 2 * Math.PI;
    
    let speed = 0.45 + Math.random() * 0.15; // Starting rapid spin speed
    let deceleration = 0.0012 + Math.random() * 0.0003; // Tiny frictional slowdown
    
    let lastAngle = currentAngleRef.current;
    const arcSize = (2 * Math.PI) / options.length;

    const animate = () => {
      currentAngleRef.current += speed;
      speed -= deceleration;

      // Wrap-around angle
      currentAngleRef.current = currentAngleRef.current % (2 * Math.PI);

      // Sound ticker: check if we crossed a slice boundary!
      const lastIndex = Math.floor((lastAngle % (2 * Math.PI)) / arcSize);
      const currentIndex = Math.floor((currentAngleRef.current % (2 * Math.PI)) / arcSize);
      if (lastIndex !== currentIndex) {
        playTickSound();
      }
      lastAngle = currentAngleRef.current;

      drawWheel();

      if (speed <= 0.002) {
        // Stop spinning!
        setIsSpinning(false);
        cancelAnimationFrame(requestRef.current as number);

        // Calculate the winner. The pointer points to the RIGHT (0 angle point on unit circle).
        // To find the slice on polar coordinates pointing right:
        // angle (0 is pointing straight right).
        // Slices start from currentAngleRef.current.
        // Slice coordinate matching standard unit circle index:
        // (2*PI - normalizedAngle) gets the slice index corresponding to the pointer coordinates.
        const normalizedAngle = (2 * Math.PI - (currentAngleRef.current % (2 * Math.PI))) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / arcSize);
        const winOpt = options[winningIndex];

        if (winOpt) {
          setWinner(winOpt.text);
          setShowWinnerModal(true);
          setHistory(prev => {
            const next = [winOpt.text, ...prev.slice(0, 19)];
            localStorage.setItem("wheel_history", JSON.stringify(next));
            return next;
          });
        }
      } else {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
  };

  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOptionText.trim()) return;

    const newOpt: WheelOption = {
      id: `custom-${Date.now()}-${Math.random()}`,
      text: newOptionText.trim(),
      color: PRESET_COLORS[options.length % PRESET_COLORS.length]
    };
    setOptions(prev => [...prev, newOpt]);
    setNewOptionText("");
  };

  const handleDeleteOption = (id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const loadPreset = (presetName: keyof typeof PRESETS) => {
    const list = PRESETS[presetName];
    const mapped = list.map((item, idx) => ({
      id: `preset-${presetName}-${idx}-${Date.now()}`,
      text: item,
      color: PRESET_COLORS[idx % PRESET_COLORS.length]
    }));
    setOptions(mapped);
    setWinner(null);
    setShowWinnerModal(false);
  };

  const handleReset = () => {
    setOptions([]);
    setWinner(null);
    setShowWinnerModal(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("wheel_history");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Confetti celebration modal */}
      <AnimatePresence>
        {showWinnerModal && winner && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500" />
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-500/10 text-indigo-500 p-4 rounded-full">
                  <PartyPopper className="w-12 h-12 animate-bounce" />
                </div>
              </div>
              <p className="text-indigo-400 font-semibold tracking-wide uppercase text-sm">Chúc Mừng Chiến Thắng!</p>
              <h3 className="text-3xl font-extrabold text-white mt-1 mb-6 break-words tracking-tight">{winner}</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition duration-200 shadow-md shadow-indigo-600/15"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    spinWheel();
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-6 rounded-xl transition duration-200 border border-slate-700"
                >
                  Quay tiếp!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wheel Interaction Section */}
      <div className="lg:col-span-7 flex flex-col items-center">
        {/* Main physical wheel visual housing with tap-to-spin gesture support */}
        <div 
          onClick={spinWheel}
          className="relative mb-3 md:mb-6 p-3 sm:p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-3xl border border-slate-700/80 hover:border-indigo-500/50 max-w-[310px] xs:max-w-[370px] sm:max-w-[420px] w-full aspect-square flex items-center justify-center cursor-pointer select-none ring-1 ring-white/5 active:scale-[0.98] transition-all duration-200 touch-manipulation group"
          title="Chạm hoặc click thẳng để quay!"
        >
          {/* Top Indicator Triangle Pin pointing LEFT or RIGHT - Standard top picker points DOWN */}
          <div className="absolute top-1 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] sm:border-l-[16px] sm:border-r-[16px] sm:border-t-[24px] border-l-transparent border-r-transparent border-t-indigo-500 drop-shadow-md" />
            <div className="w-2 h-2 rounded-full bg-white mt-[-4px]" />
          </div>

          {/* Right Indicator Pointer (the standard pointer coordinate used) */}
          <div className="absolute right-1 z-30 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <div className="w-0 h-0 border-t-[14px] border-b-[14px] border-r-[20px] sm:border-t-[16px] sm:border-b-[16px] sm:border-r-[24px] border-t-transparent border-b-transparent border-r-indigo-500 drop-shadow-md rotate-180" />
          </div>

          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full drop-shadow-[0_8px_20px_rgba(79,70,229,0.25)] group-hover:scale-[1.01] transition-transform duration-300"
          />

          {/* Tap-gesture help banner for touch devices */}
          <div className="absolute bottom-2.5 bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-300 tracking-wider uppercase pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            👉 Chạm bánh xe để quay
          </div>
        </div>

        {/* Spin controls */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs justify-center mb-4">
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition duration-150"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <button
              onClick={spinWheel}
              disabled={isSpinning || options.length === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-indigo-600/15"
            >
              <Play className="w-5 h-5 fill-current" />
              {isSpinning ? "Đang quay..." : "QUAY NGAY"}
            </button>
          </div>
          {warning && (
            <div className="text-center text-rose-400 text-xs font-semibold bg-rose-500/10 py-2 px-3 rounded-lg border border-rose-500/20 w-full">
              {warning}
            </div>
          )}
        </div>

        {/* Spin Result Display */}
        {winner && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs text-slate-400">Kết quả lượt quay trước</p>
                <p className="text-base font-bold text-white max-w-[200px] truncate">{winner}</p>
              </div>
            </div>
            <button
              onClick={() => setShowWinnerModal(true)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              Xem chi tiết
            </button>
          </motion.div>
        )}
      </div>

      {/* Slices / Options Controls Section */}
      <div className="lg:col-span-5 space-y-6">
        {/* Quick Presets */}
        <div className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-indigo-400" />
            Nạp nhanh mẫu sẵn
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => loadPreset("numbers")}
              className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition"
            >
              Mẫu số (1-10)
            </button>
            <button
              onClick={() => loadPreset("drinks")}
              className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition"
            >
              Nước uống
            </button>
            <button
              onClick={() => loadPreset("actions")}
              className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-center transition"
            >
              Hình phạt nhanh
            </button>
          </div>
        </div>

        {/* Option Customizer List */}
        <div className="bg-slate-850 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/40">
            <div>
              <h4 className="font-bold text-white text-sm">Danh sách ô quay</h4>
              <p className="text-xs text-slate-400">{options.length} ô đang hiển thị</p>
            </div>
            {options.length > 0 && (
              <button
                onClick={handleReset}
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xoá sạch
              </button>
            )}
          </div>

          <form onSubmit={handleAddOption} className="p-4 flex gap-2 border-b border-slate-700 bg-slate-800/20">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Thêm ô mới... (ví dụ: Tặng quà)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              disabled={isSpinning}
            />
            <button
              type="submit"
              disabled={isSpinning || !newOptionText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition duration-150"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* Slices list wrapper */}
          <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-700/60 custom-scrollbar">
            {options.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Không có ô quay nào được cấu hình
              </div>
            ) : (
              options.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/25 transition">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-slate-200 text-sm font-medium">{opt.text}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteOption(opt.id)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded transition"
                    title="Xoá ô"
                    disabled={isSpinning}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lượt quay gần đây */}
        {history.length > 0 && (
          <div className="bg-slate-800/20 border border-slate-700/40 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2.5">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Lịch sử lượt quay trước
              </h5>
              <button 
                onClick={clearHistory}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition"
                title="Xoá lịch sử quay"
              >
                <Trash2 className="w-3 h-3" />
                Xoá
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
              {history.map((name, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 bg-slate-800 text-xs font-medium text-slate-300 rounded-md border border-slate-700"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
