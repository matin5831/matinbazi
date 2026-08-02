import React, { useState } from 'react';
import { PlayerLead, Campaign } from '../types';
import { toggleRedeemStatus, resetCampaignLeads, resetAllLeads, getStoredLeads, getAdminPassword } from '../utils/storage';
import { toggleLeadOnServer, resetAllOnServer, fetchLeadsFromServer } from '../utils/api';
import { Users, Phone, Award, Download, Copy, Check, Search, Filter, CheckCircle2, Clock, Sparkles, ShieldCheck, XCircle, SearchCode, RotateCcw } from 'lucide-react';

interface AnalyticsDashboardProps {
  leads: PlayerLead[];
  campaigns: Campaign[];
  onLeadsUpdated: (leads: PlayerLead[]) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ leads, campaigns, onLeadsUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inquiryQuery, setInquiryQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('ALL');
  const [copiedPhones, setCopiedPhones] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load server-side leads on mount (server is authoritative when reachable)
  React.useEffect(() => {
    (async () => {
      setSyncing(true);
      const serverLeads = await fetchLeadsFromServer();
      if (serverLeads) onLeadsUpdated(serverLeads);
      setSyncing(false);
    })();
  }, []);

  // Inquiry lookup match
  const inquiryMatch = inquiryQuery.trim()
    ? leads.find(
        l =>
          l.couponCode.toLowerCase() === inquiryQuery.trim().toLowerCase() ||
          l.instagramHandle.toLowerCase().replace('@', '') === inquiryQuery.trim().toLowerCase().replace('@', '') ||
          l.phoneNumber.includes(inquiryQuery.trim())
      )
    : null;

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phoneNumber.includes(searchTerm) ||
      lead.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.prizeWon.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCamp = filterCampaign === 'ALL' || lead.campaignId === filterCampaign;

    return matchesSearch && matchesCamp;
  });

  const totalPlays = campaigns.reduce((acc, c) => acc + c.totalPlays, 0);
  const totalWinners = leads.filter(l => l.couponCode).length;
  const redeemedCount = leads.filter(l => l.isRedeemed).length;
  const conversionRate = totalPlays > 0 ? ((totalWinners / totalPlays) * 100).toFixed(1) : '0';

  const handleToggleStatus = async (id: string) => {
    const updated = await toggleLeadOnServer(id);
    if (updated) {
      onLeadsUpdated(updated);
    } else {
      onLeadsUpdated(getStoredLeads());
    }
  };

  const copyAllPhoneNumbers = () => {
    const phones = Array.from(new Set(leads.map(l => l.phoneNumber).filter(p => p && p !== 'ثبت نشده'))).join('\n');
    navigator.clipboard.writeText(phones);
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 2000);
  };

  const exportCSV = () => {
    const headers = 'آیدی اینستاگرام,شماره همراه,نام کمپین,جایزه برنده شده,کد تخفیف,تاریخ برنده شدن,وضعیت استفاده\n';
    const rows = leads.map(l => 
      `"${l.instagramHandle}","${l.phoneNumber}","${l.campaignTitle}","${l.prizeWon}","${l.couponCode}","${l.wonAt}","${l.isRedeemed ? 'استفاده شده' : 'معلق'}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `boostagram_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 dir-rtl animate-fade-in">
      
      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block mb-1">کل دفعات بازی</span>
            <h3 className="text-2xl font-black text-white">{totalPlays.toLocaleString('fa-IR')}</h3>
            <span className="text-[10px] text-emerald-400 mt-1 block">ترافیک ورودی فعال</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block mb-1">شماره همراه جمع‌آوری شده</span>
            <h3 className="text-2xl font-black text-amber-300">{leads.length.toLocaleString('fa-IR')}</h3>
            <span className="text-[10px] text-amber-400 mt-1 block">آماده برای بازاریابی پیامکی</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block mb-1">کدهای تخفیف صادره</span>
            <h3 className="text-2xl font-black text-emerald-400">{totalWinners.toLocaleString('fa-IR')}</h3>
            <span className="text-[10px] text-slate-400 mt-1 block">نرخ تبدیل: {conversionRate}٪</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block mb-1">تخفیف‌های استفاده‌شده</span>
            <h3 className="text-2xl font-black text-amber-400">{redeemedCount.toLocaleString('fa-IR')}</h3>
            <span className="text-[10px] text-amber-300 mt-1 block">خرید قطعی ثبت‌شده</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Instant Coupon & Lead Lookup Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-amber-500/30 p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <SearchCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">استعلام فوری کد تخفیف یا آیدی مشتری</h3>
              <p className="text-[11px] text-slate-400">کد تخفیف ارسالی توسط مشتری را اینجا وارد کنید تا صحت آن تایید شود</p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold shrink-0">
            سیستم استعلام ادمین
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="مثلا: WHEEL50 یا آیدی اینستاگرام مشتری..."
              value={inquiryQuery}
              onChange={(e) => setInquiryQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
            {inquiryQuery && (
              <button
                onClick={() => setInquiryQuery('')}
                className="absolute left-3 top-3 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                حذف
              </button>
            )}
          </div>
        </div>

        {/* Inquiry Result Display */}
        {inquiryQuery.trim() && (
          <div className="animate-fade-in pt-1">
            {inquiryMatch ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-black">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>کد تخفیف معتبر است و در سیستم ثبت شده!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    {inquiryMatch.isRedeemed ? 'قبلاً استفاده شده' : 'آماده استفاده'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">آیدی اینستاگرام:</span>
                    <strong className="text-white dir-ltr inline-block">{inquiryMatch.instagramHandle}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">جایزه برنده شده:</span>
                    <strong className="text-amber-300">{inquiryMatch.prizeWon}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">کد تخفیف:</span>
                    <strong className="text-emerald-300 font-mono text-sm">{inquiryMatch.couponCode}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">تاریخ برنده شدن:</span>
                    <span className="text-slate-300">{inquiryMatch.wonAt}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleToggleStatus(inquiryMatch.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      inquiryMatch.isRedeemed
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                    }`}
                  >
                    {inquiryMatch.isRedeemed ? 'تغییر وضعیت به معلق' : 'تایید و علامت‌گذاری به عنوان استفاده شده'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block font-bold">این کد یا آیدی پیدا نشد!</strong>
                  <span className="text-[11px] text-rose-200">کدی با این مشخصات در لیست برندگان ثبت نشده است. لطفاً آیدی یا کد را مجدداً بررسی کنید.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar & Filter Options */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="جستجو بر اساس آیدی، شماره، کد تخفیف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">همه کمپین‌ها</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {filterCampaign !== 'ALL' && (
            <button
              onClick={() => {
                const targetCamp = campaigns.find(c => c.id === filterCampaign);
                if (confirm(`آیا از ریست لیدهای کمپین "${targetCamp?.title || ''}" اطمینان دارید؟ تمام لیدهای این کمپین پاک می‌شوند و کاربران می‌توانند دوباره شرکت کنند.`)) {
                  resetCampaignLeads(filterCampaign);
                  onLeadsUpdated(getStoredLeads());
                }
              }}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="پاکسازی لیدهای این کمپین جهت شروع مجدد"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>ریست لیدهای این کمپین</span>
            </button>
          )}

          <button
            onClick={copyAllPhoneNumbers}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copiedPhones ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>کپی شماره‌ها برای پیامک</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل (CSV)</span>
          </button>

          <button
            onClick={async () => {
              const adminPassword = getAdminPassword() || '';
              if (confirm('⚠️ آیا از ریست کامل همه کمپین‌ها اطمینان دارید؟\n\nتمام آیدی‌ها و شماره‌های ثبت‌شده پاک می‌شوند و همه کاربران می‌توانند دوباره یک بار در بازی‌ها شرکت کنند.')) {
                const result = await resetAllOnServer(adminPassword);
                if (result.success) {
                  const freshLeads = await fetchLeadsFromServer();
                  onLeadsUpdated(freshLeads || getStoredLeads());
                  alert('✅ ریست کامل انجام شد! همه کاربران می‌توانند دوباره شرکت کنند.');
                } else if (result.error === 'wrong_password' || result.error === 'no_admin_password') {
                  alert('❌ خطا در احراز هویت ادمین! رمز عبور ادمین ابتدا باید در سرور ثبت شود (از صفحه ورود، رمز را دوباره وارد کنید).');
                } else {
                  alert('⚠️ سرور در دسترس نبود؛ ریست فقط به‌صورت محلی انجام شد.');
                }
              }
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="پاکسازی تمام لیدهای همه کمپین‌ها جهت شروع مجدد"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>ریست کامل همه کمپین‌ها</span>
          </button>
        </div>

      </div>

      {/* Leads Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-4">آیدی اینستاگرام</th>
                <th className="p-4">شماره همراه</th>
                <th className="p-4">کمپین / بازی</th>
                <th className="p-4">جایزه برنده شده</th>
                <th className="p-4">کد تخفیف</th>
                <th className="p-4">تاریخ ثبت</th>
                <th className="p-4 text-center">وضعیت خرید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-amber-300 dir-ltr text-right">
                      {lead.instagramHandle}
                    </td>
                    <td className="p-4 font-mono text-slate-200 dir-ltr text-right">
                      {lead.phoneNumber}
                    </td>
                    <td className="p-4 text-slate-300 font-medium max-w-[180px] truncate">
                      {lead.campaignTitle}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {lead.prizeWon}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400 dir-ltr text-right">
                      {lead.couponCode || 'بدون کد'}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {lead.wonAt}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(lead.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                          lead.isRedeemed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        }`}
                      >
                        {lead.isRedeemed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>خرید انجام شد</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>در انتظار خرید</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    هیچ لید یا شماره‌ای با این مشخصات یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
