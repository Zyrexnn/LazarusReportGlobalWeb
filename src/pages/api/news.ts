import type { APIRoute } from 'astro';

interface NewsArticle {
  title: string;
  category: string;
  excerpt: string;
  image?: string;
  date: string;
  source: string;
  url: string;
  isBreaking?: boolean;
}

// Category mapping for API queries
const CATEGORY_KEYWORDS: Record<string, string> = {
  geopolitics: 'geopolitics OR diplomacy OR sanctions OR NATO',
  military: 'military OR defense OR army OR navy OR weapons',
  markets: 'stock market OR finance OR economy OR Wall Street',
  finance: 'finance OR banking OR federal reserve OR interest rates',
  crypto: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
  'oil & energy': 'oil OR energy OR OPEC OR petroleum OR natural gas',
  'middle east': 'Middle East OR Iran OR Saudi Arabia OR Israel',
  'global economy': 'global economy OR GDP OR trade OR IMF',
  breaking: 'breaking news OR urgent OR crisis',
};

const isWithin3Days = (dateStr: string | number) => {
  if (!dateStr) return true;
  const articleTime = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr).getTime();
  if (isNaN(articleTime)) return true;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  return (Date.now() - articleTime) <= THREE_DAYS_MS;
};

async function fetchNewsData(category: string, query: string): Promise<NewsArticle[]> {
  const apiKey = import.meta.env.NEWSDATA_API_KEY;
  if (!apiKey || apiKey === 'your_newsdata_api_key_here') return [];

  try {
    const searchQuery = query || CATEGORY_KEYWORDS[category.toLowerCase()] || 'geopolitics';
    const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(searchQuery)}&language=en&size=50`;

    const res = await fetch(url, { 
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results) return [];

    return data.results
      .filter((item: any) => isWithin3Days(item.pubDate))
      .map((item: any) => ({
      title: item.title || 'Untitled',
      category: category || 'Geopolitics',
      excerpt: item.description || '',
      image: item.image_url || undefined,
      date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today',
      source: item.source_id || 'News',
      url: item.link || '#',
      isBreaking: false,
    }));
  } catch {
    return [];
  }
}

async function fetchWorldNews(category: string, query: string): Promise<NewsArticle[]> {
  const apiKey = import.meta.env.WORLDNEWS_API_KEY;
  if (!apiKey || apiKey === 'your_worldnews_api_key_here') return [];

  try {
    const searchQuery = query || CATEGORY_KEYWORDS[category.toLowerCase()] || 'geopolitics';
    const url = `https://api.worldnewsapi.com/search-news?api-key=${apiKey}&text=${encodeURIComponent(searchQuery)}&language=en&number=50&sort=publish-time&sort-direction=DESC`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.news) return [];

    return data.news
      .filter((item: any) => isWithin3Days(item.publish_date))
      .map((item: any) => ({
      title: item.title || 'Untitled',
      category: category || 'Geopolitics',
      excerpt: item.text?.substring(0, 200) || '',
      image: item.image || undefined,
      date: item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today',
      source: item.author || 'WorldNews',
      url: item.url || '#',
      isBreaking: false,
    }));
  } catch {
    return [];
  }
}

async function fetchFinnhubNews(category: string): Promise<NewsArticle[]> {
  const apiKey = import.meta.env.FINNHUB_API_KEY;
  if (!apiKey || apiKey === 'your_finnhub_api_key_here') return [];

  // Finnhub is mainly for market/finance news
  if (!['markets', 'finance', 'crypto', 'all'].includes(category.toLowerCase())) return [];

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 100)
      .filter((item: any) => isWithin3Days(item.datetime))
      .map((item: any) => ({
      title: item.headline || 'Untitled',
      category: 'Markets',
      excerpt: item.summary || '',
      image: item.image || undefined,
      date: item.datetime ? new Date(item.datetime * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today',
      source: item.source || 'Finnhub',
      url: item.url || '#',
      isBreaking: false,
    }));
  } catch {
    return [];
  }
}

// Fallback articles when no API keys are configured
const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    title: 'NATO Allies Discuss New Defense Strategy Amid Rising Global Tensions',
    category: 'Geopolitics',
    excerpt: 'Senior defense officials from NATO member states convene for emergency talks on reshaping alliance strategy.',
    date: 'March 20, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=340&fit=crop',
  },
  {
    title: 'US Carrier Strike Group Enters Persian Gulf Amid Escalating Maritime Threats',
    category: 'Military',
    excerpt: 'The USS Eisenhower carrier strike group has entered the Strait of Hormuz as part of increased naval presence.',
    date: 'March 20, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1580752300992-559f8e0734e0?w=600&h=340&fit=crop',
  },
  {
    title: 'Oil Prices Spike 5% as Tensions Rise in Key Shipping Lanes',
    category: 'Markets',
    excerpt: 'Brent crude surges past $95 per barrel following reports of naval confrontation near the Strait of Hormuz.',
    date: 'March 19, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=340&fit=crop',
  },
  {
    title: 'Bitcoin Breaks $70,000 Barrier as Institutional Adoption Accelerates',
    category: 'Crypto',
    excerpt: 'Major financial institutions increase Bitcoin holdings as the cryptocurrency hits all-time highs.',
    date: 'March 19, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=340&fit=crop',
  },
  {
    title: 'China Expands Military Presence in South China Sea',
    category: 'Military',
    excerpt: 'Satellite imagery reveals new construction on disputed islands, raising concerns among ASEAN nations.',
    date: 'March 18, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=600&h=340&fit=crop',
  },
  {
    title: 'OPEC+ Emergency Meeting Called Over Supply Concerns',
    category: 'Oil & Energy',
    excerpt: 'Saudi Arabia leads push for production cuts amid geopolitical instability in major oil producing regions.',
    date: 'March 18, 2026',
    source: 'Lazarus Report',
    url: '#',
    image: 'https://images.unsplash.com/photo-1474314005122-3c07c4df1224?w=600&h=340&fit=crop',
  },
];

// --- Deduplication Helpers ---
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[!?.,:;"'-]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

function getUniqueKey(article: NewsArticle): string {
  if (article.url && article.url !== '#' && article.url.length > 5) {
    return normalizeUrl(article.url);
  }
  return normalizeTitle(article.title);
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const category = url.searchParams.get('category') || 'all';
  const query = url.searchParams.get('q') || '';
  const sort = url.searchParams.get('sort') || 'latest';
  const lang = cookies.get('lazarus_lang')?.value || 'en';

  try {
    // Fetch from all sources in parallel
    const [newsData, worldNews, finnhub] = await Promise.allSettled([
      fetchNewsData(category, query),
      fetchWorldNews(category, query),
      fetchFinnhubNews(category),
    ]);

    let articles: NewsArticle[] = [];

    if (newsData.status === 'fulfilled') articles.push(...newsData.value);
    if (worldNews.status === 'fulfilled') articles.push(...worldNews.value);
    if (finnhub.status === 'fulfilled') articles.push(...finnhub.value);

    // If no articles from APIs, use fallback
    if (articles.length === 0) {
      articles = FALLBACK_ARTICLES;
    }

    // Filter by category if not "all"
    if (category.toLowerCase() !== 'all') {
      const filtered = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
      if (filtered.length > 0) {
        articles = filtered;
      }
    }

    // --- Advanced Deduplication ---
    const articleMap = new Map<string, NewsArticle>();

    for (const article of articles) {
      const key = getUniqueKey(article);
      const existing = articleMap.get(key);

      if (!existing) {
        articleMap.set(key, article);
      } else {
        // Collision Resolution
        const isNewLazarus = article.source === 'Lazarus Report';
        const isExistingLazarus = existing.source === 'Lazarus Report';

        if (isNewLazarus && !isExistingLazarus) {
          articleMap.set(key, article); // Lazarus wins
        } else if (!isNewLazarus && isExistingLazarus) {
          // Keep existing Lazarus
        } else {
          // Compare content richness (excerpt length)
          const newLength = article.excerpt?.length || 0;
          const extLength = existing.excerpt?.length || 0;
          
          if (newLength > extLength + 20) {
            articleMap.set(key, article); // Significantly longer content wins
          } else if (newLength >= extLength - 20) {
            // Tie-breaker: Newer date wins
            const newTime = new Date(article.date).getTime();
            const extTime = new Date(existing.date).getTime();
            if (newTime > extTime && !isNaN(newTime)) {
              articleMap.set(key, article);
            }
          }
        }
      }
    }

    // Convert Map back to array
    let uniqueArticles = Array.from(articleMap.values());

    // Sort globally by Date descending
    if (sort === 'latest') {
      uniqueArticles.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
    }

    return new Response(JSON.stringify({ articles: uniqueArticles.slice(0, 100) }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ articles: FALLBACK_ARTICLES }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
};
