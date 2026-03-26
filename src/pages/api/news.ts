import type { APIRoute } from 'astro';

type ApiName = 'NewsData' | 'WorldNews' | 'Finnhub' | 'GNews' | 'Lazarus Report';

interface NewsArticle {
  title: string;
  category: string;
  excerpt: string;
  image?: string;
  date: string;
  source: ApiName;
  publisher?: string; // Original source name (e.g., Reuters, SCMP)
  sourceName?: string; // For debugging and transparency
  url: string;
  isBreaking?: boolean;
}

interface ApiSelection {
  name: ApiName;
  baseUrl: string;
  key: string;
  params: Record<string, string | number>;
}

// Global In-Memory Cache (Simple implementation for demo/dev)
const cache = new Map<string, { data: NewsArticle[]; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API Rotation Context
const rotationCache = new Map<string, { index: number; expiry: number }>();
const ROTATION_TTL = 2 * 60 * 1000; // 2 minutes

// API Health Tracking - Track failed APIs to avoid them temporarily
interface ApiHealth {
  failCount: number;
  lastFailTime: number;
  isBlocked: boolean;
  blockUntil: number;
}

const apiHealthMap = new Map<ApiName, ApiHealth>();
const MAX_FAIL_COUNT = 3; // Block after 3 consecutive failures
const BLOCK_DURATION = 10 * 60 * 1000; // Block for 10 minutes
const HEALTH_RESET_TIME = 30 * 60 * 1000; // Reset health after 30 minutes of no failures

const CATEGORY_KEYWORDS: Record<string, string> = {
  all: 'geopolitics OR military OR markets OR crypto',
  geopolitik: 'Iran OR Israel OR sanctions OR diplomacy OR NATO OR "Middle East"',
  geopolitics: 'Iran OR Israel OR sanctions OR diplomacy OR NATO OR "Middle East"',
  military: 'military OR defense OR army OR navy OR weapons OR missile',
  militer: 'military OR defense OR army OR navy OR weapons OR missile',
  markets: 'markets OR stocks OR finance OR economy OR oil',
  pasar: 'markets OR stocks OR finance OR economy OR oil',
  finance: 'finance OR banking OR "federal reserve" OR economy',
  economy: 'economy OR inflation OR trade OR GDP',
  crypto: 'crypto OR bitcoin OR ethereum OR blockchain',
  'middle east': 'Middle East OR Iran OR Israel OR "Saudi Arabia" OR Gaza',
};

const CATEGORY_LABELS: Record<string, string> = {
  geopolitik: 'Geopolitik',
  geopolitics: 'Geopolitik',
  'middle east': 'Geopolitik',
  military: 'Militer',
  militer: 'Militer',
  markets: 'Pasar',
  pasar: 'Pasar',
  finance: 'Pasar',
  economy: 'Pasar',
  crypto: 'Crypto',
  all: 'Semua',
};

const CATEGORY_API_PRIORITY: Record<string, ApiName[]> = {
  all: ['NewsData', 'WorldNews', 'Finnhub', 'GNews'],
  geopolitik: ['GNews', 'NewsData', 'WorldNews'],
  geopolitics: ['GNews', 'NewsData', 'WorldNews'],
  'middle east': ['GNews', 'NewsData', 'WorldNews'],
  military: ['NewsData', 'GNews', 'WorldNews'],
  militer: ['NewsData', 'GNews', 'WorldNews'],
  markets: ['Finnhub', 'GNews', 'NewsData'],
  pasar: ['Finnhub', 'GNews', 'NewsData'],
  finance: ['Finnhub', 'GNews', 'NewsData'],
  economy: ['Finnhub', 'GNews', 'NewsData'],
  crypto: ['Finnhub', 'GNews'],
};

const GNEWS_CATEGORY_MAP: Record<string, 'world' | 'business'> = {
  geopolitik: 'world',
  geopolitics: 'world',
  'middle east': 'world',
  military: 'world',
  militer: 'world',
  all: 'world',
  markets: 'business',
  pasar: 'business',
  finance: 'business',
  economy: 'business',
  crypto: 'business',
};

// --- Utility Functions for Smart Deduplication ---

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[!?.,:;"'\(\)\-\[\]]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' '); // Normalize multiple spaces
}

function normalizeUrl(url: string | undefined): string {
  if (!url) return '';
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\/$/, '') // Remove trailing slash
    .split('?')[0]; // Remove query params
}

// Enhanced similarity check with multiple methods
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  
  const wordsA = a.split(' ').filter(w => w.length > 3); // Ignore short words
  const wordsB = b.split(' ').filter(w => w.length > 3);
  
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  
  // Dice coefficient - more strict
  const dice = (2.0 * intersection) / (setA.size + setB.size);
  
  // Check for substring match (one title contains the other)
  if (a.includes(b) || b.includes(a)) {
    return Math.max(dice, 0.85);
  }
  
  return dice;
}

// Check if two articles have the same image
function hasSameImage(img1: string | undefined, img2: string | undefined): boolean {
  if (!img1 || !img2) return false;
  
  // Normalize URLs for comparison
  const norm1 = normalizeUrl(img1);
  const norm2 = normalizeUrl(img2);
  
  if (norm1 === norm2) return true;
  
  // Check if they're from the same image host with similar paths
  const path1 = norm1.split('/').slice(-2).join('/');
  const path2 = norm2.split('/').slice(-2).join('/');
  
  return path1 === path2 && path1.length > 10;
}

// Source priority weight (Lower is better/higher)
const SOURCE_PRIORITY: Record<string, number> = {
  'Lazarus Report': 0,
  'GNews': 1,
  'NewsData': 2,
  'Finnhub': 3,
  'WorldNews': 4,
};

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const uniqueArticles = new Map<string, NewsArticle>();
  const seenTitles = new Map<string, string>(); // normalized title -> key
  const seenImages = new Map<string, string>(); // normalized image -> key

  for (const article of articles) {
    const normUrl = normalizeUrl(article.url);
    const normTitle = normalizeString(article.title);
    const normImage = normalizeUrl(article.image);
    
    let isDuplicate = false;
    let duplicateKey = '';

    // 1. STRICT: Exact URL match
    if (normUrl && uniqueArticles.has(normUrl)) {
      isDuplicate = true;
      duplicateKey = normUrl;
    }
    // 2. STRICT: Exact title match
    else if (seenTitles.has(normTitle)) {
      isDuplicate = true;
      duplicateKey = seenTitles.get(normTitle)!;
    }
    // 3. STRICT: Same image URL (likely same article)
    else if (normImage && normImage.length > 20 && seenImages.has(normImage)) {
      isDuplicate = true;
      duplicateKey = seenImages.get(normImage)!;
    }
    // 4. SMART: High similarity in title (>70%)
    else {
      for (const [existingNormTitle, existingKey] of seenTitles.entries()) {
        const similarity = calculateSimilarity(normTitle, existingNormTitle);
        
        if (similarity > 0.70) {
          isDuplicate = true;
          duplicateKey = existingKey;
          break;
        }
      }
    }
    
    // 5. EXTRA CHECK: Same image with different titles (common in news aggregators)
    if (!isDuplicate && normImage && normImage.length > 20) {
      for (const [key, existing] of uniqueArticles.entries()) {
        if (hasSameImage(article.image, existing.image)) {
          // If images are the same, check if titles are somewhat related
          const titleSim = calculateSimilarity(normTitle, normalizeString(existing.title));
          if (titleSim > 0.50) {
            isDuplicate = true;
            duplicateKey = key;
            break;
          }
        }
      }
    }

    if (isDuplicate && duplicateKey) {
      const existing = uniqueArticles.get(duplicateKey);
      if (existing) {
        // CONFLICT RESOLUTION: Keep the better article
        const priorityNew = SOURCE_PRIORITY[article.source] ?? 10;
        const priorityExisting = SOURCE_PRIORITY[existing.source] ?? 10;

        // A. Higher priority source wins
        if (priorityNew < priorityExisting) {
          uniqueArticles.delete(duplicateKey);
          uniqueArticles.set(normUrl || normTitle, article);
          seenTitles.set(normTitle, normUrl || normTitle);
          if (normImage) seenImages.set(normImage, normUrl || normTitle);
          continue;
        }
        
        // B. Same priority: longer excerpt wins
        if (priorityNew === priorityExisting) {
          if ((article.excerpt?.length || 0) > (existing.excerpt?.length || 0) + 20) {
            uniqueArticles.delete(duplicateKey);
            uniqueArticles.set(normUrl || normTitle, article);
            seenTitles.set(normTitle, normUrl || normTitle);
            if (normImage) seenImages.set(normImage, normUrl || normTitle);
            continue;
          }
        }
        // Keep existing if new doesn't win
      }
    } else {
      // New unique article
      const key = normUrl || normTitle;
      uniqueArticles.set(key, article);
      seenTitles.set(normTitle, key);
      if (normImage) seenImages.set(normImage, key);
    }
  }

  return Array.from(uniqueArticles.values());
}

// --- API Logic ---

function normalizeCategory(rawCategory: string | null): string {
  const value = (rawCategory || 'all').trim().toLowerCase();
  if (!value || value === 'semua') return 'all';
  if (value === 'geopolitik') return 'geopolitik';
  if (value === 'militer') return 'militer';
  if (value === 'pasar') return 'pasar';
  return value;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || 'Geopolitik';
}

function getSearchKeyword(category: string, query: string): string {
  return query.trim() || CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.all;
}

function rotateApi(category: string, providers: ApiName[]): ApiName {
  const now = Date.now();
  const cached = rotationCache.get(category);
  const currentIndex = cached && cached.expiry > now ? cached.index : -1;
  const nextIndex = (currentIndex + 1) % providers.length;

  rotationCache.set(category, {
    index: nextIndex,
    expiry: now + ROTATION_TTL,
  });

  return (providers[nextIndex] as ApiName);
}

// API Health Management Functions
function markApiFailure(apiName: ApiName): void {
  const now = Date.now();
  const health = apiHealthMap.get(apiName) || {
    failCount: 0,
    lastFailTime: 0,
    isBlocked: false,
    blockUntil: 0,
  };

  health.failCount++;
  health.lastFailTime = now;

  // Block API if it exceeds max failures
  if (health.failCount >= MAX_FAIL_COUNT) {
    health.isBlocked = true;
    health.blockUntil = now + BLOCK_DURATION;
    console.warn(`[API Health] ${apiName} blocked until ${new Date(health.blockUntil).toISOString()}`);
  }

  apiHealthMap.set(apiName, health);
}

function markApiSuccess(apiName: ApiName): void {
  const health = apiHealthMap.get(apiName);
  if (health) {
    // Reset failure count on success
    health.failCount = 0;
    health.isBlocked = false;
    health.blockUntil = 0;
    apiHealthMap.set(apiName, health);
  }
}

function isApiHealthy(apiName: ApiName): boolean {
  const health = apiHealthMap.get(apiName);
  if (!health) return true; // No history = healthy

  const now = Date.now();

  // Reset health if enough time has passed since last failure
  if (health.lastFailTime > 0 && now - health.lastFailTime > HEALTH_RESET_TIME) {
    health.failCount = 0;
    health.isBlocked = false;
    health.blockUntil = 0;
    apiHealthMap.set(apiName, health);
    return true;
  }

  // Check if block period has expired
  if (health.isBlocked && now >= health.blockUntil) {
    health.isBlocked = false;
    health.failCount = 0;
    apiHealthMap.set(apiName, health);
    return true;
  }

  return !health.isBlocked;
}

function getHealthyProviders(providers: ApiName[]): ApiName[] {
  return providers.filter(isApiHealthy);
}

function getRotatedProviders(category: string): ApiName[] {
  const originalProviders = CATEGORY_API_PRIORITY[category] || CATEGORY_API_PRIORITY.all;
  // Use generic rotation logic, excluding 'Lazarus Report' from external rotation pool
  const allProviders = originalProviders.filter(p => p !== 'Lazarus Report') as ApiName[];
  
  // Filter out unhealthy providers
  const healthyProviders = getHealthyProviders(allProviders);
  
  // If all providers are unhealthy, reset and use all
  const providers = healthyProviders.length > 0 ? healthyProviders : allProviders;
  
  const selected = rotateApi(category, providers);
  const selectedIndex = providers.indexOf(selected);
  
  return [
    ...providers.slice(selectedIndex),
    ...providers.slice(0, selectedIndex),
  ];
}

function getApiToUse(category: string, query: string, lang: string, provider?: ApiName): ApiSelection {
  const providerName = provider || getRotatedProviders(category)[0];
  const searchQuery = getSearchKeyword(category, query);
  // Force language to English for API calls to prevent local non-global media (like local Indonesian news) from polluting the global feed.
  const apiLanguage = 'en';

  switch (providerName) {
    case 'NewsData':
      return {
        name: 'NewsData',
        baseUrl: 'https://newsdata.io/api/1/latest',
        key: import.meta.env.NEWSDATA_API_KEY || '',
        params: {
          q: searchQuery,
          language: apiLanguage,
          size: 15,
          removeduplicate: 1,
        },
      };
    case 'WorldNews':
      return {
        name: 'WorldNews',
        baseUrl: 'https://api.worldnewsapi.com/search-news',
        key: import.meta.env.WORLDNEWS_API_KEY || '',
        params: {
          text: searchQuery,
          language: apiLanguage,
          number: 15,
          sort: 'publish-time',
          'sort-direction': 'DESC',
        },
      };
    case 'Finnhub':
      return {
        name: 'Finnhub',
        baseUrl: 'https://finnhub.io/api/v1/news',
        key: import.meta.env.FINNHUB_API_KEY || '',
        params: {
          category: category === 'crypto' ? 'crypto' : 'general',
        },
      };
    case 'GNews':
    default:
      return {
        name: 'GNews',
        baseUrl: 'https://gnews.io/api/v4/search',
        key: import.meta.env.GNEWS_API_KEY || '',
        params: {
          q: searchQuery,
          lang: apiLanguage,
          max: 15,
          category: GNEWS_CATEGORY_MAP[category] || 'world',
        },
      };
  }
}

function buildApiUrl(selection: ApiSelection): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(selection.params)) {
    searchParams.set(key, String(value));
  }

  // Handle specific key naming per provider
  const keyMap: Record<string, string> = {
    'NewsData': 'apikey',
    'WorldNews': 'api-key',
    'Finnhub': 'token',
    'GNews': 'apikey',
  };

  const keyName = keyMap[selection.name as string];
  if (keyName) searchParams.set(keyName, selection.key);

  return `${selection.baseUrl}?${searchParams.toString()}`;
}

function formatArticleDate(dateStr: string | number | undefined, lang: string): string {
  if (!dateStr) return lang === 'id' ? 'Hari ini' : 'Today';

  const parsed = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr);
  if (Number.isNaN(parsed.getTime())) return lang === 'id' ? 'Hari ini' : 'Today';

  return parsed.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isWithin3Days(dateStr: string | number | undefined) {
  if (!dateStr) return true;
  const articleTime = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr).getTime();
  if (Number.isNaN(articleTime)) return true;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - articleTime <= THREE_DAYS_MS;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=600&h=340&fit=crop', // Map/tactical
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=340&fit=crop', // Political
  'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?w=600&h=340&fit=crop', // Finance/market
];

function getValidImage(imgUrl: string | undefined): string {
  if (!imgUrl) return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  // Filter out ugly Reuters placeholders from APIs
  if (imgUrl.toLowerCase().includes('logo') || imgUrl.toLowerCase().includes('favicon') || imgUrl.includes('reuters.com/resizer')) {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  }
  return imgUrl;
}

async function fetchFromApi(selection: ApiSelection, category: string, lang: string): Promise<NewsArticle[]> {
  if (!selection.key || selection.key.startsWith('your_')) {
    markApiFailure(selection.name);
    return [];
  }

  try {
    const url = buildApiUrl(selection);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    
    // Check for rate limit or API errors
    if (!res.ok) {
      if (res.status === 429 || res.status === 403 || res.status >= 500) {
        console.warn(`[API] ${selection.name} returned ${res.status}, marking as failed`);
        markApiFailure(selection.name);
      }
      return [];
    }

    const data = await res.json();
    const categoryLabel = getCategoryLabel(category);
    const sourceName = selection.name as ApiName;

    let articles: NewsArticle[] = [];

    if (selection.name === 'NewsData' && Array.isArray(data.results)) {
      articles = data.results
        .filter((item: any) => isWithin3Days(item.pubDate))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.description || item.content || '',
          image: getValidImage(item.image_url),
          date: formatArticleDate(item.pubDate, lang),
          source: sourceName,
          publisher: item.source_id || 'NewsData',
          sourceName: String(sourceName),
          url: item.link || '#',
        }));
    }

    if (selection.name === 'WorldNews' && Array.isArray(data.news)) {
      articles = data.news
        .filter((item: any) => isWithin3Days(item.publish_date))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.text?.substring(0, 220) || item.summary || '',
          image: getValidImage(item.image),
          date: formatArticleDate(item.publish_date, lang),
          source: sourceName,
          publisher: 'WorldNews',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    if (selection.name === 'Finnhub' && Array.isArray(data)) {
      articles = data
        .slice(0, 30)
        .filter((item: any) => isWithin3Days(item.datetime))
        .map((item: any) => ({
          title: item.headline || 'Untitled',
          category: category === 'crypto' ? 'Crypto' : getCategoryLabel(category),
          excerpt: item.summary || '',
          image: getValidImage(item.image),
          date: formatArticleDate(item.datetime, lang),
          source: sourceName,
          publisher: item.source || 'Finnhub',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    if (selection.name === 'GNews' && Array.isArray(data.articles)) {
      articles = data.articles
        .filter((item: any) => isWithin3Days(item.publishedAt))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.description || item.content || '',
          image: getValidImage(item.image),
          date: formatArticleDate(item.publishedAt, lang),
          source: sourceName,
          publisher: item.source?.name || 'GNews',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    // Mark success if we got articles
    if (articles.length > 0) {
      markApiSuccess(selection.name);
    } else {
      markApiFailure(selection.name);
    }

    return articles;
  } catch (error) {
    console.error(`[API] ${selection.name} fetch error:`, error);
    markApiFailure(selection.name);
    return [];
  }
}

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    title: 'Intelijen Geopolitik: Pergeseran Tatanan Baru 2026',
    category: 'Geopolitik',
    excerpt: 'Analisis mendalam mengenai pergerakan diplomasi global dan aliansi strategi baru.',
    date: 'Hari ini',
    source: 'Lazarus Report',
    sourceName: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=340&fit=crop',
  },
];

export const GET: APIRoute = async ({ url }) => {
  const category = normalizeCategory(url.searchParams.get('category'));
  const query = url.searchParams.get('q') || '';
  const lang = url.searchParams.get('lang') === 'id' ? 'id' : 'en';

  const cacheKey = `news-${category}-${query}-${lang}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData && Date.now() < cachedData.expiry) {
    return new Response(JSON.stringify({ articles: cachedData.data, cached: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const providers = getRotatedProviders(category);
    let allFetched: NewsArticle[] = [];
    let primaryProviderUsed: ApiName | null = null;
    const failedProviders: ApiName[] = [];
    const attemptedProviders: { name: ApiName; success: boolean; count: number }[] = [];

    // STRATEGY: Try ONE provider at a time, only move to next if it fails
    // This prevents mixing articles from multiple sources
    for (const provider of providers) {
      const selection = getApiToUse(category, query, lang, provider);
      
      console.log(`[API] Attempting ${provider}...`);
      const result = await fetchFromApi(selection, category, lang);
      
      attemptedProviders.push({
        name: provider,
        success: result.length > 0,
        count: result.length,
      });

      if (result.length > 0) {
        // SUCCESS: Use ONLY this provider's results
        allFetched = result;
        primaryProviderUsed = provider;
        console.log(`[API] Success with ${provider}, got ${result.length} articles`);
        break; // STOP here, don't try other providers
      } else {
        failedProviders.push(provider);
        console.warn(`[API] ${provider} failed or returned no results`);
      }
    }

    // If still no results after trying all healthy providers, try unhealthy ones as last resort
    if (allFetched.length === 0) {
      console.warn('[API] All healthy providers failed, trying blocked providers...');
      const allProviders = (CATEGORY_API_PRIORITY[category] || CATEGORY_API_PRIORITY.all)
        .filter(p => p !== 'Lazarus Report') as ApiName[];
      
      for (const provider of allProviders) {
        if (providers.includes(provider)) continue; // Already tried
        
        const selection = getApiToUse(category, query, lang, provider);
        const result = await fetchFromApi(selection, category, lang);
        
        if (result.length > 0) {
          allFetched = result;
          primaryProviderUsed = provider;
          console.log(`[API] Fallback success with ${provider}`);
          break;
        }
      }
    }

    if (allFetched.length === 0) {
      console.warn('[API] All providers exhausted, using fallback articles');
      allFetched = FALLBACK_ARTICLES;
    }

    // AGGRESSIVE DEDUPLICATION
    const uniqueArticles = deduplicateArticles(allFetched);
    
    console.log(`[API] Deduplication: ${allFetched.length} -> ${uniqueArticles.length} articles`);
    
    // Save to cache
    cache.set(cacheKey, {
      data: uniqueArticles,
      expiry: Date.now() + CACHE_TTL,
    });

    return new Response(JSON.stringify({
      articles: uniqueArticles,
      apiUsed: primaryProviderUsed,
      providerOrder: providers,
      attempted: attemptedProviders,
      failed: failedProviders,
      deduplication: {
        before: allFetched.length,
        after: uniqueArticles.length,
        removed: allFetched.length - uniqueArticles.length,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[API] Critical error:', error);
    return new Response(JSON.stringify({ 
      articles: FALLBACK_ARTICLES,
      error: 'Critical failure, using fallback',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

