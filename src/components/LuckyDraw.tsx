import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gift, 
  Sparkles, 
  RotateCcw, 
  Users, 
  Download, 
  Trash2, 
  Settings2, 
  Trophy, 
  Check, 
  Plus, 
  AlertCircle,
  Copy,
  CheckCircle2,
  RefreshCw,
  Shuffle
} from 'lucide-react';
import { Participant, Prize, DrawRecord, DrawMode } from '../types';
import { DEFAULT_PRIZES } from '../utils/demoData';
import { exportWinnersToCSV } from '../utils/csvParser';
import { soundFx } from '../utils/sound';

interface LuckyDrawProps {
  participants: Participant[];
  soundEnabled: boolean;
}

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ participants, soundEnabled }) => {
  // Config state
  const [drawMode, setDrawMode] = useState<DrawMode>('no-repeat');
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(DEFAULT_PRIZES[0]?.id || 'custom');
  const [customPrizeName, setCustomPrizeName] = useState<string>('特等獎');
  const [drawCount, setDrawCount] = useState<number>(1);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // New prize input modal/inline
  const [showAddPrize, setShowAddPrize] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCount, setNewPrizeCount] = useState(1);
  const [newPrizeIcon, setNewPrizeIcon] = useState('🎁');

  // History of all drawn winners
  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

  // Animation & Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<Participant | null>(null);
  const [currentWinners, setCurrentWinners] = useState<Participant[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const rollIntervalRef = useRef<number | null>(null);

  // Calculate won participant IDs in no-repeat mode
  const wonParticipantIds = useMemo(() => {
    return new Set(drawHistory.map((d) => d.winner.id));
  }, [drawHistory]);

  // Filter available candidate pool
  const candidatePool = useMemo(() => {
    return participants.filter((p) => {
      // Dept filter
      if (selectedDeptFilter !== 'ALL' && (p.department || '未分類') !== selectedDeptFilter) {
        return false;
      }
      // No-repeat check
      if (drawMode === 'no-repeat') {
        return !wonParticipantIds.has(p.id);
      }
      return true;
    });
  }, [participants, selectedDeptFilter, drawMode, wonParticipantIds]);

  const activePrizeName = useMemo(() => {
    if (selectedPrizeId === 'custom') {
      return customPrizeName || '幸運大獎';
    }
    const found = prizes.find((p) => p.id === selectedPrizeId);
    return found ? found.name : '幸運大獎';
  }, [selectedPrizeId, customPrizeName, prizes]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        window.clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch {
      // ignore
    }
  };

  const startDraw = () => {
    if (candidatePool.length === 0) {
      alert('目前沒有符合條件的可抽候選人！請檢查名單或切換至允許重複抽取。');
      return;
    }

    const actualDrawCount = Math.min(drawCount, candidatePool.length);
    if (actualDrawCount <= 0) return;

    setIsDrawing(true);
    setCurrentWinners([]);
    setShowWinnerModal(false);

    let speed = 50; // ms
    let elapsed = 0;
    const totalDuration = 2400; // total roll time
    const batchId = `batch-${Date.now()}`;

    // Sound effect setup
    soundFx.setMuted(!soundEnabled);

    // High speed rolling animation
    rollIntervalRef.current = window.setInterval(() => {
      elapsed += speed;
      // Pick random person from candidate pool for visual roll
      const randomIdx = Math.floor(Math.random() * candidatePool.length);
      setRollingCandidate(candidatePool[randomIdx]);
      soundFx.playTick();

      if (elapsed >= totalDuration) {
        if (rollIntervalRef.current) {
          window.clearInterval(rollIntervalRef.current);
        }

        // Final random pick
        // Shuffle pool
        const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
        const chosen = shuffled.slice(0, actualDrawCount);

        setRollingCandidate(chosen[0] || null);
        setCurrentWinners(chosen);
        setIsDrawing(false);
        setShowWinnerModal(true);

        // Sound & Confetti
        soundFx.playWinnerFanfare();
        triggerConfetti();

        // Record history
        const now = Date.now();
        const newRecords: DrawRecord[] = chosen.map((w) => ({
          id: `rec-${now}-${w.id}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: now,
          prizeId: selectedPrizeId,
          prizeName: activePrizeName,
          winner: w,
          batchId,
        }));

        setDrawHistory((prev) => [...newRecords, ...prev]);

        // If prize has quota, update remaining
        if (selectedPrizeId !== 'custom') {
          setPrizes((prev) =>
            prev.map((p) =>
              p.id === selectedPrizeId
                ? { ...p, remainingCount: Math.max(0, p.remainingCount - actualDrawCount) }
                : p
            )
          );
        }
      }
    }, speed);
  };

  const handleAddNewPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;
    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      name: newPrizeName.trim(),
      count: newPrizeCount,
      remainingCount: newPrizeCount,
      icon: newPrizeIcon || '🎁',
    };
    setPrizes((prev) => [...prev, newPrize]);
    setSelectedPrizeId(newPrize.id);
    setNewPrizeName('');
    setNewPrizeCount(1);
    setShowAddPrize(false);
  };

  const handleRemoveHistoryRecord = (id: string) => {
    setDrawHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCopyWinners = () => {
    if (drawHistory.length === 0) return;
    const text = drawHistory
      .map(
        (r) =>
          `🏆【${r.prizeName}】: ${r.winner.name} (${r.winner.department || '未分類'}${
            r.winner.employeeId ? ` - ${r.winner.employeeId}` : ''
          })`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleResetHistory = () => {
    if (window.confirm('確定要清空所有中獎歷史紀錄嗎？')) {
      setDrawHistory([]);
      // Reset prize remaining counts
      setPrizes((prev) => prev.map((p) => ({ ...p, remainingCount: p.count })));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-500/15 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3 border border-white/20 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-amber-200" />
            <span>獎品隨機抽籤</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            抽獎舞台與獎項抽取
          </h2>
          <p className="mt-2 text-rose-50 text-sm sm:text-base leading-relaxed">
            支援「不重複抽取（中獎後排除）」與「允許重複抽取」兩種模式。具備高流暢動態滾輪效果與慶祝彩帶，抽中結果自動記錄並可一鍵匯出中獎名單。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
              <Users className="w-4 h-4 text-emerald-300" />
              <span>
                抽獎池候選：<strong className="text-white text-sm ml-0.5">{candidatePool.length}</strong> / {participants.length} 人
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>
                已中獎人次：<strong className="text-white text-sm ml-0.5">{drawHistory.length}</strong> 次
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
              <Settings2 className="w-4 h-4 text-rose-200" />
              <span>模式：<strong>{drawMode === 'no-repeat' ? '不重複抽籤 (排除已得獎)' : '允許重複抽取'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center shadow-md shadow-rose-500/5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">名冊尚未匯入名單</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            抽獎功能需要名單資料，請先至「名單管理」上傳 CSV、貼上姓名，或使用上方「載入示範名單」！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Draw Controls & Settings (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-rose-100/80 shadow-md shadow-rose-500/5 p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Settings2 className="w-4 h-4 text-rose-600" />
                  <span>抽籤規則設定</span>
                </h3>
              </div>

              {/* Draw Mode: Repeat vs No-Repeat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  重複抽取規則 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDrawMode('no-repeat')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      drawMode === 'no-repeat'
                        ? 'border-rose-400 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center space-x-1.5">
                        <span>🚫 不重複抽取</span>
                      </span>
                      {drawMode === 'no-repeat' && (
                        <Check className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      中獎者自候選名單中排除，人人有機會不重複得獎。
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawMode('repeat')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      drawMode === 'repeat'
                        ? 'border-rose-400 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center space-x-1.5">
                        <span>🔄 允許重複抽取</span>
                      </span>
                      {drawMode === 'repeat' && (
                        <Check className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      中獎後仍留在名冊抽獎池，每次皆為全員獨立機率。
                    </p>
                  </button>
                </div>
              </div>

              {/* Prize Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    當前抽獎獎項
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddPrize(!showAddPrize)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-200/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddPrize ? '收起新增' : '自訂新獎項'}</span>
                  </button>
                </div>

                {showAddPrize && (
                  <form onSubmit={handleAddNewPrize} className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 mb-3 space-y-2.5">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">圖示</label>
                        <select
                          value={newPrizeIcon}
                          onChange={(e) => setNewPrizeIcon(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium"
                        >
                          <option value="🎁">🎁 禮物</option>
                          <option value="📱">📱 手機</option>
                          <option value="💻">💻 筆電</option>
                          <option value="🎧">🎧 耳機</option>
                          <option value="🎮">🎮 遊戲</option>
                          <option value="✨">✨ 禮券</option>
                          <option value="🧧">🧧 紅包</option>
                          <option value="☕">☕ 咖啡</option>
                        </select>
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">獎品名稱</label>
                        <input
                          type="text"
                          required
                          value={newPrizeName}
                          onChange={(e) => setNewPrizeName(e.target.value)}
                          placeholder="例：五星飯店住宿券"
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">名額</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={newPrizeCount}
                          onChange={(e) => setNewPrizeCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      確認新增至獎品清單
                    </button>
                  </form>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {prizes.map((pz) => (
                    <div
                      key={pz.id}
                      onClick={() => setSelectedPrizeId(pz.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedPrizeId === pz.id
                          ? 'border-rose-400 bg-rose-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{pz.icon || '🎁'}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{pz.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            總名額：{pz.count} 份 (剩餘 {pz.remainingCount} 份)
                          </p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center bg-white">
                        {selectedPrizeId === pz.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Custom prize option */}
                  <div
                    onClick={() => setSelectedPrizeId('custom')}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedPrizeId === 'custom'
                        ? 'border-rose-400 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 mr-2">
                      <span className="text-xl">🎯</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">直接自訂獎項名稱</p>
                        {selectedPrizeId === 'custom' && (
                          <input
                            type="text"
                            value={customPrizeName}
                            onChange={(e) => setCustomPrizeName(e.target.value)}
                            placeholder="輸入獎品或頭銜"
                            className="mt-1.5 w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center bg-white">
                      {selectedPrizeId === 'custom' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Draw Batch Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  單次抽取名額
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDrawCount(cnt)}
                      className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                        drawCount === cnt
                          ? 'border-rose-500 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs scale-[1.02]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} 位
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Draw Stage & History (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Draw Stage Card */}
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-900/50">
              {/* Glowing ambient light */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

              {/* Current Prize Tag */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-rose-200 text-xs font-bold backdrop-blur-md">
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  <span>現正抽取：{activePrizeName}</span>
                </div>

                <div className="text-xs text-slate-300 font-semibold">
                  抽取名額：<strong className="text-amber-400 text-sm">{Math.min(drawCount, candidatePool.length)}</strong> 人
                </div>
              </div>

              {/* Rolling Stage View */}
              <div className="py-8 text-center relative z-10">
                <div className="inline-block relative">
                  {/* Slot frame container */}
                  <div
                    className={`w-72 sm:w-96 h-40 mx-auto rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-950/90 border-2 ${
                      isDrawing ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.45)] animate-pulse' : 'border-rose-500/60 shadow-xl'
                    } p-4 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md`}
                  >
                    {isDrawing ? (
                      <div className="space-y-1 transform transition-transform animate-bounce">
                        <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-wider">
                          {rollingCandidate?.name || '抽籤中...'}
                        </span>
                        <p className="text-xs font-mono text-slate-300 font-bold">
                          {rollingCandidate?.department || '全體成員'}・{rollingCandidate?.employeeId || '***'}
                        </p>
                      </div>
                    ) : currentWinners.length > 0 ? (
                      <div className="space-y-1.5 animate-in zoom-in-95 duration-300">
                        <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>恭喜中獎！</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          {currentWinners[0].name}
                        </div>
                        <div className="text-xs text-rose-200 font-medium">
                          {currentWinners[0].department || '未分類'} {currentWinners[0].employeeId ? `(${currentWinners[0].employeeId})` : ''}
                        </div>
                        {currentWinners.length > 1 && (
                          <div className="text-xs text-amber-300 font-bold mt-1">
                            以及其他 {currentWinners.length - 1} 位得獎者
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-slate-400">
                        <Sparkles className="w-9 h-9 mx-auto text-amber-400/90 animate-spin" style={{ animationDuration: '6s' }} />
                        <p className="text-sm font-bold text-slate-200">準備就緒，點擊下方按鈕開始抽取</p>
                        <p className="text-xs text-slate-400 font-mono">候選人總數：{candidatePool.length} 人</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                <button
                  id="start-draw-btn"
                  type="button"
                  disabled={isDrawing || candidatePool.length === 0}
                  onClick={startDraw}
                  className={`w-full sm:w-72 py-4 px-6 rounded-2xl font-black text-base tracking-wide flex items-center justify-center space-x-2 transition-all duration-200 shadow-xl ${
                    isDrawing
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : candidatePool.length === 0
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-rose-500/30'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isDrawing ? '正在隨機抽取中...' : `立即抽籤 (${Math.min(drawCount, candidatePool.length)}人)`}</span>
                </button>
              </div>
            </div>

            {/* Winner History & Management */}
            <div className="bg-white rounded-3xl border border-rose-100/80 shadow-md shadow-rose-500/5 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-base">
                    中獎歷史紀錄
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    共 {drawHistory.length} 筆
                  </span>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleCopyWinners}
                    disabled={drawHistory.length === 0}
                    className="p-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 disabled:opacity-40 font-bold"
                    title="複製文字格式"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>複製名單</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportWinnersToCSV(drawHistory)}
                    disabled={drawHistory.length === 0}
                    className="p-2 text-xs text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors flex items-center space-x-1.5 disabled:opacity-40 font-bold"
                    title="匯出中獎 CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>匯出 CSV</span>
                  </button>

                  {drawHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetHistory}
                      className="p-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      title="重置紀錄"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {copiedNotification && (
                <div className="bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 border-b border-emerald-100 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>已將中獎名單複製至剪貼簿！</span>
                </div>
              )}

              {drawHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  尚無抽獎紀錄，點擊上方按鈕開始抽出幸運得主！
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/90 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">獎項</th>
                        <th className="py-3 px-4">獲獎者</th>
                        <th className="py-3 px-4">部門/工號</th>
                        <th className="py-3 px-4">時間</th>
                        <th className="py-3 px-4 text-right w-12">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drawHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-rose-600">
                            {rec.prizeName}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {rec.winner.name.slice(0, 1)}
                            </span>
                            <span>{rec.winner.name}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px] font-medium">
                            {rec.winner.department || '-'}{' '}
                            {rec.winner.employeeId && (
                              <span className="font-mono text-slate-400">
                                ({rec.winner.employeeId})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(rec.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveHistoryRecord(rec.id)}
                              title="移除此紀錄"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Winner Celebration Modal when multi or single winner is drawn */}
      {showWinnerModal && currentWinners.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/25">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center space-x-1 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-200 mb-2">
              <span>{activePrizeName}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">
              🎉 恭喜幸運得主！ 🎉
            </h3>

            {/* List of winners in this batch */}
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto mb-6">
              {currentWinners.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {w.name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{w.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {w.department || '未分類部門'}{' '}
                        {w.employeeId ? `・${w.employeeId}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    得獎
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setShowWinnerModal(false)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-colors shadow-xs"
              >
                關閉並繼續抽獎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
