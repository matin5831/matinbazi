import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { Sparkles, Globe, LayoutDashboard, Gift, Settings, Instagram, Store, ArrowUpRight, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'CAMPAIGNS' | 'ANALYTICS' | 'SETTINGS';
  setActiveTab: (tab: 'CAMPAIGNS' | 'ANALYTICS' | 'SETTINGS') => void;
  storeSettings: StoreSettings;
  onOpenNetlifyModal: () => void;
  onLockPanel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storeSettings,
  onOpenNetlifyModal,
  onLockPanel
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 dir-rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Brand Logo & Store Badge */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-600 to-indigo-600 p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.3)] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300 font-black text-base sm:text-lg">
                🚀
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">متین بازی</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                  Matin Bazi
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:block sm:block">پلتفرم گیمیفیکیشن و بازاریابی تعاملی اینستاگرام</p>
            </div>
          </div>

          {/* Store Quick Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl sm:mr-4">
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-200 truncate max-w-[100px] xs:max-w-none">{storeSettings.storeName}</span>
            <span className="text-[10px] text-slate-500 dir-ltr hidden xs:inline">@{storeSettings.instagramUsername}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center justify-center w-full sm:w-auto gap-1 bg-slate-900 p-1 sm:p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span>کمپین‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'ANALYTICS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span>آمار و لیدها</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>تنظیمات</span>
          </button>

          {onLockPanel && (
            <button
              onClick={onLockPanel}
              title="قفل کردن پنل ادمین"
              className="px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 border border-amber-400/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">قفل</span>
            </button>
          )}
        </nav>

      </div>
    </header>
  );
};
