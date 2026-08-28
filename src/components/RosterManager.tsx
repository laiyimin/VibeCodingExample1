import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  ClipboardCheck, 
  UserPlus, 
  Trash2, 
  Download, 
  Search, 
  Users, 
  Layers, 
  FileText, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Participant } from '../types';
import { 
  parseCSVString, 
  parsePastedText, 
  downloadSampleCSV, 
  exportParticipantsToCSV 
} from '../utils/csvParser';

interface RosterManagerProps {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onGoToDraw: () => void;
  onGoToGrouping: () => void;
}

const AVATAR_GRADIENTS = [
  'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white',
  'bg-gradient-to-tr from-pink-500 to-rose-600 text-white',
  'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white',
  'bg-gradient-to-tr from-amber-500 to-orange-600 text-white',
  'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white',
  'bg-gradient-to-tr from-fuchsia-500 to-pink-600 text-white',
  'bg-gradient-to-tr from-violet-500 to-indigo-600 text-white',
];

export const RosterManager: React.FC<RosterManagerProps> = ({
  participants,
  setParticipants,
  onGoToDraw,
  onGoToGrouping,
}) => {
  const [importMethod, setImportMethod] = useState<'csv' | 'paste' | 'manual'>('csv');
  const [pasteContent, setPasteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Manual single add form state
  const [manualName, setManualName] = useState('');
  const [manualDept, setManualDept] = useState('');
  const [manualId, setManualId] = useState('');

  // Table filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Departments list and statistics
  const departments = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.department && p.department.trim()) {
        set.add(p.department.trim());
      }
    });
    return Array.from(set);
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.employeeId && p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchDept = selectedDept === 'ALL' || (p.department || '未分類') === selectedDept;

      return matchSearch && matchDept;
    });
  }, [participants, searchTerm, selectedDept]);

  const showNotification = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(msg);
      setSuccessMessage(null);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          showNotification('error', '檔案內容為空');
          return;
        }
        const parsed = parseCSVString(text);
        if (parsed.length === 0) {
          // Try parse as plain text
          const fallbackParsed = parsePastedText(text);
          if (fallbackParsed.length === 0) {
            showNotification('error', '無法從檔案中解析出姓名，請檢查檔案內容');
            return;
          }
          setParticipants((prev) => [...prev, ...fallbackParsed]);
          showNotification('success', `成功匯入 ${fallbackParsed.length} 位人員名單！`);
        } else {
          setParticipants((prev) => [...prev, ...parsed]);
          showNotification('success', `成功匯入 ${parsed.length} 位人員名單！`);
        }
      } catch {
        showNotification('error', '讀取 CSV 檔案失敗，請確認編碼為 UTF-8');
      }
    };
    reader.onerror = () => {
      showNotification('error', '檔案讀取異常');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      showNotification('error', '請先貼上姓名清單');
      return;
    }
    const parsed = parsePastedText(pasteContent);
    if (parsed.length === 0) {
      showNotification('error', '未檢測到有效姓名');
      return;
    }
    setParticipants((prev) => [...prev, ...parsed]);
    showNotification('success', `成功自文字貼上匯入 ${parsed.length} 位人員！`);
    setPasteContent('');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      showNotification('error', '請輸入姓名');
      return;
    }
    const newPerson: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: manualName.trim(),
      department: manualDept.trim() || undefined,
      employeeId: manualId.trim() || undefined,
    };
    setParticipants((prev) => [newPerson, ...prev]);
    showNotification('success', `已新增成員「${newPerson.name}」！`);
    setManualName('');
    setManualDept('');
    setManualId('');
  };

  const handleDeletePerson = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeduplicate = () => {
    const seen = new Set<string>();
    const unique: Participant[] = [];
    let dupCount = 0;
    participants.forEach((p) => {
      const key = `${p.name}_${p.department || ''}_${p.employeeId || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      } else {
        dupCount++;
      }
    });

    if (dupCount > 0) {
      setParticipants(unique);
      showNotification('success', `已移除 ${dupCount} 筆重複名單！`);
    } else {
      showNotification('success', '名單中無重複人員。');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Intro */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-indigo-200 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-indigo-100 text-xs font-bold mb-3 border border-white/20 shadow-xs">
            <Users className="w-3.5 h-3.5 text-indigo-200" />
            <span>名冊來源管理</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            匯入員工與活動參與者名冊
          </h2>
          <p className="mt-2 text-indigo-100/90 text-sm sm:text-base leading-relaxed">
            支援上傳 CSV / Excel 轉存檔案，或直接自剪貼簿（Excel、LINE、Slack）貼上一行一姓名。名單可立即無縫用於「獎品隨機抽籤」與「團隊自動分組」。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
              <Users className="w-4 h-4 text-emerald-300" />
              <span>名冊總人數：<strong className="text-white text-sm ml-0.5">{participants.length}</strong> 人</span>
            </div>
            {departments.length > 0 && (
              <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
                <Layers className="w-4 h-4 text-amber-300" />
                <span>部門數量：<strong className="text-white text-sm ml-0.5">{departments.length}</strong> 個</span>
              </div>
            )}
            {participants.length > 0 && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  type="button"
                  onClick={onGoToDraw}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/25 flex items-center space-x-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>前往抽籤 &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToGrouping}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center space-x-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>前往分組 &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center space-x-2.5 text-sm shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 flex items-center space-x-2.5 text-sm shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Import Options, Right Data List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Import Workspace (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-indigo-100/80 shadow-md shadow-indigo-500/5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <span>名單來源匯入</span>
              </h3>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200/60"
                title="下載範例 CSV 格式"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>下載 CSV 範本</span>
              </button>
            </div>

            {/* Import Mode Selector with Vibrant Pill Tab */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1.5 rounded-2xl mb-5 text-xs font-bold border border-slate-200/70">
              <button
                type="button"
                onClick={() => setImportMethod('csv')}
                className={`py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  importMethod === 'csv'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>上傳 CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMethod('paste')}
                className={`py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  importMethod === 'paste'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>貼上姓名</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMethod('manual')}
                className={`py-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  importMethod === 'manual'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>單筆新增</span>
              </button>
            </div>

            {/* Mode 1: CSV Upload */}
            {importMethod === 'csv' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99] ring-4 ring-indigo-500/20'
                      : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/25">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    點擊選擇或將 CSV 檔案拖曳至此
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支援 UTF-8 編碼之 .csv 與 .txt 格式
                  </p>
                  <div className="mt-3.5 inline-flex items-center px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-2xs">
                    欄位格式：姓名（必填）、部門、工號
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>CSV 格式範例：</span>
                  </div>
                  <pre className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 font-mono overflow-x-auto">
姓名,部門,工號
陳冠宇,工程部,RD001
張雅雯,產品設計部,PD001
王品涵,人力資源部,HR001</pre>
                </div>
              </div>
            )}

            {/* Mode 2: Paste text */}
            {importMethod === 'paste' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      直接貼上人員名單（支援多種分隔）
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">一行一個姓名</span>
                  </div>
                  <textarea
                    rows={6}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder={`陳冠宇, 工程部\n林佳蓉, 工程部\n黃俊傑\n張雅雯, 產品設計部\n王品涵, 人力資源部`}
                    className="w-full text-xs font-mono p-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-500 font-medium">
                    可從 Excel 表格直接複製兩欄貼上
                  </p>
                  <button
                    id="submit-paste-btn"
                    type="button"
                    onClick={handlePasteSubmit}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-1.5"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>確認匯入名單</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Single manual add */}
            {importMethod === 'manual' && (
              <form onSubmit={handleManualAdd} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    姓名 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="例：王小明"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      部門 / 組別 (選填)
                    </label>
                    <input
                      type="text"
                      value={manualDept}
                      onChange={(e) => setManualDept(e.target.value)}
                      placeholder="例：行銷企劃部"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      員工工號 (選填)
                    </label>
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      placeholder="例：MK008"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>加入名冊清單</span>
                </button>
              </form>
            )}
          </div>

          {/* Quick Roster Actions & Stats */}
          <div className="bg-white rounded-3xl border border-indigo-100/80 shadow-md shadow-indigo-500/5 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              名冊批次整理工具
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDeduplicate}
                disabled={participants.length === 0}
                className="px-3.5 py-2 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-100/60 text-xs font-bold text-amber-900 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>一鍵消除重複</span>
              </button>

              <button
                type="button"
                onClick={() => exportParticipantsToCSV(participants)}
                disabled={participants.length === 0}
                className="px-3.5 py-2 rounded-xl border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100/60 text-xs font-bold text-indigo-900 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>匯出名單 CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Participant List & Details (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-indigo-100/80 shadow-md shadow-indigo-500/5 overflow-hidden">
            {/* Header with Search & Filter */}
            <div className="p-5 border-b border-slate-100 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <span>名冊預覽明細</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                      顯示 {filteredParticipants.length} / {participants.length} 人
                    </span>
                  </h3>
                </div>

                {participants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('確定要清空所有名單嗎？')) {
                        setParticipants([]);
                        showNotification('success', '已清空所有名冊');
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-bold transition-colors self-start sm:self-auto flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空名單</span>
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                <div className="sm:col-span-7 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜尋姓名、部門、工號..."
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-5 relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 font-bold"
                  >
                    <option value="ALL">全部部門 ({participants.length})</option>
                    {departments.map((dept) => {
                      const count = participants.filter((p) => p.department === dept).length;
                      return (
                        <option key={dept} value={dept}>
                          {dept} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* List Body */}
            {participants.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">目前尚無人員名單</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  請從左側上傳 CSV 檔案、貼上名單，或點擊右上角「載入示範名單」快速體驗！
                </p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                查無符合「{searchTerm}」之人員
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 sticky top-0 z-10 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">姓名</th>
                      <th className="py-3 px-4">部門</th>
                      <th className="py-3 px-4">工號</th>
                      <th className="py-3 px-4 text-right w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParticipants.map((p, idx) => {
                      const gradientClass = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                      return (
                        <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs ${gradientClass}`}>
                              {p.name.slice(0, 1)}
                            </div>
                            <span>{p.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            {p.department ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50/70 text-indigo-700 border border-indigo-100">
                                {p.department}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">未指定</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {p.employeeId || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePerson(p.id)}
                              title="刪除此成員"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
