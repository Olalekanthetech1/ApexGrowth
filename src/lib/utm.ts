export interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  landingPage?: string;
  referrer?: string;
}

export function captureUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  
  // Try to load cached UTMs from session or read fresh from URL
  const utmSource = urlParams.get('utm_source') || urlParams.get('source') || sessionStorage.getItem('ag_utm_source') || undefined;
  const utmMedium = urlParams.get('utm_medium') || urlParams.get('medium') || sessionStorage.getItem('ag_utm_medium') || undefined;
  const utmCampaign = urlParams.get('utm_campaign') || urlParams.get('campaign') || sessionStorage.getItem('ag_utm_campaign') || undefined;
  const utmContent = urlParams.get('utm_content') || sessionStorage.getItem('ag_utm_content') || undefined;
  const referrer = document.referrer || sessionStorage.getItem('ag_referrer') || undefined;
  const landingPage = window.location.pathname + window.location.search;

  // Cache in session
  if (utmSource) sessionStorage.setItem('ag_utm_source', utmSource);
  if (utmMedium) sessionStorage.setItem('ag_utm_medium', utmMedium);
  if (utmCampaign) sessionStorage.setItem('ag_utm_campaign', utmCampaign);
  if (utmContent) sessionStorage.setItem('ag_utm_content', utmContent);
  if (referrer) sessionStorage.setItem('ag_referrer', referrer);

  return {
    utmSource: utmSource || (referrer ? getReferrerSource(referrer) : 'Direct Website'),
    utmMedium,
    utmCampaign,
    utmContent,
    landingPage,
    referrer,
  };
}

function getReferrerSource(ref: string): string {
  try {
    const url = new URL(ref);
    if (url.hostname.includes('facebook') || url.hostname.includes('fb.')) return 'Facebook';
    if (url.hostname.includes('instagram')) return 'Instagram';
    if (url.hostname.includes('tiktok')) return 'TikTok';
    if (url.hostname.includes('google')) return 'Google Search';
    if (url.hostname.includes('twitter') || url.hostname.includes('x.com')) return 'X (Twitter)';
    if (url.hostname.includes('whatsapp') || url.hostname.includes('wa.me')) return 'WhatsApp';
    if (url.hostname.includes('linkedin')) return 'LinkedIn';
    return url.hostname;
  } catch (e) {
    return 'Referral';
  }
}
