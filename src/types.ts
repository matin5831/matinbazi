export const APP_VERSION = '1.3.1';

export type GameType = 'WHEEL' | 'SCRATCH' | 'SLOT' | 'QUIZ' | 'MYSTERY_BOX' | 'ALL';

/** All playable game types (excluding the ALL hub container) */
export const ALL_GAME_TYPES: GameType[] = ['WHEEL', 'SCRATCH', 'SLOT', 'QUIZ', 'MYSTERY_BOX'];

export interface Prize {
  id: string;
  label: string;
  subLabel?: string;
  probability: number; // 0 - 100 %
  couponCode: string;
  discountPercent?: number;
  color: string;
  isWin: boolean;
  remainingQuantity?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  storeName: string;
  storeInstagram: string;
  storeLogoUrl?: string;
  storeWebsiteUrl?: string;
  useDefaultStoreInfo?: boolean;
  gameType: GameType;
  themeColor: string;
  accentColor: string;
  bgGradient: string;
  prizes: Prize[];
  quizQuestions?: QuizQuestion[];
  requireInstagramFollow: boolean;
  requirePhoneNumber: boolean;
  requireStoryMention: boolean;
  maxSpinsPerUser: number;
  expiryDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: number;
  totalPlays: number;
  totalWinners: number;
  customHeadline?: string;
  customSubheadline?: string;
  customTerms?: string;
  bannerText?: string;
}

export interface PlayerLead {
  id: string;
  campaignId: string;
  campaignTitle: string;
  instagramHandle: string;
  phoneNumber: string;
  prizeWon: string;
  couponCode: string;
  wonAt: string;
  isRedeemed: boolean;
  gameType: GameType;
  createdAt?: number; // epoch ms — unused coupons auto-invalidate after 48h
}

export interface StoreSettings {
  storeName: string;
  instagramUsername: string;
  websiteUrl: string;
  logoUrl: string;
  primaryColor: string;
  phonePrefix: string;
  // WooCommerce REST API Integration
  enableWooCommerce?: boolean;
  wooCommerceUrl?: string;
  wooCommerceConsumerKey?: string;
  wooCommerceConsumerSecret?: string;
}
