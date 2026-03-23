import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTranslation } from '../utils/i18n';

interface NewsItem {
  title: string;
  category: string;
  excerpt: string;
  image?: string;
  date: string;
  source: string;
  url: string;
  isBreaking?: boolean;
}

interface NewsFeedProps {
  initialCategory?: string;
  lang?: string;
}

// Skeleton card component
function SkeletonCard() {
  return (
    <div className="bg-lazarus-dark border border-lazarus-border/30 rounded-none overflow-hidden animate-pulse">
      <div className="aspect-video bg-lazarus-black/40"></div>
      <div className="p-6 space-y-4">
        <div className="h-3 bg-lazarus-black/40 rounded-sm w-24"></div>
        <div className="h-5 bg-lazarus-black/40 rounded-sm w-full"></div>
        <div className="h-5 bg-lazarus-black/40 rounded-sm w-5/6"></div>
        <div className="h-3 bg-lazarus-black/40 rounded-sm w-32 mt-4"></div>
      </div>
    </div>
  );
}

// News card component
function NewsCard({ item, t }: { item: NewsItem; t: any }) {
  return (
    <article className="group bg-lazarus-dark border border-lazarus-border/30 rounded-none overflow-hidden hover:bg-lazarus-dark/80 transition-all duration-300">
      {item.image && (
        <div className="relative overflow-hidden aspect-video border-b border-lazarus-border/20">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {item.isBreaking && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-lazarus-alert text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-md">
              Breaking
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 border-b border-lazarus-border/30 pb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-lazarus-black bg-lazarus-gold px-2 py-0.5 rounded-sm">
            {item.category}
          </span>
          <span className="text-lazarus-muted/80 text-[10px] font-mono uppercase bg-lazarus-black/50 px-2 py-0.5 rounded-sm border border-lazarus-border/50 flex items-center gap-1.5 shadow-inner leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.6)] animate-pulse"></span>
            {t.sections.source} <span className="text-gray-200 font-semibold">{item.source || 'GLOBAL'}</span>
          </span>
        </div>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
          <h3 className="font-serif text-lazarus-headline text-lg font-medium leading-[1.3] mb-3 group-hover:text-lazarus-gold transition-colors duration-200 line-clamp-3" dir="auto">
            {item.title}
          </h3>
        </a>
        {item.excerpt && (
          <p className="text-lazarus-muted text-sm leading-relaxed mb-3 line-clamp-2">
            {item.excerpt}
          </p>
        )}
        <time className="text-lazarus-muted/50 text-xs">{item.date}</time>
      </div>
    </article>
  );
}

// Fallback / demo data
const FALLBACK_NEWS: NewsItem[] = [
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
    source: 'Finnhub',
    url: '#',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=340&fit=crop',
  },
  {
    title: 'Bitcoin Breaks $70,000 Barrier as Institutional Adoption Accelerates',
    category: 'Crypto',
    excerpt: 'Major financial institutions increase Bitcoin holdings as the cryptocurrency hits all-time highs.',
    date: 'March 19, 2026',
    source: 'Binance',
    url: '#',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=340&fit=crop',
  },
  {
    title: 'China Expands Military Presence in South China Sea',
    category: 'Military',
    excerpt: 'Satellite imagery reveals new construction on disputed islands, raising concerns among ASEAN nations.',
    date: 'March 18, 2026',
    source: 'WorldNews',
    url: '#',
    image: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=600&h=340&fit=crop',
  },
  {
    title: 'OPEC+ Emergency Meeting Called Over Supply Concerns',
    category: 'Oil & Energy',
    excerpt: 'Saudi Arabia leads push for production cuts amid geopolitical instability in major oil producing regions.',
    date: 'March 18, 2026',
    source: 'NewsData',
    url: '#',
    image: 'https://images.unsplash.com/photo-1474314005122-3c07c4df1224?w=600&h=340&fit=crop',
  },
];

export default function NewsFeed({ initialCategory = 'All', lang = 'en' }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  
  const t = useMemo(() => getTranslation(lang), [lang]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category.toLowerCase());
      if (query) params.set('q', query);
      params.set('sort', sort);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setNews(data.articles);
        } else {
          setNews(FALLBACK_NEWS);
        }
      } else {
        setNews(FALLBACK_NEWS);
      }
    } catch {
      setNews(FALLBACK_NEWS);
    } finally {
      setLoading(false);
    }
  }, [category, query, sort]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Listen for filter changes from NewsFilter component
  useEffect(() => {
    const handler = (e: CustomEvent<{ category: string; query: string; sort: string }>) => {
      setCategory(e.detail.category);
      setQuery(e.detail.query);
      setSort(e.detail.sort);
    };
    window.addEventListener('filter-change', handler as EventListener);
    return () => window.removeEventListener('filter-change', handler as EventListener);
  }, []);

  return (
    <div>
      {/* Filter Bar */}
      <NewsFilterBar
        category={category}
        query={query}
        sort={sort}
        lang={lang}
        onCategoryChange={(c) => { setCategory(c); }}
        onQueryChange={(q) => { setQuery(q); }}
        onSortChange={(s) => { setSort(s); }}
      />

      {/* News Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : news.map((item, i) => <NewsCard key={i} item={item} t={t} />)
        }
      </div>

      {!loading && news.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lazarus-muted text-lg">{t.sections.noArticles}</p>
          <p className="text-lazarus-muted/60 text-sm mt-1">{t.sections.adjustFilters}</p>
        </div>
      )}
    </div>
  );
}

// Integrated filter bar
const CATEGORIES = [
  'All', 'Geopolitics', 'Military', 'Markets', 'Finance',
  'Crypto', 'Oil & Energy', 'Middle East', 'Breaking'
];

function NewsFilterBar({
  category, query, sort, lang,
  onCategoryChange, onQueryChange, onSortChange,
}: {
  category: string; query: string; sort: string; lang: string;
  onCategoryChange: (c: string) => void;
  onQueryChange: (q: string) => void;
  onSortChange: (s: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useMemo(() => getTranslation(lang), [lang]);

  // Translate categories
  const mappedCategories = CATEGORIES.map(cat => {
    const lower = cat.toLowerCase().replace(' ', '') as any;
    if (lower === 'all') return { val: cat, label: t.categories.all };
    if (lower === 'oil&energy') return { val: cat, label: t.categories.oilEnergy };
    if (lower === 'middleeast') return { val: cat, label: t.categories.middleEast };
    return { val: cat, label: (t.categories as any)[lower] || cat };
  });

  return (
    <div className="mb-6">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-lazarus-dark border border-lazarus-border rounded-lg mb-3"
        style={{ minHeight: '44px' }}
      >
        <span className="text-lazarus-body text-sm font-medium">
          {t.sections.filter}: <span className="text-lazarus-gold">{mappedCategories.find(c => c.val === category)?.label || category}</span>
        </span>
        <svg className={`w-5 h-5 text-lazarus-gold transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-1.5 pb-2 md:pb-0 min-w-max">
              {mappedCategories.map((catInfo) => (
                <button
                  key={catInfo.val}
                  onClick={() => onCategoryChange(catInfo.val)}
                  className={`px-3 py-2 text-xs font-semibold tracking-wider uppercase rounded-lg whitespace-nowrap transition-all ${
                    category === catInfo.val
                      ? 'bg-lazarus-gold text-lazarus-black'
                      : 'text-lazarus-muted hover:text-lazarus-gold hover:bg-lazarus-gold/10 border border-lazarus-border'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {catInfo.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lazarus-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t.sections.searchPlaceholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-lazarus-dark border border-lazarus-border rounded-lg text-sm text-lazarus-body placeholder-lazarus-muted focus:outline-none focus:border-lazarus-gold transition-colors w-full md:w-40"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2.5 bg-lazarus-dark border border-lazarus-border rounded-lg text-sm text-lazarus-body focus:outline-none focus:border-lazarus-gold appearance-none cursor-pointer"
              style={{ minHeight: '44px' }}
            >
             
             
              <option value="latest">{t.sections.sortLatest}</option>
              <option value="relevance">{t.sections.sortRelevance}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );


}
