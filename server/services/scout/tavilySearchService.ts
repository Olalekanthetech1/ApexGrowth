import { dbService } from '../dbService.js';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
}

export class TavilySearchService {
  private static instance: TavilySearchService;

  public static getInstance(): TavilySearchService {
    if (!TavilySearchService.instance) {
      TavilySearchService.instance = new TavilySearchService();
    }
    return TavilySearchService.instance;
  }

  /**
   * Retrieves active Tavily API Key from Database settings or environment variables
   */
  public async getApiKey(): Promise<string | null> {
    try {
      const settings = await dbService.getScoutSettings();
      if (settings.tavilyApiKey && settings.tavilyApiKey.trim().length > 0) {
        return settings.tavilyApiKey.trim();
      }
    } catch {
      // ignore
    }
    return process.env.TAVILY_API_KEY || null;
  }

  /**
   * Checks if Tavily is active and configured
   */
  public async isConfigured(): Promise<boolean> {
    const key = await this.getApiKey();
    return Boolean(key && key.startsWith('tvly-'));
  }

  /**
   * Performs an AI-optimized search via Tavily
   */
  public async search(
    query: string,
    options: {
      searchDepth?: 'basic' | 'advanced';
      maxResults?: number;
      includeAnswer?: boolean;
      includeDomains?: string[];
      excludeDomains?: string[];
    } = {}
  ): Promise<TavilySearchResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavily API key is not configured. Please add your key in Admin Settings or TAVILY_API_KEY environment variable.');
    }

    const payload = {
      api_key: apiKey,
      query,
      search_depth: options.searchDepth || 'basic',
      max_results: Math.min(options.maxResults || 5, 10),
      include_answer: options.includeAnswer !== false,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ApexGrowth-Intelligence/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Tavily API responded with status ${res.status}: ${errorBody}`);
      }

      const data = await res.json();
      return {
        query: data.query || query,
        answer: data.answer || '',
        results: (data.results || []).map((r: any) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          content: r.content || '',
          score: r.score,
          publishedDate: r.published_date,
        })),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Quick connection tester for Admin Dashboard
   */
  public async testConnection(keyToTest?: string): Promise<{ success: boolean; message: string; answer?: string }> {
    const key = keyToTest || (await this.getApiKey());
    if (!key) {
      return { success: false, message: 'No Tavily API key provided' };
    }

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query: 'ApexGrowth ecommerce conversion rate trends',
          max_results: 1,
          include_answer: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `Tavily test failed (${res.status}): ${errText}` };
      }

      const data = await res.json();
      return {
        success: true,
        message: 'Tavily connection verified! Real-time search is active and operational.',
        answer: data.answer || (data.results?.[0]?.content?.slice(0, 150) + '...'),
      };
    } catch (err: any) {
      return { success: false, message: `Connection test error: ${err?.message || err}` };
    }
  }
}

export const tavilySearchService = TavilySearchService.getInstance();
