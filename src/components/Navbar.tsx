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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo & Store Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-600 to-indigo-600 p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300 font-black text-lg">
                🚀
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight">متین بازی</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                  Matin Bazi
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">پلتفرم گیمیفیکیشن و بازاریابی تعاملی اینستاگرام</p>
            </div>
          </div>

          {/* Store Quick Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl mr-4">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">{storeSettings.storeName}</span>
            <span className="text-[10px] text-slate-500 dir-ltr">@{storeSettings.instagramUsername}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>کمپین‌ها و بازی‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>آمار و لیدها</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات</span>
          </button>

          {onLockPanel && (
            <button
              onClick={onLockPanel}
              title="قفل کردن پنل ادمین"
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 border border-amber-400/20 transition-all flex items-center gap-1 cursor-pointer mr-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">قفل پنل</span>
            </button>
          )}
        </nav>

      </div>
    </header>
  );
};
