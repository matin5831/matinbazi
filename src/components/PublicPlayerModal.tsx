import React, { useState } from 'react';
import { Campaign, Prize } from '../types';
import { LuckyWheel } from './Games/LuckyWheel';
import { ScratchCard } from './Games/ScratchCard';
import { SlotMachine } from './Games/SlotMachine';
import { MysteryBox } from './Games/MysteryBox';
import { addLead, normalizePhoneNumber } from '../utils/storage';
import { X, Instagram, Phone, Sparkles, Copy, Check, ExternalLink, Gift, Lock, ShieldCheck } from 'lucide-react';

interface PublicPlayerModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export const PublicPlayerModal: React.FC<PublicPlayerModalProps> = ({ campaign, onClose }) => {
  const [instagramHandle, setInstagramHandle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'PLAY' | 'RESULT'>('INPUT');
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputError, setInputError] = useState('');

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    if (campaign.requireInstagramFollow && !instagramHandle.trim()) {
      setInputError('لطفا آیدی اینستاگرام خود را وارد کنید.');
      return;
    }

    if (campaign.requirePhoneNumber) {
      const cleanPhone = normalizePhoneNumber(phoneNumber);
      if (!/^09\d{9}$/.test(cleanPhone)) {
        setInputError('شماره همراه باید با 09 شروع شود و دقیقاً ۱۱ رقم باشد (مثلا 09123456789).');
        return;
      }
    }

    setStep('PLAY');
  };

  const handleGameFinish = (prize: Prize) => {
    setWonPrize(prize);

    // Save lead data
    addLead({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      instagramHandle: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
      phoneNumber: phoneNumber || 'ثبت نشده',
      prizeWon: prize.label,
      couponCode: prize.couponCode,
      gameType: campaign.gameType,
    });

    setTimeout(() => {
      setStep('RESULT');
    }, 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto dir-rtl">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* Header Bar */}
        <div className={`p-4 bg-gradient-to-r ${campaign.bgGradient} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            {campaign.storeLogoUrl ? (
              <img src={campaign.storeLogoUrl} alt={campaign.storeName} className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-slate-950">
                {campaign.storeName.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">{campaign.storeName}</h4>
              <a
                href={`https://instagram.com/${campaign.storeInstagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
              >
                <Instagram className="w-3 h-3" />
                <span>@{campaign.storeInstagram}</span>
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900/60 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5">
          {step === 'INPUT' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 text-[11px] px-3 py-1 rounded-full border border-amber-500/30 mb-2 font-medium">
                  <Sparkles className="w-3 h-3" /> کمپین شانس‌تخفیف مشتریان
                </span>
                <h3 className="text-lg font-black text-white leading-snug">
                  {campaign.customHeadline || campaign.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {campaign.customSubheadline || 'اطلاعات خودتون رو وارد کنید تا شانس برنده شدن کد تخفیف رو داشته باشید!'}
                </p>
              </div>

              {inputError && (
                <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl text-center">
                  {inputError}
                </div>
              )}

              <form onSubmit={handleStartGame} className="space-y-3.5 mt-4">
                {campaign.requireInstagramFollow && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">آیدی اینستاگرام شما</label>
                    <div className="relative">
                      <Instagram className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="text"
                        placeholder="my_instagram_id@"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requirePhoneNumber && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">شماره همراه (جهت دریافت پیامک کد تخفیف)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="tel"
                        placeholder="09123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requireInstagramFollow && (
                  <label className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFollowed}
                      onChange={(e) => setIsFollowed(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 rounded"
                    />
                    <span className="text-xs text-slate-300">
                      پیج <strong className="text-amber-300">@{campaign.storeInstagram}</strong> را فالو کرده‌ام
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ورود به بازی و دریافت جایزه</span>
                </button>
              </form>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300 pt-2 border-t border-slate-800/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>اطلاعات شما نزد فروشگاه کاملاً محفوظ است</span>
              </div>
            </div>
          )}

          {step === 'PLAY' && (
            <div className="py-2">
              <div className="text-center mb-4">
                <h3 className="text-sm font-bold text-slate-200">فرصت برنده شدن شما فعال شد! 🎯</h3>
              </div>

              {campaign.gameType === 'WHEEL' && (
                <LuckyWheel prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {campaign.gameType === 'SCRATCH' && (
                <ScratchCard prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {campaign.gameType === 'SLOT' && (
                <SlotMachine prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {campaign.gameType === 'MYSTERY_BOX' && (
                <MysteryBox prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
            </div>
          )}

          {step === 'RESULT' && wonPrize && (
            <div className="text-center py-3 space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Gift className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {wonPrize.isWin ? '🎉 تبریک! شما برنده شدید' : 'ممنون از شرکت شما'}
                </span>
                <h3 className="text-xl font-black text-white mt-1 leading-snug">
                  {wonPrize.label}
                </h3>
                {wonPrize.subLabel && (
                  <p className="text-xs text-slate-300 mt-1">{wonPrize.subLabel}</p>
                )}
              </div>

              {wonPrize.couponCode ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 relative">
                  <span className="text-[10px] text-slate-300 block mb-1">کد تخفیف اختصاصی شما:</span>
                  <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 font-mono text-base font-bold text-amber-300 dir-ltr">
                    <span>{wonPrize.couponCode}</span>
                    <button
                      onClick={() => copyToClipboard(wonPrize.couponCode)}
                      className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copiedCode && <span className="text-[10px] text-emerald-400 mt-1 block">کد با موفقیت کپی شد!</span>}
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl">
                  امیدواریم در فرصت بعدی برنده جایزه ویژه ما بشید!
                </div>
              )}

              {campaign.customTerms && (
                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                  📌 {campaign.customTerms}
                </p>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`https://instagram.com/${campaign.storeInstagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 hover:from-amber-400 hover:to-orange-500 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>ورود به پیج و خرید از فروشگاه</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
