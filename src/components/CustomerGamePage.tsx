import React, { useState } from 'react';
import { Campaign, Prize, GameType, ALL_GAME_TYPES, APP_VERSION } from '../types';
import { LuckyWheel } from './Games/LuckyWheel';
import { ScratchCard } from './Games/ScratchCard';
import { SlotMachine } from './Games/SlotMachine';
import { QuizGame } from './Games/QuizGame';
import { MysteryBox } from './Games/MysteryBox';
import { addLeadToServer, checkDuplicateOnServer } from '../utils/api';
import { addLead, getStoredSettings, getStoredLeads, normalizePhoneNumber } from '../utils/storage';
import { createWooCommerceCoupon } from '../utils/woocommerce';
import { Instagram, Phone, Sparkles, Copy, Check, ExternalLink, Gift, ShieldCheck, ArrowRight, ShoppingBag, Frown, AlertTriangle, Send } from 'lucide-react';

interface CustomerGamePageProps {
  campaign: Campaign;
  onGoToAdmin?: () => void;
}

export const CustomerGamePage: React.FC<CustomerGamePageProps> = ({ campaign, onGoToAdmin }) => {
  const storeSettings = getStoredSettings();
  const useDefault = campaign.useDefaultStoreInfo ?? true;

  const storeName = useDefault
    ? (storeSettings.storeName || campaign.storeName || 'فروشگاه آنلاین')
    : (campaign.storeName || storeSettings.storeName || 'فروشگاه آنلاین');

  const storeInstagram = useDefault
    ? ((storeSettings.instagramUsername || campaign.storeInstagram || '').replace('@', ''))
    : ((campaign.storeInstagram || storeSettings.instagramUsername || '').replace('@', ''));

  const storeLogoUrl = useDefault
    ? (storeSettings.logoUrl || campaign.storeLogoUrl || '')
    : (campaign.storeLogoUrl || storeSettings.logoUrl || '');

  const storeWebsiteUrl = useDefault
    ? (storeSettings.websiteUrl || campaign.storeWebsiteUrl || '')
    : (campaign.storeWebsiteUrl || storeSettings.websiteUrl || '');

  const [instagramHandle, setInstagramHandle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInstagramFollowed, setIsInstagramFollowed] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'HUB' | 'PLAY' | 'RESULT'>('INPUT');
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputError, setInputError] = useState('');
  const [wooStatusMessage, setWooStatusMessage] = useState<string | null>(null);
  const [sentToAdminCopied, setSentToAdminCopied] = useState(false);

  // ALL-games campaign (hub) state
  const isAllGames = campaign.gameType === 'ALL';
  const [activeGame, setActiveGame] = useState<GameType>('WHEEL');
  const [playedGames, setPlayedGames] = useState<Set<string>>(new Set());
  const [hubLoading, setHubLoading] = useState(false);

  const GAME_META: { type: GameType; label: string; icon: string; desc: string; color: string }[] = [
    { type: 'WHEEL', label: 'گردونه شانس', icon: '🎡', desc: 'شانس خود را بچرخانید', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    { type: 'SCRATCH', label: 'کارت اسکرچ', icon: '🪙', desc: 'خط بکشید و جایزه بگیرید', color: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
    { type: 'SLOT', label: 'ماشین اسلات', icon: '🎰', desc: 'سه نماد هم‌راستا', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    { type: 'QUIZ', label: 'کوییز و آزمون', icon: '🧠', desc: 'به سوالات پاسخ دهید', color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' },
    { type: 'MYSTERY_BOX', label: 'جعبه شانس', icon: '🎁', desc: 'یک جعبه باز کنید', color: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  ];

  const refreshPlayedGames = async () => {
    if (!isAllGames) return;
    setHubLoading(true);
    const cleanIg = instagramHandle.trim().toLowerCase().replace(/^@/, '');
    const cleanPhone = phoneNumber.trim();
    const results = await Promise.all(
      ALL_GAME_TYPES.map(async (gt) => {
        const res = await checkDuplicateOnServer({
          campaignId: campaign.id,
          instagramHandle: cleanIg,
          phoneNumber: cleanPhone,
          gameType: gt,
        });
        return { gt, played: res.duplicate };
      })
    );
    setPlayedGames(new Set(results.filter(r => r.played).map(r => r.gt)));
    setHubLoading(false);
  };

  const handleSelectGame = async (gt: GameType) => {
    if (playedGames.has(gt)) {
      setInputError('شما قبلاً این بازی را انجام داده‌اید. هر بازی فقط یک بار مجاز است!');
      return;
    }
    const cleanIg = instagramHandle.trim().toLowerCase().replace(/^@/, '');
    const cleanPhone = phoneNumber.trim();
    const check = await checkDuplicateOnServer({
      campaignId: campaign.id,
      instagramHandle: cleanIg,
      phoneNumber: cleanPhone,
      gameType: gt,
    });
    if (check.duplicate) {
      setInputError('شما قبلاً این بازی را انجام داده‌اید. هر بازی فقط یک بار مجاز است!');
      setPlayedGames(prev => new Set(prev).add(gt));
      return;
    }
    setActiveGame(gt);
    setInputError('');
    setStep('PLAY');
  };

  const handleSendToAdmin = () => {
    const handleClean = instagramHandle.trim().replace(/^@/, '');
    const winMessage = `سلام وقت بخیر! 🎁\nمن در کمپین "${campaign.title}" برنده شدم.\n🏆 جایزه: ${wonPrize?.label || 'جایزه ویژه'}\n${wonPrize?.couponCode ? `🎟 کد تخفیف: ${wonPrize.couponCode}\n` : ''}📱 شماره همراه: ${phoneNumber || 'ثبت نشده'}\n🆔 آیدی اینستاگرام: ${handleClean ? `@${handleClean}` : 'ثبت نشده'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(winMessage);
      setSentToAdminCopied(true);
      setTimeout(() => setSentToAdminCopied(false), 4000);
    }

    if (storeInstagram) {
      const cleanInsta = storeInstagram.trim().replace(/^@/, '');
      window.open(`https://instagram.com/${cleanInsta}`, '_blank');
    }
  };

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    if (campaign.requireInstagramFollow) {
      if (!instagramHandle.trim()) {
        setInputError('لطفا آیدی اینستاگرام خود را وارد کنید.');
        return;
      }
      if (!isInstagramFollowed) {
        setInputError('لطفاً ابتدا پیج اینستاگرام را فالو کنید و تیک تأیید فالو را بزنید.');
        return;
      }
    }

    if (campaign.requirePhoneNumber) {
      if (!phoneNumber.trim() || phoneNumber.length < 10) {
        setInputError('لطفا شماره همراه معتبر (مثلا 09123456789) وارد کنید.');
        return;
      }
    }

    // Check if user has already participated in this campaign
    // Normalize: Persian/Arabic digits → English, strip @, spaces, +98 → 0
    const cleanIg = instagramHandle.trim().toLowerCase().replace(/^@/, '');
    const cleanPhone = normalizePhoneNumber(phoneNumber);

    // ALL-games campaign: no pre-check here — each game is checked in the hub
    if (isAllGames) {
      setStep('HUB');
      refreshPlayedGames();
      return;
    }

    // ⛔ Server-authoritative check (bypass-proof: clearing browser storage won't help)
    const serverCheck = await checkDuplicateOnServer({
      campaignId: campaign.id,
      instagramHandle: cleanIg,
      phoneNumber: cleanPhone,
      gameType: campaign.gameType,
    });

    if (serverCheck.duplicate) {
      setInputError('شما قبلاً با این آیدی اینستاگرام یا شماره همراه در این کمپین شرکت کرده‌اید. هر آیدی و شماره فقط یک بار مجاز به شرکت می‌باشد.');
      return;
    }

    if (serverCheck.offline) {
      // Server unreachable (local dev) → local duplicate check fallback
      const existingLeads = getStoredLeads();
      const alreadyPlayed = existingLeads.some(lead => {
        if (lead.campaignId !== campaign.id) return false;

        const leadIg = (lead.instagramHandle || '').trim().toLowerCase().replace(/^@/, '');
        const leadPhone = normalizePhoneNumber(lead.phoneNumber || '');

        const matchIg = cleanIg.length >= 3 && leadIg.length >= 3 && cleanIg === leadIg;
        const matchPhone = cleanPhone.length >= 10 && leadPhone.length >= 10 && cleanPhone === leadPhone;

        return matchIg || matchPhone;
      });

      if (alreadyPlayed) {
        setInputError('شما قبلاً با این آیدی اینستاگرام یا شماره همراه در این کمپین شرکت کرده‌اید. هر آیدی و شماره فقط یک بار مجاز به شرکت می‌باشد.');
        return;
      }
    }

    setStep('PLAY');
  };

  const handleGameFinish = async (prize: Prize) => {
    setWonPrize(prize);

    // For ALL-games campaigns, record which game was played
    const recordedGameType: GameType = isAllGames ? activeGame : campaign.gameType;

    // Save lead data — server-authoritative (Redis backend), local fallback for dev
    const serverRes = await addLeadToServer({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      instagramHandle: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
      phoneNumber: phoneNumber || 'ثبت نشده',
      prizeWon: prize.label,
      couponCode: prize.couponCode,
      gameType: recordedGameType,
    });

    if (serverRes.error === 'already_played') {
      // Server rejected — user already played this game
      setInputError('شما قبلاً این بازی را انجام داده‌اید. هر بازی فقط یک بار مجاز است.');
      if (isAllGames) {
        setPlayedGames(prev => new Set(prev).add(recordedGameType));
        setStep('HUB');
      } else {
        setStep('INPUT');
      }
      return;
    }

    // Sync local storage copy too (keeps dashboard consistent in dev/offline mode)
    if (!serverRes.lead) {
      addLead({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        instagramHandle: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
        phoneNumber: phoneNumber || 'ثبت نشده',
        prizeWon: prize.label,
        couponCode: prize.couponCode,
        gameType: recordedGameType,
      });
    }

    // Auto sync coupon code to WooCommerce if enabled
    if (prize.couponCode) {
      const settings = getStoredSettings();
      if (settings.enableWooCommerce) {
        setWooStatusMessage('در حال ثبت کد تخفیف در فروشگاه ووکامرس...');
        const wooRes = await createWooCommerceCoupon(settings, {
          code: prize.couponCode,
          amount: prize.discountPercent || 10,
          discountType: 'percent',
          description: `کد تخفیف کمپین ${campaign.title} برای کاربر ${instagramHandle || phoneNumber}`,
        });
        if (wooRes.success) {
          setWooStatusMessage('✅ کد تخفیف با موفقیت روی سایت فروشگاه شما فعال شد!');
        } else {
          setWooStatusMessage(`⚠️ کد تخفیف آمادست (پیام ووکامرس: ${wooRes.message})`);
        }
      }
    }

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 dir-rtl font-['Vazirmatn',sans-serif]">
      
      {/* Top Store Header */}
      <header className="w-full max-w-md pt-2 pb-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {storeLogoUrl ? (
            <img src={storeLogoUrl} alt={storeName} className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-lg" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-lg text-slate-950 shadow-lg">
              {storeName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-base font-black text-white leading-tight">{storeName}</h1>
            {storeInstagram && (
              <a
                href={`https://instagram.com/${storeInstagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-300 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>@{storeInstagram}</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 text-[11px] px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-400" /> مسابقه و هدیه
          </span>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="w-full max-w-md my-auto py-6">
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: INPUT FORM */}
          {step === 'INPUT' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-block">
                  گردونه شانس و جوایز ویژه
                </span>
                <h2 className="text-xl font-black text-white leading-snug">
                  {campaign.customHeadline || campaign.title}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {campaign.customSubheadline || 'اطلاعات خود را وارد کنید تا شانس برنده شدن کد تخفیف ویژه فروشگاه ما را داشته باشید!'}
                </p>
              </div>

              {inputError && (
                <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-2xl text-center animate-shake">
                  {inputError}
                </div>
              )}

              <form onSubmit={handleStartGame} className="space-y-4">
                {campaign.requireInstagramFollow && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">آیدی اینستاگرام شما</label>
                    <div className="relative">
                      <Instagram className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="my_instagram_id@"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requirePhoneNumber && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">شماره همراه (جهت ثبت کد تخفیف)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="09123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requireInstagramFollow && (
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-200">
                        <span className="block font-bold">۱. فالو کردن پیج اینستاگرام</span>
                        <span className="text-[11px] text-amber-300 dir-ltr font-mono">@{storeInstagram || 'instagram_page'}</span>
                      </div>
                      <a
                        href={`https://instagram.com/${storeInstagram}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsInstagramFollowed(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>ورود به پیج و فالو</span>
                      </a>
                    </div>

                    <label className="flex items-start gap-2.5 pt-2.5 border-t border-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInstagramFollowed}
                        onChange={(e) => setIsInstagramFollowed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950 shrink-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 leading-tight">
                        ۲. <strong className="text-white">تأیید می‌کنم که پیج را فالو کرده‌ام</strong> (هنگام اهداء جایزه، فالو بودن پیج استعلام می‌شود).
                      </span>
                    </label>
                  </div>
                )}

                {/* Important Notice Box */}
                <div className="bg-amber-950/70 border border-amber-500/40 p-3 rounded-2xl text-[11px] text-amber-200 flex items-start gap-2.5 leading-relaxed shadow-inner">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block mb-0.5 font-black">توجه بسیار مهم:</strong>
                    لطفاً آیدی اینستاگرام و شماره همراه خود را کاملاً درست وارد کنید. در صورت ورود اطلاعات نادرست، حتی در صورت برنده شدن، هیچ‌گونه جایزه‌ای به شما تعلق نخواهد گرفت.
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>شروع بازی و دریافت شانس</span>
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>اطلاعات شما نزد {storeName} کاملا محفوظ است</span>
              </div>
            </div>
          )}

          {/* STEP 2: GAME HUB (ALL-games campaigns) */}
          {step === 'HUB' && isAllGames && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-block">
                  🎮 انتخاب بازی
                </span>
                <h3 className="text-base font-black text-white mt-2">
                  {campaign.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {hubLoading ? 'در حال بررسی بازی‌های انجام‌شده...' : 'هر بازی را فقط یک بار می‌توانید انجام دهید — بعد از هر بازی، شانس جدیدی دارید!'}
                </p>
              </div>

              {inputError && (
                <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-2xl text-center animate-shake">
                  {inputError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {GAME_META.map((gm) => {
                  const isPlayed = playedGames.has(gm.type);
                  return (
                    <button
                      key={gm.type}
                      type="button"
                      disabled={isPlayed || hubLoading}
                      onClick={() => handleSelectGame(gm.type)}
                      className={`relative p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        isPlayed
                          ? 'bg-slate-950/60 border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800 hover:border-amber-400/60 hover:scale-[1.03] active:scale-95'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{gm.icon}</span>
                      <span className={`text-xs font-black block ${isPlayed ? 'text-slate-500' : 'text-white'}`}>
                        {gm.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">{gm.desc}</span>
                      {isPlayed ? (
                        <span className="absolute top-2 left-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          ✓ انجام شد
                        </span>
                      ) : (
                        <span className={`absolute top-2 left-2 text-[10px] ${gm.color.split(' ')[0]} bg-slate-900 px-2 py-0.5 rounded-full font-bold`}>
                          آماده
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-amber-950/70 border border-amber-500/40 p-3 rounded-2xl text-[11px] text-amber-200 flex items-start gap-2.5 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5 font-black">قوانین:</strong>
                  هر آیدی اینستاگرام و شماره همراه فقط یک بار مجاز به شرکت در هر بازی است. اطلاعات شما نزد {storeName} کاملاً محفوظ است.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GAME INTERACTION */}
          {step === 'PLAY' && (
            <div className="space-y-4 text-center">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-block">
                  شانس خود را امتحان کنید!
                </span>
                {isAllGames && (
                  <button
                    onClick={() => { setStep('HUB'); refreshPlayedGames(); }}
                    className="text-[10px] text-slate-400 hover:text-amber-300 font-bold cursor-pointer transition-colors"
                  >
                    ← بازگشت به بازی‌ها
                  </button>
                )}
              </div>
              <h3 className="text-base font-bold text-white mt-2">
                {campaign.title}
                {isAllGames && <span className="text-amber-400"> — {GAME_META.find(g => g.type === activeGame)?.label}</span>}
              </h3>

              {activeGame === 'WHEEL' && (
                <LuckyWheel prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {activeGame === 'SCRATCH' && (
                <ScratchCard prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {activeGame === 'SLOT' && (
                <SlotMachine prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
              {activeGame === 'QUIZ' && (
                <QuizGame
                  questions={campaign.quizQuestions && campaign.quizQuestions.length > 0 ? campaign.quizQuestions : [
                    {
                      id: 'default-q1',
                      question: 'بهترین روش دریافت تخفیف از فروشگاه چیست؟',
                      options: ['شرکت در کمپین', 'ارسال پیام به ادمین', 'هر دو مورد بالا'],
                      correctOptionIndex: 2
                    }
                  ]}
                  prizes={campaign.prizes}
                  onFinish={handleGameFinish}
                />
              )}
              {activeGame === 'MYSTERY_BOX' && (
                <MysteryBox prizes={campaign.prizes} onFinish={handleGameFinish} />
              )}
            </div>
          )}

          {/* STEP 3: RESULT SCREEN */}
          {step === 'RESULT' && wonPrize && (
            <div className="space-y-5 text-center animate-scale-up">
              {wonPrize.isWin && !wonPrize.label.includes('پوچ') && !wonPrize.label.includes('متاسفانه') ? (
                <>
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-500/10">
                    <Gift className="w-8 h-8 animate-bounce" />
                  </div>

                  <div>
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      تبریک! شما برنده شدید 🎉
                    </span>
                    <h3 className="text-2xl font-black text-white mt-3 leading-tight">
                      {wonPrize.label}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      کد تخفیف اختصاصی شما آماده استفاده در خرید بعدی است:
                    </p>
                  </div>

                  {wonPrize.couponCode ? (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3">
                      <span className="text-[10px] text-slate-400 block">کد تخفیف شما:</span>
                      <div className="flex items-center justify-between bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 font-mono text-base font-bold text-amber-300 dir-ltr">
                        <span>{wonPrize.couponCode}</span>
                        <button
                          onClick={() => copyToClipboard(wonPrize.couponCode)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'کپی شد' : 'کپی'}</span>
                        </button>
                      </div>

                      {wooStatusMessage && (
                        <div className="pt-1 text-[11px] text-purple-300 bg-purple-950/60 border border-purple-500/30 p-2 rounded-xl flex items-center justify-center gap-1.5 dir-rtl">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{wooStatusMessage}</span>
                        </div>
                      )}

                      {/* Fallback & Support Info */}
                      <div className="pt-2 text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-right leading-relaxed space-y-1.5">
                        <p className="font-bold text-amber-300 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>این کد و آیدی شما در دیتابیس سیستم ثبت شد.</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          در صورت بروز هرگونه مشکل یا عدم کارکرد کد در سایت، کافیست کد یا آیدی خود را به دایرکت پیج پیام دهید تا ادمین استعلام بگیرد.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                      جهت دریافت هدیه خود، به دایرکت پیج {storeInstagram ? <strong className="text-amber-300">@{storeInstagram}</strong> : 'فروشگاه'} پیام دهید.
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    {/* Next game button (ALL-games campaign) */}
                    {isAllGames && (
                      <button
                        onClick={() => { setWonPrize(null); setStep('HUB'); refreshPlayedGames(); }}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl border border-purple-400/30 cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>🎮 بازی بعدی — شانس جدید</span>
                      </button>
                    )}
                    {/* Direct Send to Admin Button */}
                    <button
                      onClick={handleSendToAdmin}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/25 border border-amber-300/40 cursor-pointer active:scale-95"
                    >
                      <Send className="w-4 h-4 text-pink-200 shrink-0" />
                      <span>
                        {sentToAdminCopied
                          ? 'متن پیام کپی شد! در حال هدایت به دایرکت اینستاگرام...'
                          : 'ارسال کد و مشخصات برنده به دایرکت ادمین'}
                      </span>
                    </button>

                    {storeWebsiteUrl && (
                      <a
                        href={storeWebsiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        <span>استفاده از کد تخفیف در سایت فروشگاه</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {storeInstagram && !sentToAdminCopied && (
                      <a
                        href={`https://instagram.com/${storeInstagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span>مشاهده پیج اینستاگرام فروشگاه</span>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                /* POOCH / NON-WIN SCREEN */
                <>
                  <div className="w-16 h-16 bg-rose-500/20 border-2 border-rose-400/80 rounded-full flex items-center justify-center mx-auto text-rose-300 shadow-xl shadow-rose-500/10">
                    <Frown className="w-8 h-8 text-rose-400" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black text-rose-400 uppercase tracking-widest bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">
                      متأسفانه برنده نشدید 😔
                    </span>
                    <h3 className="text-xl font-black text-white mt-2 leading-tight">
                      {wonPrize.label || 'پوچ'}
                    </h3>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed text-center space-y-1 mt-3">
                      <p className="font-bold text-amber-300">متأسفانه برنده نشدید!</p>
                      <p className="text-slate-400">در کمپین بعدی منتظر شما هستیم ✨</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    {storeInstagram && (
                      <a
                        href={`https://instagram.com/${storeInstagram}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>دنبال کردن پیج برای کمپین‌های بعدی</span>
                      </a>
                    )}

                    {storeWebsiteUrl && (
                      <a
                        href={storeWebsiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <span>مشاهده محصولات فروشگاه</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md py-3 text-center text-[11px] text-slate-500 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>پلتفرم متین بازی</span>
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-amber-400 font-bold">
            v{APP_VERSION}
          </span>
        </div>
        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="text-slate-400 hover:text-slate-200 text-[10px] underline cursor-pointer"
          >
            ورود به مدیریت
          </button>
        )}
      </footer>

    </div>
  );
};
