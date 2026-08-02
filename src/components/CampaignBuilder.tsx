import React, { useState } from 'react';
import { Campaign, GameType, Prize, QuizQuestion } from '../types';
import { Save, ArrowRight, Plus, Trash2, Sparkles, Sliders, Palette, ShieldAlert, Gift, HelpCircle, Store, Globe, Info } from 'lucide-react';

interface CampaignBuilderProps {
  initialCampaign?: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
}

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ initialCampaign, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialCampaign?.title || 'جشنواره شانس فروشگاه 🎁');
  const [description, setDescription] = useState(initialCampaign?.description || 'کمپین هیجان‌انگیز اهدای کد تخفیف به فالوورهای اینستاگرام');
  const [gameType, setGameType] = useState<GameType>(initialCampaign?.gameType || 'WHEEL');
  
  const [useDefaultStoreInfo, setUseDefaultStoreInfo] = useState<boolean>(initialCampaign?.useDefaultStoreInfo ?? true);
  const [storeName, setStoreName] = useState(initialCampaign?.storeName || 'فروشگاه من');
  const [storeInstagram, setStoreInstagram] = useState(initialCampaign?.storeInstagram || 'my_store_page');
  const [storeLogoUrl, setStoreLogoUrl] = useState(initialCampaign?.storeLogoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
  const [storeWebsiteUrl, setStoreWebsiteUrl] = useState(initialCampaign?.storeWebsiteUrl || '');
  
  const [requireInstagramFollow, setRequireInstagramFollow] = useState(initialCampaign?.requireInstagramFollow ?? true);
  const [requirePhoneNumber, setRequirePhoneNumber] = useState(initialCampaign?.requirePhoneNumber ?? true);
  const [requireStoryMention, setRequireStoryMention] = useState(initialCampaign?.requireStoryMention ?? false);

  const [customHeadline, setCustomHeadline] = useState(initialCampaign?.customHeadline || 'یک شانس مجانی برای برنده شدن کد تخفیف! 🎡');
  const [customSubheadline, setCustomSubheadline] = useState(initialCampaign?.customSubheadline || 'قبل از بازی، آیدی اینستاگرام و شماره همراهت رو وارد کن');
  const [customTerms, setCustomTerms] = useState(initialCampaign?.customTerms || 'کد تخفیف برنده شده تا ۷ روز معتبر می‌باشد.');

  const [prizes, setPrizes] = useState<Prize[]>(initialCampaign?.prizes || [
    { id: 'p-1', label: 'کد تخفیف ۵۰٪', subLabel: 'مخصوص خریدهای بالای ۵۰۰ هزار تومان', probability: 15, couponCode: 'OFF50-SPECIAL', discountPercent: 50, color: '#ec4899', isWin: true },
    { id: 'p-2', label: 'ارسال رایگان 🚚', subLabel: 'برای تمامی سفارشات', probability: 25, couponCode: 'FREE-DELIVERY', discountPercent: 100, color: '#3b82f6', isWin: true },
    { id: 'p-3', label: 'پوچ! شانس مجدد', subLabel: 'تلاش دوباره فردا', probability: 20, couponCode: '', color: '#475569', isWin: false },
    { id: 'p-4', label: 'کد تخفیف ۳۰٪', subLabel: 'روی تمام اجناس', probability: 20, couponCode: 'OFF30-SHOP', discountPercent: 30, color: '#8b5cf6', isWin: true },
    { id: 'p-5', label: 'کد تخفیف ۲۰٪', subLabel: 'هدیه ورود', probability: 20, couponCode: 'WELCOME20', discountPercent: 20, color: '#10b981', isWin: true },
  ]);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialCampaign?.quizQuestions || [
    {
      id: 'q-1',
      question: 'کدام گزینه ویژگی اصلی محصولات ما می‌باشد؟',
      options: ['کیفیت عالی و ارسال سریع', 'تضمین اصالت کالا', 'همه موارد بالا'],
      correctOptionIndex: 2
    }
  ]);

  const handleAddPrize = () => {
    const newP: Prize = {
      id: 'p-' + Date.now(),
      label: 'کد تخفیف جدید',
      subLabel: 'توضیح کوتاه جایزه',
      probability: 10,
      couponCode: 'OFF-' + Math.floor(100 + Math.random() * 900),
      discountPercent: 15,
      color: '#f59e0b',
      isWin: true
    };
    setPrizes([...prizes, newP]);
  };

  const handleRemovePrize = (id: string) => {
    if (prizes.length <= 2) return;
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const handleUpdatePrize = (id: string, field: keyof Prize, value: any) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCampaign: Campaign = {
      id: initialCampaign?.id || 'cmp-' + Date.now(),
      title,
      description,
      gameType,
      useDefaultStoreInfo,
      storeName,
      storeInstagram,
      storeLogoUrl,
      storeWebsiteUrl,
      themeColor: '#8b5cf6',
      accentColor: '#ec4899',
      bgGradient: 'from-purple-900 via-indigo-950 to-slate-950',
      prizes,
      quizQuestions: (gameType === 'QUIZ' || gameType === 'ALL') ? quizQuestions : undefined,
      requireInstagramFollow,
      requirePhoneNumber,
      requireStoryMention,
      maxSpinsPerUser: 1,
      expiryDays: 7,
      isActive: true,
      createdAt: initialCampaign?.createdAt || '1403/05/25',
      totalPlays: initialCampaign?.totalPlays || 0,
      totalWinners: initialCampaign?.totalWinners || 0,
      customHeadline,
      customSubheadline,
      customTerms
    };

    onSave(newCampaign);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 dir-rtl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {initialCampaign ? 'ویرایش کمپین گیمیفیکیشن' : 'ساخت کمپین بازی جدید'}
                  </h2>
                  <p className="text-xs text-slate-300">تنظیمات بازی، جوایز و قوانین جذب فالوور را مشخص کنید</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer sm:w-auto"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره و فعال‌سازی کمپین</span>
              </button>
            </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* Section 1: Campaign Info & Game Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>۱. نوع بازی و مشخصات کلی کمپین</span>
          </h3>

          <div>
            <label className="block text-slate-300 font-bold mb-1">عنوان کمپین</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلا: گردونه شانس تابستانه"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              required
            />
          </div>

          {/* Store Info Source Selection */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-slate-300 font-bold text-xs mb-1">
              منبع اطلاعات فروشگاه در صفحه بازی مشتریان (لوگو، نام، آیدی اینستاگرام، وب‌سایت):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseDefaultStoreInfo(true)}
                className={`p-3 rounded-xl border text-right flex items-start gap-3 transition-all cursor-pointer ${
                  useDefaultStoreInfo
                    ? 'bg-amber-500/10 border-amber-400/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Store className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-white">استفاده از تنظیمات پیش‌فرض فروشگاه</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    اطلاعات عمومی فروشگاه از بخش تنظیمات داشبورد به صورت خودکار خوانده می‌شود.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUseDefaultStoreInfo(false)}
                className={`p-3 rounded-xl border text-right flex items-start gap-3 transition-all cursor-pointer ${
                  !useDefaultStoreInfo
                    ? 'bg-amber-500/10 border-amber-400/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Globe className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-white">اطلاعات اختصاصی برای این کمپین</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    تنظیم نام، آیدی اینستاگرام، وب‌سایت و لوگوی متفاوت مخصوص این کمپین.
                  </div>
                </div>
              </button>
            </div>

            {useDefaultStoreInfo ? (
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  صفحه بازی مشتریان از نام، اینستاگرام، لوگو و لینک وب‌سایت موجود در بخش «تنظیمات فروشگاه» استفاده خواهد کرد.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نام اختصاصی فروشگاه</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="مثلا: فروشگاه برند خاص"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    required={!useDefaultStoreInfo}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">آیدی اینستاگرام اختصاصی (بدون @)</label>
                  <input
                    type="text"
                    value={storeInstagram}
                    onChange={(e) => setStoreInstagram(e.target.value)}
                    placeholder="مثلا: my_store_page"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                    required={!useDefaultStoreInfo}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">لوگوی اختصاصی کمپین</label>
                  <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {storeLogoUrl ? (
                      <img src={storeLogoUrl} alt="لوگو" className="w-12 h-12 rounded-xl object-cover border border-amber-400 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-[10px] shrink-0">
                        بدون لوگو
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                          <span>آپلود لوگو (حداکثر ۵۰۰KB)</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const MAX_SIZE = 500 * 1024;
                              if (file.size > MAX_SIZE) {
                                alert(`حجم فایل لوگو (${(file.size / 1024).toFixed(0)} KB) بیشتر از حد مجاز ۵۰۰KB است.`);
                                e.target.value = '';
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const res = ev.target?.result as string;
                                if (res) setStoreLogoUrl(res);
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {storeLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setStoreLogoUrl('')}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={storeLogoUrl}
                        onChange={(e) => setStoreLogoUrl(e.target.value)}
                        placeholder="یا درج لینک تصویر: https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">آدرس وب‌سایت اختصاصی</label>
                  <input
                    type="text"
                    value={storeWebsiteUrl}
                    onChange={(e) => setStoreWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Game Type Picker */}
          <div className="pt-2">
            <label className="block text-slate-300 font-bold mb-2">انتخاب بازی تعاملی:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { type: 'ALL', label: 'همه بازی‌ها 🎮', icon: '🎮', desc: '۵ بازی در یک کمپین' },
                { type: 'WHEEL', label: 'گردونه شانس 🎡', icon: '🎡', desc: '' },
                { type: 'SCRATCH', label: 'کارت اسکرچ 🪙', icon: '🪙', desc: '' },
                { type: 'SLOT', label: 'ماشین اسلات 🎰', icon: '🎰', desc: '' },
                { type: 'QUIZ', label: 'کوییز و آزمون 🧠', icon: '🧠', desc: '' },
                { type: 'MYSTERY_BOX', label: 'جعبه شانس 🎁', icon: '🎁', desc: '' },
              ].map((gt) => (
                <button
                  key={gt.type}
                  type="button"
                  onClick={() => setGameType(gt.type as GameType)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    gameType === gt.type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-lg scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl block mb-1">{gt.icon}</span>
                  <span className="text-[11px]">{gt.label}</span>
                  {gt.desc && <span className="text-[9px] text-slate-500 block mt-0.5">{gt.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Questions Editor (Visible for QUIZ and ALL game types) */}
        {(gameType === 'QUIZ' || gameType === 'ALL') && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>طراحی و سوالات مسابقه و کوییز</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  سوالات، گزینه‌ها و گزینه پاسخ صحیح را برای شرکت‌کنندگان طراحی و ویرایش کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newQ: QuizQuestion = {
                    id: 'q-' + Date.now(),
                    question: 'سوال جدید را وارد کنید',
                    options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'],
                    correctOptionIndex: 0
                  };
                  setQuizQuestions([...quizQuestions, newQ]);
                }}
                className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سوال جدید</span>
              </button>
            </div>

            <div className="space-y-4">
              {quizQuestions.map((q, qIdx) => (
                <div key={q.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      سوال شماره {qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (quizQuestions.length <= 1) {
                          alert('کمپین کوییز باید حداقل شامل یک سوال باشد.');
                          return;
                        }
                        setQuizQuestions(quizQuestions.filter(item => item.id !== q.id));
                      }}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف سوال</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">صورت سوال:</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = quizQuestions.map(item => item.id === q.id ? { ...item, question: e.target.value } : item);
                        setQuizQuestions(updated);
                      }}
                      placeholder="مثلا: ارسال رایگان خریدهای بالای چه مبلغی است؟"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-300">گزینه‌های پاسخ (گزینه صحیح را مشخص کنید):</label>
                      {q.options.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = quizQuestions.map(item => {
                              if (item.id !== q.id) return item;
                              return { ...item, options: [...item.options, `گزینه ${item.options.length + 1}`] };
                            });
                            setQuizQuestions(updated);
                          }}
                          className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" /> افزودن گزینه
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        return (
                          <div key={optIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = quizQuestions.map(item => item.id === q.id ? { ...item, correctOptionIndex: optIdx } : item);
                                setQuizQuestions(updated);
                              }}
                              className={`px-3 py-2 rounded-xl border text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                              title="برای تغییر پاسخ درست روی این دکمه کلیک کنید"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCorrect ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                              <span>{isCorrect ? 'پاسخ صحیح ✓' : 'انتخاب به عنوان پاسخ درست'}</span>
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = quizQuestions.map(item => {
                                  if (item.id !== q.id) return item;
                                  const newOpts = [...item.options];
                                  newOpts[optIdx] = e.target.value;
                                  return { ...item, options: newOpts };
                                });
                                setQuizQuestions(updated);
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                            />

                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = quizQuestions.map(item => {
                                    if (item.id !== q.id) return item;
                                    const newOpts = item.options.filter((_, i) => i !== optIdx);
                                    let newCorrect = item.correctOptionIndex;
                                    if (newCorrect >= newOpts.length) newCorrect = newOpts.length - 1;
                                    return { ...item, options: newOpts, correctOptionIndex: newCorrect };
                                  });
                                  setQuizQuestions(updated);
                                }}
                                className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                                title="حذف گزینه"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Prizes Configuration */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span>۲. مدیریت جوایز و کدهای تخفیف</span>
            </h3>
            <button
              type="button"
              onClick={handleAddPrize}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1 font-bold text-[11px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>افزودن جایزه جدید</span>
            </button>
          </div>

          <div className="space-y-3">
            {prizes.map((p, idx) => (
              <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <label className="text-[10px] text-slate-400 block mb-0.5">نام جایزه {idx + 1}</label>
                  <input
                    type="text"
                    value={p.label}
                    onChange={(e) => handleUpdatePrize(p.id, 'label', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] text-slate-400 block mb-0.5">توضیح زیرین (شرایط)</label>
                  <input
                    type="text"
                    value={p.subLabel || ''}
                    onChange={(e) => handleUpdatePrize(p.id, 'subLabel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">کد تخفیف</label>
                  <input
                    type="text"
                    value={p.couponCode}
                    onChange={(e) => handleUpdatePrize(p.id, 'couponCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono text-left"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">احتمال برد٪ (شبه وزن)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={p.probability}
                    onChange={(e) => handleUpdatePrize(p.id, 'probability', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div className="md:col-span-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={p.color}
                    onChange={(e) => handleUpdatePrize(p.id, 'color', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                    title="رنگ بخش"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePrize(p.id)}
                    className="p-2 text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Requirements */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>۳. الزامات و دریافت شماره همراه مشتریان</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={requireInstagramFollow}
                onChange={(e) => setRequireInstagramFollow(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="text-xs text-slate-300">اجبار به وارد کردن آیدی اینستاگرام</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePhoneNumber}
                onChange={(e) => setRequirePhoneNumber(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="text-xs text-slate-300">دریافت شماره همراه برای پیامک</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={requireStoryMention}
                onChange={(e) => setRequireStoryMention(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded"
              />
              <span className="text-xs text-slate-300">پیشنهاد منشن استوری</span>
            </label>
          </div>
        </div>

        {/* Section 4: Texts & Banners */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>۴. تیترها و متون سفارشی صفحه بازی</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">تیتر اصلی بالای بازی</label>
              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">توضیحات راهنما</label>
              <input
                type="text"
                value={customSubheadline}
                onChange={(e) => setCustomSubheadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">شرایط و قوانین تخفیف</label>
              <input
                type="text"
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
