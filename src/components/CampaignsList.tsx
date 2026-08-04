import React, { useState } from 'react';
import { Campaign } from '../types';
import { Plus, Play, Copy, Check, Edit3, Trash2, Power, Sparkles, ExternalLink, QrCode, Users, Award, Share2, RotateCcw } from 'lucide-react';

interface CampaignsListProps {
  campaigns: Campaign[];
  onCreateNew: () => void;
  onEdit: (campaign: Campaign) => void;
  onPlayDemo: (campaign: Campaign) => void;
  onToggleActive: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
  onResetCampaign?: (campaignId: string) => void;
}

export const CampaignsList: React.FC<CampaignsListProps> = ({
  campaigns,
  onCreateNew,
  onEdit,
  onPlayDemo,
  onToggleActive,
  onDelete,
  onResetCampaign,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCampaignLink = (campaign: Campaign) => {
    const url = `${window.location.origin}?campaign=${campaign.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(campaign.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getGameBadge = (gameType: string) => {
    switch (gameType) {
      case 'ALL':
        return { label: 'همه بازی‌ها', icon: '🎮', color: 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border-amber-500/40' };
      case 'WHEEL':
        return { label: 'گردونه شانس', icon: '🎡', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'SCRATCH':
        return { label: 'کارت اسکرچ', icon: '🪙', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'SLOT':
        return { label: 'ماشین اسلات', icon: '🎰', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
      case 'MYSTERY_BOX':
        return { label: 'جعبه شانس', icon: '🎁', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
      default:
        return { label: 'بازی آنلاین', icon: '🎮', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    }
  };

  return (
    <div className="space-y-6 dir-rtl animate-fade-in">
      
      {/* Top Banner Callout */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/40 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> افزایش تعامل و تعویض فالوور به مشتری
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              کمپین‌های گیمیفیکیشن اینستاگرام فروشگاه شما
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              با ایجاد بازی‌های گردونه شانس، اسکرچ، اسلات و کوییز، فالوورهای پیج را تشویق به بازی، ارائه شماره همراه و دریافت کد تخفیف اختصاصی کنید.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer border-2 border-yellow-200"
          >
            <Plus className="w-5 h-5 text-slate-950" />
            <span>ایجاد کمپین جدید</span>
          </button>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp) => {
          const badge = getGameBadge(camp.gameType);
          return (
            <div
              key={camp.id}
              className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden ${
                camp.isActive ? 'border-slate-800 hover:border-amber-500/40' : 'border-slate-800/50 opacity-70'
              }`}
            >
              <div>
                {/* Header Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-bold ${badge.color}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      {camp.useDefaultStoreInfo ?? true ? 'اطلاعات عمومی' : 'اطلاعات اختصاصی'}
                    </span>
                  </div>

                  <button
                    onClick={() => onToggleActive(camp.id)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border transition-colors cursor-pointer shrink-0 ${
                      camp.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{camp.isActive ? 'فعال' : 'غیرفعال'}</span>
                  </button>
                </div>

                {/* Campaign Title & Description */}
                <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                  {camp.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {camp.description}
                </p>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">تعداد بازی</span>
                      <strong className="text-xs text-white">{camp.totalPlays.toLocaleString('fa-IR')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">برندگان</span>
                      <strong className="text-xs text-amber-300">{camp.totalWinners.toLocaleString('fa-IR')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                
                {/* Primary Demo Play Button */}
                <button
                  onClick={() => onPlayDemo(camp)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>تست و اجرای زنده بازی (نمای مشتری)</span>
                </button>

                {/* Secondary Copy & Edit Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyCampaignLink(camp)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === camp.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{copiedId === camp.id ? 'کپی شد!' : 'کپی لینک استوری'}</span>
                  </button>

                  <button
                    onClick={() => onEdit(camp)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ویرایش کمپین</span>
                  </button>
                </div>

                {/* Reset & Delete Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {onResetCampaign && (
                    <button
                      onClick={() => onResetCampaign(camp.id)}
                      className="py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="پاکسازی تاریخچه شرکت‌کنندگان این کمپین جهت شروع مجدد"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>شروع مجدد کمپین</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(camp.id)}
                    className="py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>حذف کمپین</span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
