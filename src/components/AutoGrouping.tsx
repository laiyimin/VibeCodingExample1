import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Shuffle, 
  Crown, 
  Download, 
  Copy, 
  CheckCircle2, 
  Settings, 
  Layers, 
  Sparkles, 
  ArrowRightLeft, 
  Edit3, 
  Trash2,
  Share2,
  Check
} from 'lucide-react';
import { Participant, GroupResult, GroupingMode, NamingTheme } from '../types';
import { exportGroupsToCSV } from '../utils/csvParser';
import { soundFx } from '../utils/sound';

interface AutoGroupingProps {
  participants: Participant[];
  soundEnabled: boolean;
}

const THEME_NAMES: Record<NamingTheme, string[]> = {
  numbers: ['第 1 組', '第 2 組', '第 3 組', '第 4 組', '第 5 組', '第 6 組', '第 7 組', '第 8 組', '第 9 組', '第 10 組', '第 11 組', '第 12 組'],
  letters: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H', 'Team I', 'Team J', 'Team K', 'Team L'],
  colors: ['紅隊 (Red)', '藍隊 (Blue)', '綠隊 (Green)', '黃隊 (Yellow)', '紫隊 (Purple)', '澄隊 (Orange)', '青隊 (Teal)', '金隊 (Gold)', '粉隊 (Pink)', '銀隊 (Silver)'],
  animals: ['飛鷹隊 🦅', '猛虎隊 🐯', '戰狼隊 🐺', '金獅隊 🦁', '黑豹隊 🐆', '巨熊隊 🐻', '神龍隊 🐉', '獵豹隊 🐆', '雄鹿隊 🦌', '靈狐隊 🦊'],
  planets: ['太陽隊 ☀️', '木星隊 🪐', '火星隊 🚀', '金星隊 ✨', '水星隊 🌊', '土星隊 💫', '海王星隊 🔱', '天王星隊 🌌'],
  elements: ['火焰組 🔥', '海洋組 🌊', '大地組 ⛰️', '狂風組 🌪️', '雷霆組 ⚡', '極光組 🌈', '星辰組 🌟', '森林組 🌲'],
};

const THEME_COLORS = [
  'from-indigo-600 to-violet-700 border-indigo-200 bg-indigo-50/50 text-indigo-950',
  'from-emerald-600 to-teal-700 border-emerald-200 bg-emerald-50/50 text-emerald-950',
  'from-pink-600 to-rose-700 border-pink-200 bg-pink-50/50 text-pink-950',
  'from-amber-500 to-orange-600 border-amber-200 bg-amber-50/50 text-amber-950',
  'from-cyan-600 to-sky-700 border-cyan-200 bg-cyan-50/50 text-cyan-950',
  'from-purple-600 to-fuchsia-700 border-purple-200 bg-purple-50/50 text-purple-950',
  'from-lime-600 to-emerald-700 border-lime-200 bg-lime-50/50 text-lime-950',
  'from-rose-600 to-red-700 border-rose-200 bg-rose-50/50 text-rose-950',
];

export const AutoGrouping: React.FC<AutoGroupingProps> = ({ participants, soundEnabled }) => {
  // Config state
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by_size');
  const [peoplePerGroup, setPeoplePerGroup] = useState<number>(4);
  const [totalGroups, setTotalGroups] = useState<number>(3);
  const [balanceDept, setBalanceDept] = useState<boolean>(true);
  const [autoAssignLeader, setAutoAssignLeader] = useState<boolean>(true);
  const [namingTheme, setNamingTheme] = useState<NamingTheme>('numbers');

  // Groups state
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Calculate target groups count
  const calculatedGroupCount = useMemo(() => {
    if (participants.length === 0) return 0;
    if (groupingMode === 'by_size') {
      const size = Math.max(1, peoplePerGroup);
      return Math.ceil(participants.length / size);
    }
    return Math.max(1, Math.min(totalGroups, participants.length));
  }, [participants.length, groupingMode, peoplePerGroup, totalGroups]);

  // Grouping algorithm
  const generateGroups = () => {
    if (participants.length === 0) return;

    soundFx.setMuted(!soundEnabled);
    soundFx.playShuffle();
    setIsShuffling(true);

    setTimeout(() => {
      let pool = [...participants];
      let numGroups = 1;

      if (groupingMode === 'by_size') {
        const size = Math.max(1, peoplePerGroup);
        numGroups = Math.max(1, Math.ceil(pool.length / size));
      } else {
        numGroups = Math.max(1, Math.min(totalGroups, pool.length));
      }

      // Create empty groups
      const themeList = THEME_NAMES[namingTheme] || THEME_NAMES.numbers;
      const resultGroups: GroupResult[] = Array.from({ length: numGroups }, (_, i) => ({
        id: `group-${i + 1}-${Date.now()}`,
        name: themeList[i] || `第 ${i + 1} 組`,
        color: THEME_COLORS[i % THEME_COLORS.length],
        members: [],
      }));

      if (balanceDept) {
        // Group by department first, then distribute round-robin
        const deptMap: Record<string, Participant[]> = {};
        pool.forEach((p) => {
          const dept = p.department || '__NONE__';
          if (!deptMap[dept]) deptMap[dept] = [];
          deptMap[dept].push(p);
        });

        // Shuffle within departments
        Object.keys(deptMap).forEach((dept) => {
          deptMap[dept].sort(() => 0.5 - Math.random());
        });

        // Interleave members from different departments
        const interleaved: Participant[] = [];
        let hasMore = true;
        let round = 0;
        while (hasMore) {
          hasMore = false;
          Object.keys(deptMap).forEach((dept) => {
            if (deptMap[dept][round]) {
              interleaved.push(deptMap[dept][round]);
              hasMore = true;
            }
          });
          round++;
        }

        // Distribute into groups round-robin
        interleaved.forEach((p, idx) => {
          resultGroups[idx % numGroups].members.push(p);
        });
      } else {
        // Pure random shuffle
        pool = pool.sort(() => 0.5 - Math.random());
        pool.forEach((p, idx) => {
          resultGroups[idx % numGroups].members.push(p);
        });
      }

      // Assign leader if enabled
      if (autoAssignLeader) {
        resultGroups.forEach((g) => {
          if (g.members.length > 0) {
            const randomLeaderIdx = Math.floor(Math.random() * g.members.length);
            g.leaderId = g.members[randomLeaderIdx].id;
          }
        });
      }

      setGroups(resultGroups);
      setIsShuffling(false);
    }, 300);
  };

  // Set leader manually
  const handleToggleLeader = (groupId: string, memberId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          leaderId: g.leaderId === memberId ? undefined : memberId,
        };
      })
    );
  };

  // Move member to another group
  const handleMoveMember = (fromGroupId: string, toGroupId: string, memberId: string) => {
    if (fromGroupId === toGroupId) return;

    setGroups((prev) => {
      let movedMember: Participant | null = null;

      const updated = prev.map((g) => {
        if (g.id === fromGroupId) {
          const found = g.members.find((m) => m.id === memberId);
          if (found) movedMember = found;
          const newMembers = g.members.filter((m) => m.id !== memberId);
          return {
            ...g,
            members: newMembers,
            leaderId: g.leaderId === memberId ? undefined : g.leaderId,
          };
        }
        return g;
      });

      if (!movedMember) return prev;

      return updated.map((g) => {
        if (g.id === toGroupId && movedMember) {
          return {
            ...g,
            members: [...g.members, movedMember],
          };
        }
        return g;
      });
    });
  };

  // Save renamed group
  const handleSaveGroupName = (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: editingGroupName.trim() } : g))
    );
    setEditingGroupId(null);
  };

  // Copy formatted text to clipboard
  const handleCopyFormattedGroups = () => {
    if (groups.length === 0) return;

    let text = `📋【分組名單結果】（共 ${participants.length} 人，分成 ${groups.length} 組）\n\n`;
    groups.forEach((g) => {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📍 ${g.name} (共 ${g.members.length} 人)\n`;
      g.members.forEach((m, idx) => {
        const isLeader = g.leaderId === m.id ? ' 👑 [組長]' : '';
        const dept = m.department ? ` (${m.department})` : '';
        text += `  ${idx + 1}. ${m.name}${dept}${isLeader}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-500/15 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3 border border-white/20 shadow-xs">
            <Users className="w-3.5 h-3.5 text-teal-200" />
            <span>團隊自動分組</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            視覺化團隊智慧分組
          </h2>
          <p className="mt-2 text-emerald-50 text-sm sm:text-base leading-relaxed">
            支援「依每組人數」或「依總組數」快速分配。提供獨家「跨部門均衡分組」演算法，避免同部門擠在同組；支援隨機隊長指派、手動微調換組與一鍵複製匯出。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
              <Users className="w-4 h-4 text-emerald-200" />
              <span>
                分組名單來源：<strong className="text-white text-sm ml-0.5">{participants.length}</strong> 人
              </span>
            </div>
            {groups.length > 0 && (
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
                <Layers className="w-4 h-4 text-teal-200" />
                <span>
                  已產生：<strong className="text-white text-sm ml-0.5">{groups.length}</strong> 組
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-teal-100 p-12 text-center shadow-md shadow-teal-500/5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">名冊尚未匯入名單</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            分組功能需要名單資料，請先至「名單管理」上傳 CSV、貼上姓名，或點擊上方「載入示範名單」！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Grouping Config (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-teal-100/80 shadow-md shadow-teal-500/5 p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <span>分組參數設定</span>
                </h3>
              </div>

              {/* Grouping Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  分組模式基準 <span className="text-emerald-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGroupingMode('by_size')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      groupingMode === 'by_size'
                        ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">🔘 依每組人數</span>
                      {groupingMode === 'by_size' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">固定每組幾人</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupingMode('by_count')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      groupingMode === 'by_count'
                        ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">🔘 依總組數</span>
                      {groupingMode === 'by_count' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">固定分成幾組</p>
                  </button>
                </div>
              </div>

              {/* Mode-specific input */}
              {groupingMode === 'by_size' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      每組設定人數
                    </label>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      預計分成 {calculatedGroupCount} 組
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPeoplePerGroup(num)}
                        className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                          peoplePerGroup === num
                            ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs scale-[1.02]'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {num} 人
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-semibold">自訂：</span>
                    <input
                      type="number"
                      min={1}
                      max={participants.length || 50}
                      value={peoplePerGroup}
                      onChange={(e) => setPeoplePerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-xs px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">人 / 每組</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      總共分成組數
                    </label>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      約每組 {Math.round(participants.length / Math.max(1, totalGroups))} 人
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTotalGroups(num)}
                        className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                          totalGroups === num
                            ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs scale-[1.02]'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {num} 組
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-semibold">自訂：</span>
                    <input
                      type="number"
                      min={1}
                      max={participants.length || 50}
                      value={totalGroups}
                      onChange={(e) => setTotalGroups(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-xs px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">組</span>
                  </div>
                </div>
              )}

              {/* Group Naming Theme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  組別命名風格
                </label>
                <select
                  value={namingTheme}
                  onChange={(e) => setNamingTheme(e.target.value as NamingTheme)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
                >
                  <option value="numbers">🔢 數字組 (第 1 組、第 2 組...)</option>
                  <option value="letters">🔤 字母組 (Team A、Team B...)</option>
                  <option value="colors">🎨 顏色戰隊 (紅隊、藍隊、綠隊...)</option>
                  <option value="animals">🦁 動物軍團 (飛鷹隊、猛虎隊...)</option>
                  <option value="planets">🪐 星際聯盟 (太陽隊、木星隊...)</option>
                  <option value="elements">⚡ 自然元素 (火焰組、海洋組...)</option>
                </select>
              </div>

              {/* Additional Options */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>跨部門均衡分散 (HR 推薦)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">避免同部門成員集中在同一小組</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={balanceDept}
                    onChange={(e) => setBalanceDept(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>每組隨機指派隊長</span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">自動隨機指定一位破冰帶領隊長</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAssignLeader}
                    onChange={(e) => setAutoAssignLeader(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                </label>
              </div>

              {/* Generate Button */}
              <button
                id="generate-groups-btn"
                type="button"
                onClick={generateGroups}
                disabled={isShuffling || participants.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
                <span>{groups.length > 0 ? '重新隨機洗牌分組' : '立即自動分組'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visualized Groups Kanban Display (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Bar for Results */}
            <div className="bg-white rounded-3xl border border-teal-100/80 shadow-md shadow-teal-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  分組看板預覽
                </h3>
                {groups.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    共 {groups.length} 組 / {participants.length} 人
                  </span>
                )}
              </div>

              {groups.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyFormattedGroups}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1.5 shadow-2xs"
                    title="複製整齊文字格式至剪貼簿"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>複製結果</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportGroupsToCSV(groups)}
                    className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors flex items-center space-x-1.5 shadow-2xs"
                    title="匯出分組 CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>匯出 CSV</span>
                  </button>
                </div>
              )}
            </div>

            {copiedNotification && (
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>已將分組名冊複製至剪貼簿，可直接貼至 LINE / Slack / Teams！</span>
              </div>
            )}

            {/* Groups Visualized Grid */}
            {groups.length === 0 ? (
              <div className="bg-white rounded-3xl border border-teal-100/80 p-16 text-center shadow-md shadow-teal-500/5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Shuffle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">尚未產生分組</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                  請在左側設定每組人數或組數，點擊「立即自動分組」按鈕，系統將自動完成視覺化分組！
                </p>
                <button
                  type="button"
                  onClick={generateGroups}
                  className="mt-5 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                >
                  立刻開始分組
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group, groupIdx) => {
                  const gradientClass = group.color.split(' ')[0] + ' ' + group.color.split(' ')[1];
                  return (
                    <div
                      key={group.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/50 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-slate-300"
                    >
                      {/* Group Header with Color Banner */}
                      <div className={`p-4 bg-gradient-to-r ${gradientClass} text-white flex items-center justify-between`}>
                        {editingGroupId === group.id ? (
                          <div className="flex items-center space-x-1.5 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName(group.id)}
                              autoFocus
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-black/20 text-white border border-white/40 w-full placeholder-white/60"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveGroupName(group.id)}
                              className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                            <h4 className="font-extrabold text-sm tracking-tight text-white flex items-center space-x-1.5">
                              <span>{group.name}</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGroupId(group.id);
                                setEditingGroupName(group.name);
                              }}
                              className="text-white/70 hover:text-white p-0.5 transition-colors"
                              title="重新命名此組"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-xs">
                          {group.members.length} 人
                        </span>
                      </div>

                      {/* Member Cards in Group */}
                      <div className="p-3.5 space-y-2 flex-1 bg-slate-50/60">
                        {group.members.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4 font-medium">此組尚無成員</p>
                        ) : (
                          group.members.map((member) => {
                            const isLeader = group.leaderId === member.id;
                            return (
                              <div
                                key={member.id}
                                className={`p-3 rounded-2xl border bg-white flex items-center justify-between transition-all shadow-2xs ${
                                  isLeader
                                    ? 'border-amber-300 ring-2 ring-amber-300/40 bg-amber-50/30'
                                    : 'border-slate-200/80 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                                      isLeader
                                        ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {isLeader ? '👑' : member.name.slice(0, 1)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-bold text-xs text-slate-900 truncate">
                                        {member.name}
                                      </span>
                                      {isLeader && (
                                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                          隊長
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium truncate">
                                      {member.department || '未分類'}{' '}
                                      {member.employeeId ? `・${member.employeeId}` : ''}
                                    </p>
                                  </div>
                                </div>

                                {/* Member Quick Controls */}
                                <div className="flex items-center space-x-1 shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLeader(group.id, member.id)}
                                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                                      isLeader
                                        ? 'text-amber-600 bg-amber-50'
                                        : 'text-slate-300 hover:text-amber-500'
                                    }`}
                                    title={isLeader ? '取消隊長頭銜' : '設為隊長'}
                                  >
                                    <Crown className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Move to other group selector */}
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleMoveMember(group.id, e.target.value, member.id);
                                      }
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1 text-slate-700 font-semibold cursor-pointer"
                                    title="換組至..."
                                  >
                                    <option value="" disabled>
                                      換組
                                    </option>
                                    {groups
                                      .filter((g) => g.id !== group.id)
                                      .map((targetG) => (
                                        <option key={targetG.id} value={targetG.id}>
                                          移至 {targetG.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
