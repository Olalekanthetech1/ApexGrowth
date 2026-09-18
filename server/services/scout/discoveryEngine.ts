import { RawOpportunityCandidate } from './types.js';
import { dbService } from '../dbService.js';

export class DiscoveryEngine {
  /**
   * Discovers raw candidate opportunities dynamically from live public forums and feeds.
   * Fully dynamic, adaptive, and future-proof. Never relies on hardcoded seeds or mock items.
   */
  public async discoverCandidates(
    niches: string[] = ['E-commerce Brands', 'Shopify Store Owners', 'Course & Digital Creators'],
    keywords: string[] = ['checkout', 'conversion', 'store feedback', 'bounce rate', 'ad script', 'sales drop', 'landing page']
  ): Promise<RawOpportunityCandidate[]> {
    const candidates: RawOpportunityCandidate[] = [];
    const seenUrls = new Set<string>();

    // 1. Live Reddit Public Feeds across multiple business & creator communities
    const targetSubreddits = [
      'shopify',
      'ecommerce',
      'smallbusiness',
      'entrepreneur',
      'dropship',
      'startups',
      'DigitalMarketing',
    ];

    for (const sub of targetSubreddits) {
      try {
        const subCandidates = await this.fetchRedditPublicFeed(sub, keywords, niches);
        for (const cand of subCandidates) {
          if (!seenUrls.has(cand.sourceUrl)) {
            seenUrls.add(cand.sourceUrl);
            candidates.push(cand);
          }
        }
      } catch (err: any) {
        console.warn(`[DiscoveryEngine] Feed scan notice for r/${sub}:`, err?.message || err);
      }
    }

    // 2. Live Hacker News "Ask HN" & "Show HN" public feeds (100% open, reliable, no authentication needed)
    try {
      const hnCandidates = await this.fetchHackerNewsFeed(keywords);
      for (const cand of hnCandidates) {
        if (!seenUrls.has(cand.sourceUrl)) {
          seenUrls.add(cand.sourceUrl);
          candidates.push(cand);
        }
      }
    } catch (err: any) {
      console.warn('[DiscoveryEngine] HackerNews live feed scan notice:', err?.message || err);
    }

    // 3. Tavily AI Real-Time Web Search (if Tavily API key is configured)
    try {
      const { tavilySearchService } = await import('./tavilySearchService.js');
      if (await tavilySearchService.isConfigured()) {
        const tavilyCandidates = await this.fetchTavilySearchCandidates(niches, keywords);
        for (const cand of tavilyCandidates) {
          if (!seenUrls.has(cand.sourceUrl)) {
            seenUrls.add(cand.sourceUrl);
            candidates.push(cand);
          }
        }
      }
    } catch (err: any) {
      console.warn('[DiscoveryEngine] Tavily dynamic web search notice:', err?.message || err);
    }

    // 4. Deduplicate against existing stored opportunities in database
    const existingUrls = await dbService.getExistingOpportunitySourceUrls();
    const freshCandidates = candidates.filter((c) => !existingUrls.has(c.sourceUrl));

    return freshCandidates;
  }

  /**
   * Discovers fresh high-intent e-commerce and founder discussions via Tavily AI Search
   */
  private async fetchTavilySearchCandidates(
    niches: string[],
    keywords: string[]
  ): Promise<RawOpportunityCandidate[]> {
    const results: RawOpportunityCandidate[] = [];
    const { tavilySearchService } = await import('./tavilySearchService.js');

    const searchQueries = [
      'site:reddit.com/r/shopify inurl:comments "checkout" OR "conversion rate" OR "store feedback"',
      'site:reddit.com/r/ecommerce inurl:comments "bounce rate" OR "abandoned cart" OR "low sales"',
      'site:twitter.com OR site:x.com "my shopify store" ("conversion" OR "feedback" OR "checkout")',
      'site:indiehackers.com "conversion rate" OR "drop off" OR "checkout friction"',
    ];

    const excludedDomains = [
      'youtube.com',
      'youtu.be',
      'tiktok.com',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv',
      'pinterest.com',
      'facebook.com',
    ];

    for (const q of searchQueries.slice(0, 3)) {
      try {
        const searchResp = await tavilySearchService.search(q, {
          maxResults: 6,
          searchDepth: 'basic',
          excludeDomains: excludedDomains,
        });

        for (const item of searchResp.results || []) {
          if (!item.url || !item.title) continue;

          // Skip any video links that slip through
          const lowerUrl = item.url.toLowerCase();
          if (
            lowerUrl.includes('youtube.com') ||
            lowerUrl.includes('youtu.be') ||
            lowerUrl.includes('tiktok.com') ||
            lowerUrl.includes('/watch?v=')
          ) {
            continue;
          }

          const combinedText = `${item.title} ${item.content || ''}`;
          const lowerCombined = combinedText.toLowerCase();

          // Identify platform
          let sourcePlatform: 'reddit' | 'twitter' | 'web_search' = 'web_search';
          if (lowerUrl.includes('reddit.com')) {
            sourcePlatform = 'reddit';
          } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
            sourcePlatform = 'twitter';
          }

          // Extract website domain if mentioned
          const urlRegex = /(https?:\/\/[^\s\)\],<]+)/gi;
          const foundUrls = (item.content || '').match(urlRegex) || [];
          let websiteUrl: string | undefined;
          for (const u of foundUrls) {
            const clean = u.replace(/[\.,\?]$/, '');
            if (
              !clean.includes('reddit.com') &&
              !clean.includes('twitter.com') &&
              !clean.includes('x.com') &&
              !clean.includes('tavily.com') &&
              !clean.includes('indiehackers.com')
            ) {
              websiteUrl = clean;
              break;
            }
          }

          // Dynamically detect prospect and business name
          let prospectName = 'Founder';
          let businessName = 'E-commerce Brand';

          if (websiteUrl) {
            try {
              const parsed = new URL(websiteUrl);
              const host = parsed.hostname.replace(/^www\./, '');
              const namePart = host.split('.')[0];
              businessName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
              prospectName = `${businessName} Founder`;
            } catch {
              // fallback
            }
          }

          // If from Reddit, extract author or thread context
          if (sourcePlatform === 'reddit') {
            const redditAuthorMatch = combinedText.match(/u\/([a-zA-Z0-9_-]{3,25})/i) || item.url.match(/user\/([a-zA-Z0-9_-]{3,25})/i);
            if (redditAuthorMatch && redditAuthorMatch[1]) {
              prospectName = redditAuthorMatch[1];
            } else if (!websiteUrl) {
              prospectName = 'Community Founder';
            }
          } else if (sourcePlatform === 'twitter') {
            const twMatch = item.url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]{1,20})/i);
            if (twMatch && twMatch[1] && twMatch[1] !== 'status' && twMatch[1] !== 'home') {
              prospectName = `@${twMatch[1]}`;
            }
          }

          // Dynamically extract real pain points from keywords present in the content
          const matchedKeywords = keywords.filter((kw) => lowerCombined.includes(kw.toLowerCase()));
          const detectedPainPoints =
            matchedKeywords.length > 0
              ? matchedKeywords.map((kw) => `Inquiry discussing ${kw}`)
              : ['E-commerce store optimization inquiry'];

          // Extract contacts with appropriate platform tag
          const contacts = this.extractContactsFromText(
            combinedText,
            prospectName === 'Founder' || prospectName === 'Community Founder' ? '' : prospectName,
            item.url,
            sourcePlatform
          );

          results.push({
            title: item.title.slice(0, 100),
            prospectName,
            businessName,
            websiteUrl,
            niche: niches[0] || 'E-commerce Brands',
            sourcePlatform,
            sourceUrl: item.url,
            sourcePostExcerpt: (item.content || item.title).slice(0, 400),
            detectedPainPoints,
            publicFoundContacts: contacts,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.warn(`[DiscoveryEngine] Tavily query error (${q}):`, err?.message || err);
      }
    }

    return results;
  }

  /**
   * Fetches and parses live Reddit public JSON feeds.
   */
  private async fetchRedditPublicFeed(
    subreddit: string,
    keywords: string[],
    niches: string[]
  ): Promise<RawOpportunityCandidate[]> {
    const results: RawOpportunityCandidate[] = [];
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (AutonomousScoutBot/1.0)`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!resp.ok) return results;

      const data: any = await resp.json();
      const posts = data?.data?.children || [];

      for (const item of posts) {
        const p = item.data;
        if (!p || p.over_18 || p.stickied) continue;

        const title = p.title || '';
        const selftext = p.selftext || '';
        const combinedText = `${title} ${selftext}`.toLowerCase();

        // Check if post matches any of the conversion/growth keywords
        const matchedKeywords = keywords.filter((kw) => combinedText.includes(kw.toLowerCase()));
        if (matchedKeywords.length === 0) continue;

        // Dynamically extract any website URLs in post
        const urlRegex = /(https?:\/\/[^\s\)\],<]+)/gi;
        const matchedUrls = (selftext + ' ' + title).match(urlRegex) || [];
        
        let websiteUrl: string | undefined;
        for (const foundUrl of matchedUrls) {
          const clean = foundUrl.replace(/[\.,\?]$/, '');
          // Exclude reddit/imgur links
          if (!clean.includes('reddit.com') && !clean.includes('redd.it') && !clean.includes('imgur.com')) {
            websiteUrl = clean;
            break;
          }
        }

        // Derive business or store name adaptively
        let businessName = p.author ? `${p.author}'s Venture` : 'Prospective Brand';
        if (websiteUrl) {
          try {
            const parsed = new URL(websiteUrl);
            const host = parsed.hostname.replace(/^www\./, '');
            const namePart = host.split('.')[0];
            businessName = namePart.charAt(0).toUpperCase() + namePart.slice(1) + ' Store';
          } catch {
            // Keep default
          }
        }

        // Dynamically assign appropriate niche
        let matchedNiche = niches[0] || 'E-commerce Brands';
        if (subreddit === 'shopify' || combinedText.includes('shopify') || combinedText.includes('store')) {
          matchedNiche = 'Shopify Store Owners';
        } else if (combinedText.includes('course') || combinedText.includes('coach') || combinedText.includes('webinar')) {
          matchedNiche = 'Course & Digital Creators';
        }

        // Extract public contacts directly mentioned in post
        const publicContacts = this.extractContactsFromText(selftext, p.author, `r/${subreddit} post`);

        results.push({
          title: title || 'Inquiry on conversion and store optimization',
          prospectName: p.author || 'Founder',
          businessName,
          websiteUrl,
          niche: matchedNiche,
          sourcePlatform: 'reddit',
          sourceUrl: `https://reddit.com${p.permalink || `/r/${subreddit}/comments/${p.id}`}`,
          sourcePostExcerpt: (selftext || title).slice(0, 350),
          detectedPainPoints: matchedKeywords.map((kw) => `Discussion mentioning "${kw}"`),
          publicFoundContacts: publicContacts,
          timestamp: new Date(p.created_utc ? p.created_utc * 1000 : Date.now()).toISOString(),
        });
      }
    } catch {
      // Graceful exit on network abort/timeout
    } finally {
      clearTimeout(timeout);
    }

    return results;
  }

  /**
   * Fetches real-time Hacker News public stories (Ask HN / Show HN) for creators & founders.
   */
  private async fetchHackerNewsFeed(keywords: string[]): Promise<RawOpportunityCandidate[]> {
    const results: RawOpportunityCandidate[] = [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const askResp = await fetch('https://hacker-news.firebaseio.com/v0/askstories.json', {
        signal: controller.signal,
      });

      if (!askResp.ok) return results;

      const storyIds: number[] = await askResp.json();
      const topStoryIds = (storyIds || []).slice(0, 15);

      for (const id of topStoryIds) {
        try {
          const itemResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (!itemResp.ok) continue;

          const item: any = await itemResp.json();
          if (!item || !item.title) continue;

          const combined = `${item.title} ${item.text || ''}`.toLowerCase();
          const matches = keywords.filter((kw) => combined.includes(kw.toLowerCase()));

          if (matches.length > 0) {
            const urlRegex = /(https?:\/\/[^\s\)\],<]+)/gi;
            const urlMatch = (item.text || item.title).match(urlRegex);
            const websiteUrl = urlMatch ? urlMatch[0].replace(/[\.,\?]$/, '') : item.url;

            results.push({
              title: item.title,
              prospectName: item.by || 'Founder',
              businessName: item.by ? `${item.by}'s Project` : 'Digital Project',
              websiteUrl,
              niche: 'Course & Digital Creators',
              sourcePlatform: 'web_search',
              sourceUrl: `https://news.ycombinator.com/item?id=${item.id}`,
              sourcePostExcerpt: (item.text || item.title).replace(/<[^>]*>/g, '').slice(0, 300),
              detectedPainPoints: matches.map((m) => `Founder inquiring about "${m}"`),
              publicFoundContacts: [
                {
                  type: 'custom',
                  value: item.by,
                  sourceLocation: 'Hacker News Public Profile',
                  confidence: 'HIGH',
                  directLink: `https://news.ycombinator.com/user?id=${item.by}`,
                },
              ],
              timestamp: new Date(item.time ? item.time * 1000 : Date.now()).toISOString(),
            });
          }
        } catch {
          // Continue to next story
        }
      }
    } catch {
      // Graceful timeout
    } finally {
      clearTimeout(timeout);
    }

    return results;
  }

  /**
   * Dynamically extracts email, social handles, or phone from text using adaptive regex.
   */
  private extractContactsFromText(
    text: string,
    author: string,
    sourceLabel: string,
    platform: 'reddit' | 'twitter' | 'web_search' | 'custom' = 'web_search'
  ) {
    const contacts: any[] = [];

    // Email regex
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emails = text.match(emailRegex);
    if (emails) {
      for (const email of Array.from(new Set(emails))) {
        contacts.push({
          type: 'email',
          value: email,
          sourceLocation: `Mentioned in ${sourceLabel}`,
          confidence: 'HIGH',
          directLink: `mailto:${email}`,
        });
      }
    }

    // Instagram handle
    const igRegex = /(?:instagram\.com\/|@)([a-zA-Z0-9_.-]{3,30})/i;
    const igMatch = text.match(igRegex);
    if (igMatch && igMatch[1]) {
      const handle = igMatch[1].replace(/^@/, '');
      contacts.push({
        type: 'instagram',
        value: `@${handle}`,
        sourceLocation: `Extracted from ${sourceLabel}`,
        confidence: 'MEDIUM',
        directLink: `https://instagram.com/${handle}`,
      });
    }

    // Discord invite link or tag
    const discordRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/([a-zA-Z0-9_-]+)/gi;
    const discordMatch = text.match(discordRegex);
    if (discordMatch) {
      for (const invite of Array.from(new Set(discordMatch))) {
        const cleanUrl = invite.startsWith('http') ? invite : `https://${invite}`;
        contacts.push({
          type: 'discord',
          value: cleanUrl.replace(/^https?:\/\//, ''),
          sourceLocation: `Discord Community Invite in ${sourceLabel}`,
          confidence: 'HIGH',
          directLink: cleanUrl,
        });
      }
    }

    // Platform-accurate source author profile
    if (author && author.trim().length > 0) {
      const cleanAuthor = author.trim();
      const isReddit = platform === 'reddit' || sourceLabel.includes('r/') || sourceLabel.includes('reddit.com');
      const isTwitter = platform === 'twitter' || sourceLabel.includes('twitter.com') || sourceLabel.includes('x.com');

      if (isReddit) {
        const uName = cleanAuthor.replace(/^u\//, '');
        contacts.push({
          type: 'reddit',
          value: `u/${uName}`,
          sourceLocation: `Source author on ${sourceLabel}`,
          confidence: 'HIGH',
          directLink: `https://reddit.com/user/${uName}`,
        });
      } else if (isTwitter) {
        const handle = cleanAuthor.replace(/^@/, '');
        contacts.push({
          type: 'twitter',
          value: `@${handle}`,
          sourceLocation: `Author on ${sourceLabel}`,
          confidence: 'HIGH',
          directLink: `https://x.com/${handle}`,
        });
      } else if (cleanAuthor !== 'Founder' && cleanAuthor !== 'Community Founder') {
        contacts.push({
          type: 'custom',
          value: cleanAuthor,
          sourceLocation: `Author / Reference on ${sourceLabel}`,
          confidence: 'MEDIUM',
          directLink: sourceLabel.startsWith('http') ? sourceLabel : undefined,
        });
      }
    }

    return contacts;
  }
}

export const discoveryEngine = new DiscoveryEngine();
