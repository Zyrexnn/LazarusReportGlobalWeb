import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { getTranslation } from '../utils/i18n';

interface NewsItem {
  title: string;
  category: string;
  excerpt: string;
  image?: string;
  date: string;
  source: string;
  publisher?: string; // Original source name
  url: string;
  isBreaking?: boolean;
}

interface NewsFeedProps {
  initialCategory?: string;
  lang?: string;
}

// Memoized Skeleton Card
const SkeletonCard = memo(() => {
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
});

SkeletonCard.displayName = 'SkeletonCard';

// Memoized News Card
const NewsCard = memo(({ item, t }: { item: NewsItem; t: ReturnType<typeof getTranslation> }) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=600&h=340&fit=crop';
  
  return (
    <article className="group bg-lazarus-dark border border-lazarus-border/30 rounded-none overflow-hidden hover:bg-lazarus-dark/80 transition-all duration-300">
      <div className="relative overflow-hidden aspect-video border-b border-lazarus-border/20">
        <img
          src={item.image || fallbackImg}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop
            target.src = fallbackImg;
          }}
        />
        {item.isBreaking && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-lazarus-alert text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-md">
            {t.categories.breaking}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 border-b border-lazarus-border/30 pb-2.5 gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-lazarus-black bg-lazarus-gold px-2 py-0.5 rounded-sm">
            {item.category}
          </span>
          {(item.publisher || item.source) && (
            <span className="text-lazarus-muted/70 text-[10px] font-mono uppercase bg-lazarus-black/50 px-2 py-0.5 rounded-sm border border-lazarus-border/50 flex items-center gap-1.5 shadow-inner leading-none whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.6)] animate-pulse"></span>
              <span className="text-lazarus-muted/50">{t.sections.source || 'SRC'}:</span>
              <span className="text-lazarus-headline font-semibold">{item.publisher || item.source}</span>
            </span>
          )}
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
});

NewsCard.displayName = 'NewsCard';

function getFallbackNews(lang: string): NewsItem[] {
  if (lang === 'id') {
    return [
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
        isBreaking: true,
      },
      {
        title: 'Minyak melonjak setelah Hormuz memanas. Pasar kaget lagi.',
        category: 'Pasar',
        excerpt: 'Risiko jalur kirim bikin harga loncat cepat. Kalau kapal terganggu lebih lama, seberapa parah dampaknya?',
        date: '22 Maret 2026',
        source: 'Finnhub',
        url: '#',
        image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=340&fit=crop',
      },
      {
        title: 'Bitcoin tembus level psikologis lagi. Uang besar masuk?',
        category: 'Crypto',
        excerpt: 'Volume naik dan sentimen ikut panas. Rally ini sehat, atau pasar cuma lagi keburu nafsu?',
        date: '22 Maret 2026',
        source: 'Binance',
        url: '#',
        image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=340&fit=crop',
      },
      {
        title: 'Beijing tambah jejak militer di Laut China Selatan. Sinyal biasa? Jelas tidak.',
        category: 'Militer',
        excerpt: 'Foto satelit buka aktivitas baru di pulau sengketa. ASEAN makin tertekan, lalu siapa yang berani dorong balik?',
        date: '21 Maret 2026',
        source: 'WorldNews',
        url: '#',
        image: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=600&h=340&fit=crop',
      },
      {
        title: 'OPEC+ panggil rapat darurat. Pasokan bikin pasar deg-degan.',
        category: 'Pasar',
        excerpt: 'Arab Saudi dorong langkah cepat saat risiko kawasan naik. Kalau produksi dipotong, siapa yang kena duluan?',
        date: '21 Maret 2026',
        source: 'NewsData',
        url: '#',
        image: 'https://images.unsplash.com/photo-1474314005122-3c07c4df1224?w=600&h=340&fit=crop',
      },
    ];
  }

  return [
    {
      title: 'NATO ramps up pressure in Eastern Europe. Will Moscow hold the line?',
      category: 'Geopolitics',
      excerpt: 'Diplomatic traffic is rising fast while room to de-escalate looks thinner. Is this just the opening move?',
      date: 'March 23, 2026',
      source: 'Lazarus Report',
      url: '#',
      image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=340&fit=crop',
    },
    {
      title: 'US carrier group enters the Gulf. The signal to Iran is getting louder.',
      category: 'Military',
      excerpt: 'A major naval move lands as maritime risk climbs. If this is deterrence, why does it look this sharp?',
      date: 'March 23, 2026',
      source: 'Lazarus Report',
      url: '#',
      image: 'https://images.unsplash.com/photo-1580752300992-559f8e0734e0?w=600&h=340&fit=crop',
      isBreaking: true,
    },
    {
      title: 'Oil jumps as Hormuz tension hits shipping nerves again.',
      category: 'Markets',
      excerpt: 'Freight risk is back in focus and traders reacted fast. If vessels slow down, how ugly does this get?',
      date: 'March 22, 2026',
      source: 'Finnhub',
      url: '#',
      image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&h=340&fit=crop',
    },
    {
      title: 'Bitcoin clears another key level. Big money stepping in?',
      category: 'Crypto',
      excerpt: 'Volume is up and sentiment is hot again. Clean breakout or late-cycle rush?',
      date: 'March 22, 2026',
      source: 'Binance',
      url: '#',
      image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=340&fit=crop',
    },
    {
      title: 'China expands its military footprint in the South China Sea. Routine move? Not really.',
      category: 'Military',
      excerpt: 'New satellite images point to fresh activity on disputed ground. ASEAN is watching, but who will push back?',
      date: 'March 21, 2026',
      source: 'WorldNews',
      url: '#',
      image: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=600&h=340&fit=crop',
    },
    {
      title: 'OPEC+ calls an emergency meeting. Supply stress is back on the table.',
      category: 'Markets',
      excerpt: 'Saudi Arabia wants fast action as regional risk builds. If cuts return, who gets hit first?',
      date: 'March 21, 2026',
      source: 'NewsData',
      url: '#',
      image: 'https://images.unsplash.com/photo-1474314005122-3c07c4df1224?w=600&h=340&fit=crop',
    },
  ];
}

const CATEGORIES = [
  'All', 'Geopolitics', 'Military', 'Markets', 'Crypto'
];

export default function NewsFeed({ initialCategory = 'All', lang = 'en' }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState('latest');

  const t = useMemo(() => getTranslation(lang), [lang]);
  const fallbackNews = useMemo(() => getFallbackNews(lang), [lang]);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlQuery = searchParams.get('q');
      if (urlQuery) {
        setQuery(urlQuery);
        setDebouncedQuery(urlQuery);
      }
    }
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category.toLowerCase());
      if (debouncedQuery) params.set('q', debouncedQuery);
      params.set('sort', sort);
      params.set('lang', lang);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setNews(data.articles);
        } else {
          setNews(fallbackNews);
        }
      } else {
        if (!window.sessionStorage.getItem('lazarus_news_error_shown')) {
          window.dispatchEvent(new CustomEvent('lazarus-error', { detail: `[NEWS_FEED_API] HTTP Status ${res.status}` }));
          window.sessionStorage.setItem('lazarus_news_error_shown', 'true');
        }
        setNews(fallbackNews);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'News Feed API fetch failed.';
      if (!window.sessionStorage.getItem('lazarus_news_error_shown')) {
        window.dispatchEvent(new CustomEvent('lazarus-error', { detail: `[NEWS_FEED] ${errorMsg}` }));
        window.sessionStorage.setItem('lazarus_news_error_shown', 'true');
      }
      setNews(fallbackNews);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedQuery, sort, fallbackNews, lang]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

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
      <NewsFilterBar
        category={category}
        query={query}
        sort={sort}
        lang={lang}
        onCategoryChange={setCategory}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : news.map((item, i) => <NewsCard key={i} item={item} t={t} />)}
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

  const mappedCategories = CATEGORIES.map((cat) => {
    if (cat === 'All') return { val: cat, label: t.categories.all };
    if (cat === 'Geopolitics') return { val: cat, label: t.categories.geopolitics };
    if (cat === 'Military') return { val: cat, label: t.categories.military };
    if (cat === 'Markets') return { val: cat, label: t.categories.markets };
    return { val: cat, label: t.categories.crypto };
  });

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-lazarus-dark border border-lazarus-border rounded-lg mb-3"
        style={{ minHeight: '44px' }}
      >
        <span className="text-lazarus-body text-sm font-medium">
          {t.sections.filter}: <span className="text-lazarus-gold">{mappedCategories.find((c) => c.val === category)?.label || category}</span>
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
