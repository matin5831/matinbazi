import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage';
import { Save, Store, Instagram, Globe, Image, Download, Upload, Check, AlertCircle } from 'lucide-react';

interface StoreSettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onReloadAllData: () => void;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onReloadAllData
}) => {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [instagramUsername, setInstagramUsername] = useState(settings.instagramUsername);
  const [websiteUrl, setWebsiteUrl] = useState(settings.websiteUrl);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      storeName,
      instagramUsername,
      websiteUrl,
      logoUrl
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExport = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matin_bazi_backup_${Date.now()}.json`;
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDataFromJSON(content)) {
        setImportMessage('اطلاعات با موفقیت بازگردانی شد!');
        onReloadAllData();
      } else {
        setImportMessage('خطا در فایل بکاپ. فرمت معتبر نیست.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 dir-rtl animate-fade-in">
      
      {/* Store Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Store className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">پروفایل و اطلاعات فروشگاه</h2>
            <p className="text-xs text-slate-400">نام و آیدی اینستاگرام فروشگاه روی تمام بازی‌ها و صفحات مشتریان قرار می‌گیرد</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>تنظیمات با موفقیت ذخیره شد!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">نام فروشگاه شما</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">آیدی اینستاگرام (بدون @)</label>
            <div className="relative">
              <Instagram className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">آدرس وب‌سایت فروشگاه (اختیاری)</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">لینک تصویر لوگو فروشگاه</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات فروشگاه</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-400" />
          <span>پشتیبان‌گیری و انتقال اطلاعات (Backup & Restore)</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          می‌توانید از تمامی داده‌های کمپین‌ها و لیدهای جمع‌آوری شده خروجی فایل JSON بگیرید تا در هنگام انتقال به سرور اصلی یا Netlify، اطلاعات شما حفظ گردد.
        </p>

        {importMessage && (
          <div className="bg-indigo-950 border border-indigo-500/50 text-indigo-200 text-xs p-3 rounded-xl">
            {importMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>دانلود بکاپ کامل (JSON)</span>
          </button>

          <label className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>بازیابی بکاپ (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
};
