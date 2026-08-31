export type AnalyticsEventType =
  | 'page_view'
  | 'cta_click'
  | 'checkout_start'
  | 'payment_method_select'
  | 'payment_success'
  | 'payment_failed'
  | 'lead_submission'
  | 'utm_touch';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  path: string;
  elementId?: string;
  label?: string;
  packageSlug?: string;
  paymentMethod?: string;
  amountUsd?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp: string;
}

// Client-side analytics tracker
class AnalyticsTracker {
  private utmParams: Record<string, string> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.extractUtmParams();
    }
  }

  private extractUtmParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('utm_source');
      const medium = params.get('utm_medium');
      const campaign = params.get('utm_campaign');
      const content = params.get('utm_content');

      if (source || medium || campaign) {
        this.utmParams = {
          ...(source && { utmSource: source }),
          ...(medium && { utmMedium: medium }),
          ...(campaign && { utmCampaign: campaign }),
          ...(content && { utmContent: content }),
        };
        // Persist UTM parameters in sessionStorage
        sessionStorage.setItem('apexgrowth_utm', JSON.stringify(this.utmParams));
      } else {
        const stored = sessionStorage.getItem('apexgrowth_utm');
        if (stored) {
          this.utmParams = JSON.parse(stored);
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  public getStoredUtm(): Record<string, string> {
    return { ...this.utmParams };
  }

  public track(eventType: AnalyticsEventType, data: Partial<AnalyticsEvent> = {}) {
    const event: AnalyticsEvent = {
      eventType,
      path: data.path || window.location.pathname,
      timestamp: new Date().toISOString(),
      ...this.utmParams,
      ...data,
    };

    // Console logging in dev / non-intrusive dispatch
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics Event] ${eventType.toUpperCase()}:`, event);
    }

    // Send payload to backend telemetry endpoint asynchronously
    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {
        // Silently ignore telemetry network glitches
      });
    } catch (e) {
      // Non-blocking
    }
  }
}

export const analytics = new AnalyticsTracker();
