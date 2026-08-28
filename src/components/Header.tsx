import React from 'react';
import { Sparkles, Gift, Users, UploadCloud, Volume2, VolumeX, RefreshCw, Trash2 } from 'lucide-react';
import { Participant } from '../types';

interface HeaderProps {
  activeTab: 'roster' | 'draw' | 'grouping';
  setActiveTab: (tab: 'roster' | 'draw' | 'grouping') => void;
  participants: Participant[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLoadDemoData: () => void;
  onClearData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  participants,
  soundEnabled,
  onToggleSound,
  onLoadDemoData,
  onClearData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-indigo-100/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-white">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  HR 活動抽籤與分組助手
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                  {participants.length} 位人員
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                CSV 批次匯入・動態抽獎舞台・跨部門智慧分組
              </p>
            </div>
          </div>

          {/* Navigation Tabs with Vibrant Active States */}
          <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner">
            <button
              id="tab-roster-btn"
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'roster'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>名單管理</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                  activeTab === 'roster'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {participants.length}
              </span>
            </button>

            <button
              id="tab-draw-btn"
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'draw'
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>獎品抽籤</span>
            </button>

            <button
              id="tab-grouping-btn"
              type="button"
              onClick={() => setActiveTab('grouping')}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'grouping'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>自動分組</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <button
              id="sound-toggle-btn"
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? '關閉音效' : '開啟音效'}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              id="load-demo-btn"
              type="button"
              onClick={onLoadDemoData}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>載入示範名單 (24人)</span>
            </button>

            {participants.length > 0 && (
              <button
                id="clear-data-btn"
                type="button"
                onClick={onClearData}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs font-medium transition-all shadow-2xs"
                title="清空名單"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
