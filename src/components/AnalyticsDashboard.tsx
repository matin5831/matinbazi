import React, { useState } from 'react';
import { PlayerLead, Campaign } from '../types';
import { toggleRedeemStatus } from '../utils/storage';
import { Users, Phone, Award, Download, Copy, Check, Search, Filter, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface AnalyticsDashboardProps {
  leads: PlayerLead[];
  campaigns: Campaign[];
  onLeadsUpdated: (leads: PlayerLead[]) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ leads, campaigns, onLeadsUpdated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('ALL');
  const [copiedPhones, setCopiedPhones] = useState(false);

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

  const handleToggleStatus = (id: string) => {
    const updated = toggleRedeemStatus(id);
    onLeadsUpdated(updated);
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
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
            <h3 className="text-2xl font-black text-purple-400">{redeemedCount.toLocaleString('fa-IR')}</h3>
            <span className="text-[10px] text-purple-300 mt-1 block">خرید قطعی ثبت‌شده</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

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
        <div className="flex items-center gap-2.5 w-full md:w-auto">
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
