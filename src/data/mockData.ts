import { Campaign, PlayerLead, StoreSettings } from '../types';

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'فروشگاه شیک‌پوشان',
  instagramUsername: 'shikpooshan_shop',
  websiteUrl: 'https://shikpooshan.ir',
  logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  primaryColor: '#6366f1',
  phonePrefix: '09',
  enableWooCommerce: false,
  wooCommerceUrl: '',
  wooCommerceConsumerKey: '',
  wooCommerceConsumerSecret: '',
};

/** Only ONE campaign: the ALL-games campaign containing all 5 games.
 *  Each user gets ONE play per campaign until the admin resets it. */
export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-all-games-00',
    title: 'بازی و جایزه 🎮',
    description: 'هر ۵ بازی شانس در یک کمپین — کاربر یکی از بازی‌ها را انتخاب می‌کند و شانس برنده شدن کد تخفیف دارد',
    useDefaultStoreInfo: true,
    storeName: 'فروشگاه شیک‌پوشان',
    storeInstagram: 'shikpooshan_shop',
    storeLogoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    gameType: 'ALL',
    themeColor: '#8b5cf6',
    accentColor: '#f59e0b',
    bgGradient: 'from-purple-900 via-indigo-950 to-slate-950',
    requireInstagramFollow: true,
    requirePhoneNumber: true,
    requireStoryMention: false,
    maxSpinsPerUser: 1,
    expiryDays: 30,
    isActive: true,
    createdAt: '1404/05/11',
    totalPlays: 0,
    totalWinners: 0,
    customHeadline: 'همه بازی‌ها را تجربه کنید! 🎮',
    customSubheadline: 'یکی از ۵ بازی را انتخاب کنید — فقط یک شانس در این کمپین دارید',
    customTerms: 'هر آیدی اینستاگرام و شماره همراه فقط یک بار مجاز به شرکت در این کمپین است.',
    prizes: [
      { id: 'p1', label: 'کد تخفیف ۵۰٪', subLabel: 'مخصوص خرید بالای ۵۰۰ هزار تومان', probability: 5, couponCode: 'OFF50-SHIK', discountPercent: 50, color: '#ec4899', isWin: true },
      { id: 'p2', label: 'کد تخفیف ۳۰٪', subLabel: 'روی تمام محصولات سایت', probability: 15, couponCode: 'OFF30-SPECIAL', discountPercent: 30, color: '#8b5cf6', isWin: true },
      { id: 'p3', label: 'کد تخفیف ۲۰٪', subLabel: 'هدیه اولین خرید', probability: 25, couponCode: 'WELCOME20', discountPercent: 20, color: '#10b981', isWin: true },
      { id: 'p4', label: 'ارسال رایگان 🚚', subLabel: 'برای همه خریدهای این هفته', probability: 15, couponCode: 'FREE-DELIVERY', discountPercent: 100, color: '#3b82f6', isWin: true },
      { id: 'p5', label: 'پوچ! دوباره تلاش کن', subLabel: 'فرصت بعدی در بازی بعدی', probability: 40, couponCode: '', color: '#475569', isWin: false },
    ],
    quizQuestions: [
      {
        id: 'default-q1',
        question: 'بهترین روش دریافت تخفیف از فروشگاه چیست؟',
        options: ['شرکت در کمپین', 'ارسال پیام به ادمین', 'هر دو مورد بالا'],
        correctOptionIndex: 2
      }
    ]
  }
];

/** No sample leads — server (Redis) is authoritative. */
export const INITIAL_LEADS: PlayerLead[] = [];
