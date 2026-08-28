/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RosterManager } from './components/RosterManager';
import { LuckyDraw } from './components/LuckyDraw';
import { AutoGrouping } from './components/AutoGrouping';
import { Participant } from './types';
import { DEMO_PARTICIPANTS } from './utils/demoData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roster' | 'draw' | 'grouping'>('roster');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize participants from localStorage or default to demo data
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem('hr_participants_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEMO_PARTICIPANTS;
  });

  // Save to localStorage when participants change
  useEffect(() => {
    try {
      localStorage.setItem('hr_participants_v1', JSON.stringify(participants));
    } catch {
      // ignore
    }
  }, [participants]);

  const handleLoadDemoData = () => {
    setParticipants(DEMO_PARTICIPANTS);
  };

  const handleClearData = () => {
    if (window.confirm('確定要清空目前所有的名單資料嗎？')) {
      setParticipants([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-slate-50 to-pink-50/40 text-slate-800 flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased relative">
      {/* Subtle background ambient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl" />
      </div>

      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participants={participants}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onLoadDemoData={handleLoadDemoData}
        onClearData={handleClearData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'roster' && (
          <RosterManager
            participants={participants}
            setParticipants={setParticipants}
            onGoToDraw={() => setActiveTab('draw')}
            onGoToGrouping={() => setActiveTab('grouping')}
          />
        )}

        {activeTab === 'draw' && (
          <LuckyDraw
            participants={participants}
            soundEnabled={soundEnabled}
          />
        )}

        {activeTab === 'grouping' && (
          <AutoGrouping
            participants={participants}
            soundEnabled={soundEnabled}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© HR 活動抽籤與團隊智慧分組助手 ・ 支援 CSV 匯入、貼上姓名、隨機抽獎與視覺化分組</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              本地端安全運算保護
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

