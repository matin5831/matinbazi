import React from 'react';
import { Campaign, APP_VERSION } from '../types';
import { Sparkles, Gift, ShieldCheck, PlayCircle, Ticket, Phone, Instagram } from 'lucide-react';

interface LandingPageProps {
  campaigns: Campaign[];
  onStart: (campaign: Campaign) => void;
}

const GAME_INFO = [
  { icon: '🎡', title: 'گردونه شانس', desc: 'چرخ را بچرخانید و ببینید چه جایزه‌ای نصیب‌تان می‌شود! کد تخفیف‌های ویژه تا ۵۰٪ پشت هر بخش چرخ پنهان است.' },
  { icon: '🪙', title: 'کارت اسکرچ', desc: 'با کشیدن انگشت روی کارت طلایی، جایزه‌تان را خراش دهید و برنده شوید. هر کارت یک شانس پنهان دارد!' },
  { icon: '🎰', title: 'ماشین اسلات', desc: 'سه نماد را هم‌راستا کنید و جایزه بگیرید! شانس، شانس و باز هم شانس — این بازی مخصوص خوش‌شانس‌هاست.' },
  { icon: '🧠', title: 'کوییز و آزمون', desc: 'به سوالات پاسخ دهید و دانش‌تان را محک بزنید. پاسخ درست = جایزه! سوالات جذاب درباره برند و محصولات.' },
  { icon: '🎁', title: 'جعبه شانس', desc: 'یکی از جعبه‌های مرموز را انتخاب کنید و ببینید داخلش چه خبر است! هدیه‌ها و تخفیف‌های شگفت‌انگیز.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ campaigns, onStart }) => {
  const activeCampaigns = campaigns.filter(c => c.isActive);
  const playable = activeCampaigns.length > 0 ? activeCampaigns : campaigns;

  const handleStart = () => {
    if (playable.length > 0) {
      // Pick a random active campaign (same as ?play=random)
      const target = playable[Math.floor(Math.random() * playable.length)];
      onStart(target);
    }
  };

  return (
    <div className="min-h-screen ambient-canvas text-slate-100 font-['Vazirmatn',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Hero */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30 mb-5">
            <span className="text-4xl">🎮</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
            بازی و جایزه <span className="text-amber-400">🎁</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
            با <strong className="text-amber-300">۵ بازی شانسی</strong> سرگرم شوید و <strong className="text-amber-300">کد تخفیف</strong> برنده شوید!
            یکی از بازی‌ها را انتخاب کنید و شانس خود را امتحان کنید.
          </p>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
          {GAME_INFO.map((g, i) => (
            <div
              key={g.title}
              className="bg-slate-950/70 backdrop-blur border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3.5">
                <span className="text-3xl shrink-0">{g.icon}</span>
                <div>
                  <h3 className="text-sm font-black text-white mb-1.5">{g.title}</h3>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="text-center mb-8">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            شروع بازی
          </button>
          <p className="text-[11px] text-slate-500 mt-3">
            {playable.length > 0 ? `هر نفر فقط یک بار شانس دارد — ${playable.length} کمپین فعال` : 'به زودی بازی‌ها فعال می‌شوند'}
          </p>
        </div>

        {/* How it works */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 mb-8">
          <h3 className="text-sm font-black text-amber-300 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            چطور شرکت کنم؟
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11.5px] text-slate-400 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Instagram className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>پیج اینستاگرام فروشگاه را <strong className="text-slate-200">فالو کنید</strong></span>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>آیدی اینستاگرام و <strong className="text-slate-200">شماره همراه</strong> خود را وارد کنید</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Ticket className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>یکی از ۵ بازی را انتخاب کنید و <strong className="text-slate-200">کد تخفیف</strong> بگیرید!</span>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-amber-950/50 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 mb-10">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300">قوانین:</strong> هر آیدی اینستاگرام و شماره همراه فقط یک بار مجاز به شرکت در هر کمپین است.
            کد تخفیف به صورت خودکار صادر می‌شود و تا پایان کمپین اعتبار دارد.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-900/80 pt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Gift className="w-3.5 h-3.5 text-amber-500" />
          <span>متین بازی — پلتفرم گیمیفیکیشن و بازاریابی تعاملی</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 font-bold text-[10px]">
            v{APP_VERSION}
          </span>
        </footer>

      </div>
    </div>
  );
};
