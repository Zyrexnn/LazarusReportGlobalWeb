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

// Pure JS Levenshtein Distance
function levenshtein(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) tmp[i] = [i];
  for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
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
  const results: NewsArticle[] = [];

  for (const article of articles) {
    const normUrl = normalizeUrl(article.url);
    const normTitle = normalizeString(article.title);
    
    let isDuplicate = false;
    let duplicateKey = normUrl || normTitle;

    // 1. Precise Check: URL
    if (normUrl && uniqueArticles.has(normUrl)) {
      isDuplicate = true;
      duplicateKey = normUrl;
    } 
    // 2. Precise Check: Title
    else if (uniqueArticles.has(normTitle)) {
      isDuplicate = true;
      duplicateKey = normTitle;
    }
    // 3. Smart Check: Similarity > 80%
    else {
      for (const [key, existing] of uniqueArticles.entries()) {
        const existingNormTitle = normalizeString(existing.title);
        if (calculateSimilarity(normTitle, existingNormTitle) > 0.8) {
          isDuplicate = true;
          duplicateKey = key;
          break;
        }
      }
    }

    if (isDuplicate) {
      const existing = uniqueArticles.get(duplicateKey);
      if (existing) {
        // CONFLICT RESOLUTION:
        // A. Source Priority
        const priorityNew = SOURCE_PRIORITY[article.source] ?? 10;
        const priorityExisting = SOURCE_PRIORITY[existing.source] ?? 10;

        if (priorityNew < priorityExisting) {
          uniqueArticles.set(duplicateKey, article);
          continue;
        } 
        
        if (priorityNew === priorityExisting) {
          // B. Longer description/excerpt
          if ((article.excerpt?.length || 0) > (existing.excerpt?.length || 0) + 10) {
            uniqueArticles.set(duplicateKey, article);
            continue;
          }
          // C. If desc length similar, keep the newer one (though difficult to determine from string dates accurately here)
        }
        // Keep existing if new doesn't beat logic
      }
    } else {
      uniqueArticles.set(normUrl || normTitle, article);
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

function getRotatedProviders(category: string): ApiName[] {
  const originalProviders = CATEGORY_API_PRIORITY[category] || CATEGORY_API_PRIORITY.all;
  // Use generic rotation logic, excluding 'Lazarus Report' from external rotation pool
  const providers = originalProviders.filter(p => p !== 'Lazarus Report') as ApiName[];
  
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
  const normalizedLang = lang === 'id' ? 'id' : 'en';

  switch (providerName) {
    case 'NewsData':
      return {
        name: 'NewsData',
        baseUrl: 'https://newsdata.io/api/1/latest',
        key: import.meta.env.NEWSDATA_API_KEY || '',
        params: {
          q: searchQuery,
          language: normalizedLang,
          size: 15, // Slightly more to help dedup
          removeduplicate: 1, // API-side deduplication
        },
      };
    case 'WorldNews':
      return {
        name: 'WorldNews',
        baseUrl: 'https://api.worldnewsapi.com/search-news',
        key: import.meta.env.WORLDNEWS_API_KEY || '',
        params: {
          text: searchQuery,
          language: normalizedLang,
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
          lang: normalizedLang,
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
async function fetchFromApi(selection: ApiSelection, category: string, lang: string): Promise<NewsArticle[]> {
  if (!selection.key || selection.key.startsWith('your_')) return [];

  try {
    const url = buildApiUrl(selection);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const categoryLabel = getCategoryLabel(category);
    const sourceName = selection.name as ApiName;

    if (selection.name === 'NewsData' && Array.isArray(data.results)) {
      return data.results
        .filter((item: any) => isWithin3Days(item.pubDate))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.description || item.content || '',
          image: item.image_url || undefined,
          date: formatArticleDate(item.pubDate, lang),
          source: sourceName,
          publisher: item.source_id || 'NewsData',
          sourceName: String(sourceName),
          url: item.link || '#',
        }));
    }

    if (selection.name === 'WorldNews' && Array.isArray(data.news)) {
      return data.news
        .filter((item: any) => isWithin3Days(item.publish_date))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.text?.substring(0, 220) || item.summary || '',
          image: item.image || undefined,
          date: formatArticleDate(item.publish_date, lang),
          source: sourceName,
          publisher: 'WorldNews',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    if (selection.name === 'Finnhub' && Array.isArray(data)) {
      return data
        .slice(0, 30)
        .filter((item: any) => isWithin3Days(item.datetime))
        .map((item: any) => ({
          title: item.headline || 'Untitled',
          category: category === 'crypto' ? 'Crypto' : getCategoryLabel(category),
          excerpt: item.summary || '',
          image: item.image || undefined,
          date: formatArticleDate(item.datetime, lang),
          source: sourceName,
          publisher: item.source || 'Finnhub',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    if (selection.name === 'GNews' && Array.isArray(data.articles)) {
      return data.articles
        .filter((item: any) => isWithin3Days(item.publishedAt))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.description || item.content || '',
          image: item.image || undefined,
          date: formatArticleDate(item.publishedAt, lang),
          source: sourceName,
          publisher: item.source?.name || 'GNews',
          sourceName: String(sourceName),
          url: item.url || '#',
        }));
    }

    return [];
  } catch {
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

    // Try primary rotated choice
    const firstSelection = getApiToUse(category, query, lang, providers[0]);
    const firstResult = await fetchFromApi(firstSelection, category, lang);

    if (firstResult.length > 0) {
      allFetched = [...firstResult];
      primaryProviderUsed = providers[0];
    } else {
      // Try next in line if first fails
      for (let i = 1; i < providers.length; i++) {
        const selection = getApiToUse(category, query, lang, providers[i]);
        const result = await fetchFromApi(selection, category, lang);
        if (result.length > 0) {
          allFetched = result;
          primaryProviderUsed = providers[i];
          break;
        }
      }
    }

    if (allFetched.length === 0) {
      allFetched = FALLBACK_ARTICLES;
    }

    const uniqueArticles = deduplicateArticles(allFetched);
    
    // Save to cache
    cache.set(cacheKey, {
      data: uniqueArticles,
      expiry: Date.now() + CACHE_TTL,
    });

    return new Response(JSON.stringify({
      articles: uniqueArticles,
      apiUsed: primaryProviderUsed,
      providerOrder: providers,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response(JSON.stringify({ articles: FALLBACK_ARTICLES }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export { getApiToUse, rotateApi };
