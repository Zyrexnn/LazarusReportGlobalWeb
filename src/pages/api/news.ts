import type { APIRoute } from 'astro';

type ApiName = 'NewsData' | 'WorldNews' | 'Finnhub' | 'GNews';

interface NewsArticle {
  title: string;
  category: string;
  excerpt: string;
  image?: string;
  date: string;
  source: ApiName | 'Lazarus Report';
  url: string;
  isBreaking?: boolean;
}

interface ApiSelection {
  name: ApiName;
  baseUrl: string;
  key: string;
  params: Record<string, string | number>;
}

const cache = new Map<string, { data: NewsArticle[]; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const rotationCache = new Map<string, { index: number; expiry: number }>();
const ROTATION_TTL = 2 * 60 * 1000;

const CATEGORY_KEYWORDS: Record<string, string> = {
  all: 'geopolitics OR military OR markets OR crypto',
  geopolitik: 'Iran OR Israel OR sanctions OR diplomacy OR NATO OR Middle East',
  geopolitics: 'Iran OR Israel OR sanctions OR diplomacy OR NATO OR Middle East',
  military: 'military OR defense OR army OR navy OR weapons OR missile',
  militer: 'military OR defense OR army OR navy OR weapons OR missile',
  markets: 'markets OR stocks OR finance OR economy OR oil',
  pasar: 'markets OR stocks OR finance OR economy OR oil',
  finance: 'finance OR banking OR federal reserve OR economy',
  economy: 'economy OR inflation OR trade OR GDP',
  crypto: 'crypto OR bitcoin OR ethereum OR blockchain',
  'middle east': 'Middle East OR Iran OR Israel OR Saudi Arabia OR Gaza',
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

function getCache(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: NewsArticle[]) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

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

  return providers[nextIndex];
}

function getRotatedProviders(category: string): ApiName[] {
  const providers = CATEGORY_API_PRIORITY[category] || CATEGORY_API_PRIORITY.all;
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
          size: 10,
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
          number: 10,
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
          max: 10,
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

  if (selection.name === 'NewsData') {
    searchParams.set('apikey', selection.key);
  } else if (selection.name === 'WorldNews') {
    searchParams.set('api-key', selection.key);
  } else if (selection.name === 'Finnhub') {
    searchParams.set('token', selection.key);
  } else if (selection.name === 'GNews') {
    searchParams.set('apikey', selection.key);
  }

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

const isWithin3Days = (dateStr: string | number | undefined) => {
  if (!dateStr) return true;
  const articleTime = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr).getTime();
  if (Number.isNaN(articleTime)) return true;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - articleTime <= THREE_DAYS_MS;
};

async function fetchFromApi(selection: ApiSelection, category: string, lang: string): Promise<NewsArticle[]> {
  if (!selection.key || selection.key.startsWith('your_')) return [];

  try {
    const url = buildApiUrl(selection);
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const categoryLabel = getCategoryLabel(category);

    if (selection.name === 'NewsData' && Array.isArray(data.results)) {
      return data.results
        .filter((item: any) => isWithin3Days(item.pubDate))
        .map((item: any) => ({
          title: item.title || 'Untitled',
          category: categoryLabel,
          excerpt: item.description || item.content || '',
          image: item.image_url || undefined,
          date: formatArticleDate(item.pubDate, lang),
          source: 'NewsData',
          url: item.link || '#',
          isBreaking: false,
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
          source: 'WorldNews',
          url: item.url || '#',
          isBreaking: false,
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
          source: 'Finnhub',
          url: item.url || '#',
          isBreaking: false,
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
          source: 'GNews',
          url: item.url || '#',
          isBreaking: false,
        }));
    }

    return [];
  } catch {
    return [];
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[!?.,:;"'-]/g, '').replace(/\s+/g, ' ');
}

function normalizeUrl(url: string): string {
  return url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function getUniqueKey(article: NewsArticle): string {
  if (article.url && article.url !== '#' && article.url.length > 5) {
    return normalizeUrl(article.url);
  }
  return normalizeTitle(article.title);
}

function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const articleMap = new Map<string, NewsArticle>();

  for (const article of articles) {
    const key = getUniqueKey(article);
    const existing = articleMap.get(key);

    if (!existing) {
      articleMap.set(key, article);
      continue;
    }

    const isNewLazarus = article.source === 'Lazarus Report';
    const isExistingLazarus = existing.source === 'Lazarus Report';

    if (isNewLazarus && !isExistingLazarus) {
      articleMap.set(key, article);
      continue;
    }

    if (!isNewLazarus && isExistingLazarus) {
      continue;
    }

    const newLength = article.excerpt?.length || 0;
    const existingLength = existing.excerpt?.length || 0;
    if (newLength > existingLength + 20) {
      articleMap.set(key, article);
    }
  }

  return Array.from(articleMap.values()).slice(0, 100);
}

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    title: 'NATO tambah tekanan di Eropa Timur. Rusia bakal diam saja?',
    category: 'Geopolitik',
    excerpt: 'Gerak diplomasi makin keras. Jalur negosiasi justru terlihat makin sempit. Ini cuma pemanasan?',
    date: '23 Maret 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=340&fit=crop',
  },
  {
    title: 'Kapal induk AS masuk Teluk. Pesan ke Iran makin terang.',
    category: 'Militer',
    excerpt: 'Armada besar bergerak saat risiko maritim naik. Kalau ini deterrence, kenapa momentumnya segini keras?',
    date: '23 Maret 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1580752300992-559f8e0734e0?w=600&h=340&fit=crop',
  },
  {
    title: 'Minyak melonjak setelah Hormuz memanas. Pasar kaget lagi.',
    category: 'Pasar',
    excerpt: 'Risiko jalur kirim bikin harga loncat cepat. Kalau kapal terganggu lebih lama, seberapa parah dampaknya?',
    date: '22 Maret 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=340&fit=crop',
  },
];

export const GET: APIRoute = async ({ url }) => {
  const category = normalizeCategory(url.searchParams.get('category'));
  const query = url.searchParams.get('q') || '';
  const lang = url.searchParams.get('lang') === 'id' ? 'id' : 'en';

  const cacheKey = `news-${category}-${query}-${lang}`;
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return new Response(JSON.stringify({ articles: cachedData, cached: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const providers = getRotatedProviders(category);
    let articles: NewsArticle[] = [];
    let apiUsed: ApiName | null = null;

    for (const provider of providers) {
      const selection = getApiToUse(category, query, lang, provider);
      const result = await fetchFromApi(selection, category, lang);

      if (result.length > 0) {
        articles = result;
        apiUsed = provider;
        break;
      }
    }

    if (articles.length === 0) {
      articles = FALLBACK_ARTICLES;
    }

    const uniqueArticles = dedupeArticles(articles);
    setCache(cacheKey, uniqueArticles);

    return new Response(JSON.stringify({
      articles: uniqueArticles,
      apiUsed,
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
