import React, { useState } from 'react';
import { X, Globe, UploadCloud, Check, ExternalLink, Code2, Server, ArrowRight } from 'lucide-react';

interface NetlifyDeployModalProps {
  onClose: () => void;
}

export const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({ onClose }) => {
  const [copiedBuildCommand, setCopiedBuildCommand] = useState(false);
  const [copiedPublishDir, setCopiedPublishDir] = useState(false);

  const copyText = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto dir-rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">راهنمای انتشار رایگان پروژه روی Netlify</h3>
              <p className="text-xs text-slate-300">بدون نیاز به سرور یا دانش فنی پیچیده، پلتفرم خود را آنلاین کنید!</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Steps */}
        <div className="p-6 space-y-6 text-slate-200 text-xs">
          
          {/* Config snippet banner */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
            <UploadCloud className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-300 mb-1">فایل netlify.toml از قبل آماده شده است!</h4>
              <p className="text-slate-300 leading-relaxed">
                این پروژه دارای ساختار استاندارد Vite و فایل کانفیگ <code className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-mono">netlify.toml</code> است. بنابراین به محض آپلود، نتلیفای تمام مسیرها و روت‌ها را به‌طور خودکار تنظیم می‌کند.
              </p>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                ۱
              </div>
              <div className="space-y-2 w-full">
                <h4 className="text-sm font-bold text-white">خروجی گرفتن از کد یا اتصال به GitHub</h4>
                <p className="text-slate-300 leading-relaxed">
                  کد پروژه را در یک مخزن (Repository) جدید در ریپوزیتوری گیت‌هاب (GitHub) قرار دهید، یا فایل‌های پروژه را به صورت فایل ZIP دانلود کنید.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                ۲
              </div>
              <div className="space-y-2 w-full">
                <h4 className="text-sm font-bold text-white">ورود به Netlify و ایجاد سایت جدید</h4>
                <p className="text-slate-300 leading-relaxed">
                  وارد حساب کاربری خود در <a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline inline-flex items-center gap-1">Netlify <ExternalLink className="w-3 h-3" /></a> شوید و دکمه <strong>"Add new site" → "Import an existing project"</strong> را بزنید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                ۳
              </div>
              <div className="space-y-3 w-full">
                <h4 className="text-sm font-bold text-white">تنظیمات Build در Netlify (مطابق مقادیر زیر)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Build Command (دستور ساخت):</span>
                    <div className="flex items-center justify-between font-mono text-emerald-300 bg-slate-950 px-2.5 py-1.5 rounded-lg text-xs">
                      <span>npm run build</span>
                      <button
                        onClick={() => copyText('npm run build', setCopiedBuildCommand)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedBuildCommand ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Publish directory (پوشه خروجی):</span>
                    <div className="flex items-center justify-between font-mono text-emerald-300 bg-slate-950 px-2.5 py-1.5 rounded-lg text-xs">
                      <span>dist</span>
                      <button
                        onClick={() => copyText('dist', setCopiedPublishDir)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {copiedPublishDir ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                ۴
              </div>
              <div className="space-y-2 w-full">
                <h4 className="text-sm font-bold text-white">اتصال دامنه اختصاصی (اختیاری)</h4>
                <p className="text-slate-300 leading-relaxed">
                  پس از انتشار، می‌توانید دامنه اختصاصی فروشگاه خود مانند <code className="bg-slate-900 text-amber-300 px-1 py-0.5 rounded">my-shop.ir</code> یا زیردامنه <code className="bg-slate-900 text-amber-300 px-1 py-0.5 rounded">game.my-shop.ir</code> را به راحتی از بخش Domain Settings تنظیم کنید!
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              متوجه شدم، متشکرم!
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
