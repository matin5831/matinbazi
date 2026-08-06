import React, { useState } from 'react';
import { Campaign, Prize, GameType, ALL_GAME_TYPES, APP_VERSION } from '../types';
import { LuckyWheel } from './Games/LuckyWheel';
import { ScratchCard } from './Games/ScratchCard';
import { SlotMachine } from './Games/SlotMachine';
import { MysteryBox } from './Games/MysteryBox';
import { addLeadToServer, checkDuplicateOnServer } from '../utils/api';
import { addLead, getStoredSettings, getStoredLeads, normalizePhoneNumber } from '../utils/storage';
import { createWooCommerceCoupon } from '../utils/woocommerce';
import { randomizeCoupon } from '../utils/coupon';
import { Instagram, Phone, Sparkles, Copy, Check, ExternalLink, Gift, ShieldCheck, ArrowRight, ShoppingBag, Frown, AlertTriangle, Send, Clock } from 'lucide-react';

interface CustomerGamePageProps {
  campaign: Campaign;
  onGoToAdmin?: () => void; // kept for App.tsx compatibility (customer page no longer shows it)
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
  const [hasPlayedCampaign, setHasPlayedCampaign] = useState(false); // ONE play per campaign
  const [hubLoading, setHubLoading] = useState(false);

  const GAME_META: { type: GameType; label: string; icon: string; desc: string; color: string }[] = [
    { type: 'WHEEL', label: 'گردونه شانس', icon: '🎡', desc: 'شانس خود را بچرخانید', color: 'text-amber-600 bg-amber-100 border-amber-300' },
    { type: 'SCRATCH', label: 'کارت اسکرچ', icon: '🪙', desc: 'خط بکشید و جایزه بگیرید', color: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
    { type: 'SLOT', label: 'ماشین اسلات', icon: '🎰', desc: 'سه نماد هم‌راستا', color: 'text-purple-700 bg-purple-500/10 border-purple-500/30' },
    { type: 'MYSTERY_BOX', label: 'جعبه شانس', icon: '🎁', desc: 'یک جعبه باز کنید', color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  ];

  // ONE play per campaign — check once whether this user already played this campaign
  const refreshPlayedGames = async () => {
    if (!isAllGames) return;
    setHubLoading(true);
    const cleanIg = instagramHandle.trim().toLowerCase().replace(/^@/, '');
    const cleanPhone = phoneNumber.trim();
    const res = await checkDuplicateOnServer({
      campaignId: campaign.id,
      instagramHandle: cleanIg,
      phoneNumber: cleanPhone,
    });
    setHasPlayedCampaign(res.duplicate);
    setHubLoading(false);
  };

  const handleSelectGame = async (gt: GameType) => {
    if (hasPlayedCampaign) {
      setInputError('شما قبلاً در این کمپین شرکت کرده‌اید. کمپین بعدی تخفیفات به زودی شروع می‌شود!');
      return;
    }
    const cleanIg = instagramHandle.trim().toLowerCase().replace(/^@/, '');
    const cleanPhone = phoneNumber.trim();
    const check = await checkDuplicateOnServer({
      campaignId: campaign.id,
      instagramHandle: cleanIg,
      phoneNumber: cleanPhone,
    });
    if (check.duplicate) {
      setInputError('شما قبلاً در این کمپین شرکت کرده‌اید. کمپین بعدی تخفیفات به زودی شروع می‌شود!');
      setHasPlayedCampaign(true);
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
      const cleanPhone = normalizePhoneNumber(phoneNumber);
      if (!/^09\d{9}$/.test(cleanPhone)) {
        setInputError('شماره همراه باید با 09 شروع شود و دقیقاً ۱۱ رقم باشد (مثلا 09123456789).');
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
    // ⭐ Generate a fresh random 7-char coupon for this win (unique per win)
    const finalPrize = randomizeCoupon(prize);
    setWonPrize(finalPrize);

    // For ALL-games campaigns, record which game was played
    const recordedGameType: GameType = isAllGames ? activeGame : campaign.gameType;

    // Save lead data — server-authoritative (Redis backend), local fallback for dev
    const serverRes = await addLeadToServer({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      instagramHandle: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
      phoneNumber: phoneNumber || 'ثبت نشده',
      prizeWon: finalPrize.label,
      couponCode: finalPrize.couponCode || '',
      gameType: recordedGameType,
    });

    if (serverRes.error === 'already_played') {
      // Server rejected — user already played this campaign
      setInputError('شما قبلاً در این کمپین شرکت کرده‌اید. کمپین بعدی تخفیفات به زودی شروع می‌شود!');
      if (isAllGames) {
        setHasPlayedCampaign(true);
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
        prizeWon: finalPrize.label,
        couponCode: finalPrize.couponCode || '',
        gameType: recordedGameType,
      });
    }

    // Auto sync coupon code to WooCommerce if enabled
    if (finalPrize.couponCode) {
      const settings = getStoredSettings();
      if (settings.enableWooCommerce) {
        setWooStatusMessage('در حال ثبت کد تخفیف در فروشگاه ووکامرس...');
        const wooRes = await createWooCommerceCoupon(settings, {
          code: finalPrize.couponCode || '',
          amount: finalPrize.discountPercent || 10,
          discountType: finalPrize.discountType || 'percent',
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
    <div className="min-h-dvh bg-slate-100 text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 dir-rtl font-['Vazirmatn',sans-serif]">
      
      {/* Top Store Header */}
      <header className="w-full max-w-md pt-2 pb-4 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          {storeLogoUrl ? (
            <img src={storeLogoUrl} alt={storeName} className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-lg" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-lg text-slate-950 shadow-lg">
              {storeName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">{storeName}</h1>
            {storeInstagram && (
              <a
                href={`https://instagram.com/${storeInstagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                <span>@{storeInstagram}</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-600 text-[11px] px-2.5 py-1 rounded-full border border-amber-300 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-600" /> مسابقه و هدیه
          </span>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="w-full max-w-md my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-100 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: INPUT FORM */}
          {step === 'INPUT' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <span className="text-amber-600 text-xs font-bold uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                  گردونه شانس و جوایز ویژه
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-snug">
                  {campaign.customHeadline || campaign.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {campaign.customSubheadline || 'اطلاعات خود را وارد کنید تا شانس برنده شدن کد تخفیف ویژه فروشگاه ما را داشته باشید!'}
                </p>
              </div>

              {inputError && (
                <div className="bg-rose-50 border border-rose-500/50 text-rose-600 text-xs p-3 rounded-2xl text-center animate-shake">
                  {inputError}
                </div>
              )}

              <form onSubmit={handleStartGame} className="space-y-4">
                {campaign.requireInstagramFollow && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">آیدی اینستاگرام شما</label>
                    <div className="relative">
                      <Instagram className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="my_instagram_id@"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requirePhoneNumber && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">شماره همراه (جهت ثبت کد تخفیف)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="09123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {campaign.requireInstagramFollow && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-600">
                        <span className="block font-bold">۱. فالو کردن پیج اینستاگرام</span>
                        <span className="text-[11px] text-amber-600 dir-ltr font-mono">@{storeInstagram || 'instagram_page'}</span>
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

                    <label className="flex items-start gap-2.5 pt-2.5 border-t border-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInstagramFollowed}
                        onChange={(e) => setIsInstagramFollowed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-white text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950 shrink-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-600 leading-tight">
                        ۲. <strong className="text-slate-900">تأیید می‌کنم که پیج را فالو کرده‌ام</strong> (هنگام اهداء جایزه، فالو بودن پیج استعلام می‌شود).
                      </span>
                    </label>
                  </div>
                )}

                {/* Important Notice Box */}
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-[11px] text-amber-700 flex items-start gap-2.5 leading-relaxed shadow-inner">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-600 block mb-0.5 font-black">توجه بسیار مهم:</strong>
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

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>اطلاعات شما نزد {storeName} کاملا محفوظ است</span>
              </div>
            </div>
          )}

          {/* STEP 2: GAME HUB (ALL-games campaigns) */}
          {step === 'HUB' && isAllGames && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                  🎮 انتخاب بازی
                </span>
                <h3 className="text-base font-black text-slate-900 mt-2">
                  {campaign.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {hubLoading ? 'در حال بررسی وضعیت شرکت شما...' : 'یکی از ۵ بازی را انتخاب کنید — فقط یک شانس در این کمپین دارید!'}
                </p>
              </div>

              {inputError && (
                <div className="bg-rose-50 border border-rose-500/50 text-rose-600 text-xs p-3 rounded-2xl text-center animate-shake">
                  {inputError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {GAME_META.map((gm) => {
                  const isPlayed = hasPlayedCampaign;
                  return (
                    <button
                      key={gm.type}
                      type="button"
                      disabled={isPlayed || hubLoading}
                      onClick={() => handleSelectGame(gm.type)}
                      className={`relative p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        isPlayed
                          ? 'bg-slate-50/60 border-slate-200 opacity-50 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-400/60 hover:scale-[1.03] active:scale-95'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{gm.icon}</span>
                      <span className={`text-xs font-black block ${isPlayed ? 'text-slate-500' : 'text-slate-900'}`}>
                        {gm.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">{gm.desc}</span>
                      {isPlayed ? (
                        <span className="absolute top-2 left-2 text-[10px] bg-slate-300 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          ✓ شرکت کردید
                        </span>
                      ) : (
                        <span className={`absolute top-2 left-2 text-[10px] ${gm.color.split(' ')[0]} bg-white px-2 py-0.5 rounded-full font-bold`}>
                          آماده
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasPlayedCampaign && (
                <div className="bg-rose-50 border border-rose-500/50 text-rose-600 text-xs p-4 rounded-2xl text-center leading-relaxed animate-shake">
                  ⛔ شما قبلاً در این کمپین شرکت کرده‌اید.
                  <br />
                  <span className="text-rose-500/80">برای شانس مجدد، منتظر کمپین بعدی تخفیفات باشید.</span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-[11px] text-amber-700 flex items-start gap-2.5 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-600 block mb-0.5 font-black">قوانین:</strong>
                  هر آیدی اینستاگرام و شماره همراه فقط یک بار مجاز به شرکت در این کمپین است (فقط یکی از بازی‌ها). اطلاعات شما نزد {storeName} کاملاً محفوظ است.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GAME INTERACTION */}
          {step === 'PLAY' && (
            <div className="space-y-4 text-center">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                  شانس خود را امتحان کنید!
                </span>
                {isAllGames && (
                  <button
                    onClick={() => { setStep('HUB'); refreshPlayedGames(); }}
                    className="text-[10px] text-slate-500 hover:text-amber-600 font-bold cursor-pointer transition-colors"
                  >
                    ← بازگشت به بازی‌ها
                  </button>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                {campaign.title}
                {isAllGames && <span className="text-amber-600"> — {GAME_META.find(g => g.type === activeGame)?.label}</span>}
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
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-xl shadow-amber-500/10">
                    <Gift className="w-8 h-8 animate-bounce" />
                  </div>

                  <div>
                    <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      تبریک! شما برنده شدید 🎉
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-3 leading-tight">
                      {wonPrize.label}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      کد تخفیف اختصاصی شما آماده استفاده در خرید بعدی است:
                    </p>
                  </div>

                  {wonPrize.couponCode ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-amber-300 space-y-3">
                      <span className="text-[10px] text-slate-500 block">کد تخفیف شما:</span>
                      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 font-mono text-base font-bold text-amber-600 dir-ltr">
                        <span>{wonPrize.couponCode}</span>
                        <button
                          onClick={() => copyToClipboard(wonPrize.couponCode)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'کپی شد' : 'کپی'}</span>
                        </button>
                      </div>

                      {wonPrize.couponCode && (
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-600 bg-amber-100 border border-amber-300 p-2 rounded-xl">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>این کد تخفیف فقط <strong>۴۸ ساعت</strong> معتبر است — پس از آن به‌صورت خودکار باطل می‌شود!</span>
                        </div>
                      )}

                      {wooStatusMessage && (
                        <div className="pt-1 text-[11px] text-purple-700 bg-purple-50 border border-purple-500/30 p-2 rounded-xl flex items-center justify-center gap-1.5 dir-rtl">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{wooStatusMessage}</span>
                        </div>
                      )}

                      {/* Fallback & Support Info */}
                      <div className="pt-2 text-[11px] text-slate-600 bg-white/90 border border-slate-200 p-3 rounded-xl text-right leading-relaxed space-y-1.5">
                        <p className="font-bold text-amber-600 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>این کد و آیدی شما در دیتابیس سیستم ثبت شد.</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          در صورت بروز هرگونه مشکل یا عدم کارکرد کد در سایت، کافیست کد یا آیدی خود را به دایرکت پیج پیام دهید تا ادمین استعلام بگیرد.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                      جهت دریافت هدیه خود، به دایرکت پیج {storeInstagram ? <strong className="text-amber-600">@{storeInstagram}</strong> : 'فروشگاه'} پیام دهید.
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
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
                        className="w-full py-3 px-4 bg-slate-300 hover:bg-slate-400 text-slate-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>مشاهده پیج اینستاگرام فروشگاه</span>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                /* POOCH / NON-WIN SCREEN */
                <>
                  <div className="w-16 h-16 bg-rose-100 border-2 border-rose-400/80 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-xl shadow-rose-500/10">
                    <Frown className="w-8 h-8 text-rose-500" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">
                      متأسفانه برنده نشدید 😔
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2 leading-tight">
                      {wonPrize.label || 'پوچ'}
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed text-center space-y-1 mt-3">
                      <p className="font-bold text-amber-600">متأسفانه برنده نشدید!</p>
                      <p className="text-slate-500">در کمپین بعدی منتظر شما هستیم ✨</p>
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
                        className="w-full py-3 px-4 bg-slate-300 hover:bg-slate-400 text-slate-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
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
      <footer className="w-full max-w-md py-3 text-center text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>پلتفرم متین بازی</span>
          <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-amber-600 font-bold">
            v{APP_VERSION}
          </span>
        </div>
      </footer>

    </div>
  );
};
