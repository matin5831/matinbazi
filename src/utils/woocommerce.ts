import { StoreSettings } from '../types';

export interface CreateCouponParams {
  code: string;
  discountType?: 'percent' | 'fixed_cart';
  amount?: string | number;
  description?: string;
  usageLimit?: number;
  individualUse?: boolean;
}

export interface WooCommerceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Normalizes store URL to strip trailing slashes and ensure https://
 */
function normalizeUrl(url: string): string {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  return cleanUrl.replace(/\/+$/, '');
}

/**
 * Tests connection to WooCommerce API by fetching existing coupons list
 */
export async function testWooCommerceConnection(
  url: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooCommerceResponse> {
  if (!url || !consumerKey || !consumerSecret) {
    return {
      success: false,
      message: 'لطفا آدرس سایت، Consumer Key و Consumer Secret را کامل وارد نمایید.'
    };
  }

  try {
    const baseUrl = normalizeUrl(url);
    const endpoint = `${baseUrl}/wp-json/wc/v3/coupons?per_page=1&consumer_key=${encodeURIComponent(consumerKey.trim())}&consumer_secret=${encodeURIComponent(consumerSecret.trim())}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'اتصال به ووکامرس با موفقیت برقرار شد!',
        data,
      };
    } else {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // null
      }
      return {
        success: false,
        message: errorJson?.message || `خطای اتصال (${response.status}): کلیدهای API یا آدرس سایت اشتباه است.`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `خطای ارتباط با سرور ووکامرس: ${error.message || 'CORS یا قطع بودن اینترنت'}`,
    };
  }
}

/**
 * Automatically creates a coupon in WooCommerce store via REST API
 */
export async function createWooCommerceCoupon(
  settings: StoreSettings,
  couponParams: CreateCouponParams
): Promise<WooCommerceResponse> {
  if (!settings.enableWooCommerce || !settings.wooCommerceUrl || !settings.wooCommerceConsumerKey || !settings.wooCommerceConsumerSecret) {
    return {
      success: false,
      message: 'اتصال ووکامرس فعال نشده یا اطلاعات API ناقص است.'
    };
  }

  try {
    const baseUrl = normalizeUrl(settings.wooCommerceUrl);
    const endpoint = `${baseUrl}/wp-json/wc/v3/coupons?consumer_key=${encodeURIComponent(settings.wooCommerceConsumerKey.trim())}&consumer_secret=${encodeURIComponent(settings.wooCommerceConsumerSecret.trim())}`;

    const payload = {
      code: couponParams.code.toUpperCase().trim(),
      discount_type: couponParams.discountType || 'percent',
      amount: String(couponParams.amount || '10'),
      individual_use: couponParams.individualUse ?? true,
      exclude_sale_items: false,
      usage_limit: couponParams.usageLimit || 1,
      usage_limit_per_user: 1,
      description: couponParams.description || 'ایجاد شده خودکار توسط کمپین متین بازی',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `کد تخفیف ${payload.code} با موفقیت در ووکامرس ایجاد شد!`,
        data,
      };
    } else {
      const errorData = await response.json().catch(() => null);
      if (errorData?.code === 'woocommerce_rest_coupon_code_already_exists') {
        return {
          success: true,
          message: `کد تخفیف ${payload.code} قبلاً در سایت تعریف شده و آماده استفاده است.`,
        };
      }
      return {
        success: false,
        message: errorData?.message || `خطا در ایجاد کد تخفیف در ووکامرس (کد status: ${response.status})`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `خطا در اتصال به ووکامرس: ${error.message}`,
    };
  }
}
