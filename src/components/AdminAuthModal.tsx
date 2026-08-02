import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, ShieldCheck, Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getAdminPassword, setAdminPassword, verifyAdminPassword } from '../utils/storage';
import { setAdminPasswordOnServer, verifyAdminPasswordOnServer, checkAdminStatusFromServer } from '../utils/api';

interface AdminAuthModalProps {
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onSuccess }) => {
  // "First time setup?" must come from the SERVER (authoritative), not localStorage.
  // In incognito/cleared browsers localStorage is empty even though a password already
  // exists server-side — local-only check would wrongly show "set password".
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState<boolean | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    checkAdminStatusFromServer().then((serverSet) => {
      if (cancelled) return;
      if (serverSet === true) {
        setIsFirstTimeSetup(false);            // password exists on server → login
      } else if (serverSet === false) {
        setIsFirstTimeSetup(!getAdminPassword()); // none on server → setup (if local also empty)
      } else {
        setIsFirstTimeSetup(!getAdminPassword()); // offline → trust local storage
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFirstTimeSetup) {
      if (!password.trim() || password.length < 4) {
        setError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
        return;
      }
      if (password !== confirmPassword) {
        setError('تکرار رمز عبور با رمز اصلی مطابقت ندارد.');
        return;
      }
      // Register password server-side too (authoritative for reset/leads endpoints)
      await setAdminPasswordOnServer(password);
      setAdminPassword(password);
      onSuccess();
    } else {
      // Verify against server first (authoritative), fall back to local
      const serverResult = await verifyAdminPasswordOnServer(password);
      if (serverResult !== null) {
        if (serverResult.ok) {
          onSuccess();
        } else if (!serverResult.set) {
          // Server has no password yet (first deploy) — if local password matches,
          // register it on the server so admin APIs work
          if (verifyAdminPassword(password)) {
            await setAdminPasswordOnServer(password);
            onSuccess();
          } else {
            setError('رمز عبور وارد شده اشتباه است!');
          }
        } else {
          setError('رمز عبور وارد شده اشتباه است!');
        }
      } else if (verifyAdminPassword(password)) {
        // Offline — sync to server if reachable later
        await setAdminPasswordOnServer(password);
        onSuccess();
      } else {
        setError('رمز عبور وارد شده اشتباه است!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl dir-rtl">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden animate-scale-up">
        
        {/* Icon & Title Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-300 via-orange-500 to-rose-500 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
              {isFirstTimeSetup ? <KeyRound className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-1.5">
              {isFirstTimeSetup ? 'دیپلوی اولیه - تنظیمات امنیتی' : 'ورود امن مدیریت'}
            </span>
            <h2 className="text-xl font-black text-white">
              {isFirstTimeSetup ? 'تعیین رمز عبور ادمین' : 'ورود به پنل مدیریت متین بازی'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {isFirstTimeSetup
                ? 'جهت حفاظت از کمپین‌ها، لیدها و کدهای تخفیف، لطفاً یک رمز عبور برای پنل ادمین تعیین کنید.'
                : 'جهت دسترسی به داشبورد، رمز عبور مدیریت را وارد نمایید.'}
            </p>
          </div>
        </div>

        {/* Checking server status */}
        {isFirstTimeSetup === null && (
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-400 py-6">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            <span>در حال بررسی وضعیت پنل مدیریت...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-2xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form — only when server status resolved */}
        {isFirstTimeSetup !== null && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              {isFirstTimeSetup ? 'رمز عبور جدید ادمین' : 'رمز عبور'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isFirstTimeSetup ? 'یک رمز عبور امن انتخاب کنید...' : 'رمز عبور ادمین را وارد کنید...'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-4 pl-10 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isFirstTimeSetup && (
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">تکرار رمز عبور جدید</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="تکرار رمز عبور..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-4 pl-10 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95 mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isFirstTimeSetup ? 'ثبت رمز عبور و ورود به داشبورد' : 'ورود به پنل مدیریت'}</span>
          </button>
        </form>
        )}

        {/* Footer Security Badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>پلتفرم متین بازی | امنیت و حریم خصوصی داده‌ها</span>
        </div>

      </div>
    </div>
  );
};
