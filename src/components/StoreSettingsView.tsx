import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage';
import { setAdminPassword } from '../utils/storage';
import { testWooCommerceConnection } from '../utils/woocommerce';
import { Save, Store, Instagram, Globe, Image, Download, Upload, Check, ShoppingBag, Key, Link2, RefreshCw, AlertCircle, HelpCircle, Lock, ShieldCheck } from 'lucide-react';

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

  // WooCommerce State
  const [enableWooCommerce, setEnableWooCommerce] = useState(settings.enableWooCommerce || false);
  const [wooCommerceUrl, setWooCommerceUrl] = useState(settings.wooCommerceUrl || '');
  const [wooCommerceConsumerKey, setWooCommerceConsumerKey] = useState(settings.wooCommerceConsumerKey || '');
  const [wooCommerceConsumerSecret, setWooCommerceConsumerSecret] = useState(settings.wooCommerceConsumerSecret || '');

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Admin Password state in settings
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [passUpdateMsg, setPassUpdateMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassUpdateMsg(null);
    if (!newAdminPass || newAdminPass.length < 4) {
      setPassUpdateMsg({ success: false, text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setPassUpdateMsg({ success: false, text: 'تکرار رمز عبور جدید مطابقت ندارد.' });
      return;
    }

    setAdminPassword(newAdminPass);
    setPassUpdateMsg({ success: true, text: 'رمز عبور ادمین با موفقیت به روزرسانی شد!' });
    setNewAdminPass('');
    setConfirmAdminPass('');
    setTimeout(() => setPassUpdateMsg(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      storeName,
      instagramUsername,
      websiteUrl,
      logoUrl,
      enableWooCommerce,
      wooCommerceUrl,
      wooCommerceConsumerKey,
      wooCommerceConsumerSecret
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestWooConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const targetUrl = wooCommerceUrl || websiteUrl;
    const res = await testWooCommerceConnection(targetUrl, wooCommerceConsumerKey, wooCommerceConsumerSecret);
    setTestResult(res);
    setTestingConnection(false);
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
      
      {/* Store Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Store Basic Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Store className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">پروفایل و اطلاعات عمومی فروشگاه</h2>
              <p className="text-xs text-slate-400">نام و آیدی اینستاگرام فروشگاه روی تمام بازی‌ها و صفحات مشتریان قرار می‌گیرد</p>
            </div>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2 animate-scale-up">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>تنظیمات با موفقیت ذخیره شد!</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
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
              <label className="block text-slate-300 font-bold mb-1">آدرس وب‌سایت فروشگاه (اصلی)</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="url"
                  placeholder="https://myshop.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">لوگو فروشگاه</label>
              
              {/* Logo Preview & Upload Section */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="relative shrink-0">
                      <img
                        src={logoUrl}
                        alt="لوگوی فروشگاه"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow cursor-pointer"
                        title="حذف لوگو"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Image className="w-6 h-6" />
                      <span className="text-[9px] mt-0.5">بدون لوگو</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>آپلود فایل لوگو (حداکثر ۵۰۰KB)</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Limit size to 500 KB (512,000 bytes)
                            const MAX_SIZE = 500 * 1024;
                            if (file.size > MAX_SIZE) {
                              alert(`حجم تصویر انتخابی (${(file.size / 1024).toFixed(0)} کیلوبایت) بیش از حد مجاز است. حداکثر حجم مجاز برای حفظ سرعت سرور ۵۰۰ کیلوبایت می‌باشد.`);
                              e.target.value = '';
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              if (result) {
                                setLogoUrl(result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          پاک کردن لوگو
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      فرمت‌های پشتیبانی شده: PNG, JPG, WEBP (جهت بهینه‌سازی سرعت سرور، حداکثر حجم ۵۰۰KB تعیین شده است).
                    </p>
                  </div>
                </div>

                {/* External URL Input Option */}
                <div className="pt-2 border-t border-slate-900">
                  <label className="block text-slate-400 text-[11px] mb-1">یا درج آدرس اینترنتی (URL) لوگو:</label>
                  <div className="relative">
                    <Image className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    <input
                      type="url"
                      placeholder="https://myshop.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white focus:border-amber-400 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WooCommerce REST API Card */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>اتصال به API ووکامرس (WooCommerce REST API)</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                    ثبت اتوماتیک کدهای تخفیف
                  </span>
                </h3>
                <p className="text-xs text-slate-400">ساخت خودکار کد تخفیف برندگان در ووکامرس برای اعمال مستقیم روی سبد خرید مشتری</p>
              </div>
            </div>

            {/* Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableWooCommerce}
                onChange={(e) => setEnableWooCommerce(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {enableWooCommerce ? (
            <div className="space-y-4 text-xs animate-fade-in pt-1">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>راهنمای دریافت کلید API ووکامرس:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  در پنل وردپرس فروشگاه خود به مسیر <strong>ووکامرس ← پیکربندی ← پیشرفته ← REST API</strong> بروید. یک کلید جدید بسازید و دسترسی آن را روی <strong>خواندنی / نوشتنی (Read/Write)</strong> قرار دهید. سپس Consumer Key و Consumer Secret را در زیر کپی کنید.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">آدرس سایت وردپرس/ووکامرس</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://myshop.com"
                    value={wooCommerceUrl}
                    onChange={(e) => setWooCommerceUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Consumer Key (کلید عمومی)</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={wooCommerceConsumerKey}
                    onChange={(e) => setWooCommerceConsumerKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white font-mono focus:border-purple-400 focus:outline-none dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Consumer Secret (کلید سری)</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={wooCommerceConsumerSecret}
                    onChange={(e) => setWooCommerceConsumerSecret(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-white font-mono focus:border-purple-400 focus:outline-none dir-ltr"
                  />
                </div>
              </div>

              {/* Test Connection Result Alert */}
              {testResult && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                }`}>
                  {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Test Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestWooConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'در حال تست ارتباط...' : 'تست اتصال با ووکامرس'}</span>
                </button>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
              اتصال اتوماتیک به ووکامرس خاموش است. کدهای تخفیف به صورت متنی در سیستم ثبت می‌شوند. با روشن کردن این گزینه، برندگان به صورت لحظه‌ای کد تخفیف را در ووکامرس دریافت می‌کنند.
            </p>
          )}

        </div>

        {/* Submit Form Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تمام تنظیمات</span>
          </button>
        </div>

      </form>

      {/* Security & Admin Password Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">تغییر رمز عبور مدیریت داشبورد</h3>
            <p className="text-[11px] text-slate-400">تغییر رمز ورودی ادمین به پنل مدیریت متین بازی</p>
          </div>
        </div>

        {passUpdateMsg && (
          <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
            passUpdateMsg.success
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}>
            {passUpdateMsg.success ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passUpdateMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label className="block text-slate-300 font-bold mb-1">رمز عبور جدید ادمین</label>
            <input
              type="password"
              placeholder="رمز عبور جدید..."
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">تکرار رمز عبور جدید</label>
            <input
              type="password"
              placeholder="تکرار رمز عبور..."
              value={confirmAdminPass}
              onChange={(e) => setConfirmAdminPass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>به‌روزرسانی رمز عبور ادمین</span>
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
          می‌توانید از تمامی داده‌های کمپین‌ها و لیدهای جمع‌آوری شده خروجی فایل JSON بگیرید تا در هنگام انتقال به سرور اصلی یا Render.com، اطلاعات شما حفظ گردد.
        </p>

        {importMessage && (
          <div className="bg-indigo-950 border border-indigo-500/50 text-indigo-200 text-xs p-3 rounded-xl">
            {importMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
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

