import { useState, useEffect } from 'react';
import { getTranslation } from '../utils/i18n';

interface NewsItem {
  title: string;
  category: string;
  excerpt?: string;
  image?: string;
  date: string;
  source: string;
  publisher?: string;
  url: string;
  isBreaking?: boolean;
}

interface HeroNewsCardsProps {
  lang?: string;
}

export default function HeroNewsCards({ lang = 'en' }: HeroNewsCardsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = getTranslation(lang);

  useEffect(() => {
    const fetchHeroNews = async () => {
      try {
        const res = await fetch(`/api/news?limit=4&lang=${lang}`);
        if (res.ok) {
          const data = await res.json();
          if (data.articles && data.articles.length > 0) {
            setNews(data.articles.slice(0, 4));
          } else {
            // Fallback to static news
            setNews(getFallbackNews(lang));
          }
        } else {
          setNews(getFallbackNews(lang));
        }
      } catch {
        setNews(getFallbackNews(lang));
      } finally {
        setLoading(false);
      }
    };

    fetchHeroNews();
  }, [lang]);

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} ${lang === 'id' ? 'menit lalu' : 'min ago'}`;
      }
      if (diffHours < 24) {
        return `${diffHours} ${t.hero.timeAgo}`;
      }
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${lang === 'id' ? 'hari lalu' : 'days ago'}`;
    } catch {
      return '2 ' + t.hero.timeAgo;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-12 animate-fade-in border-t border-lazarus-border/40">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`p-5 animate-pulse ${
              i === 0 ? 'lg:pl-0 lg:pr-6 border-b sm:border-b-0 sm:border-r border-lazarus-border/30' :
              i === 1 ? 'lg:px-6 border-b sm:border-b-0 lg:border-r border-lazarus-border/30' :
              i === 2 ? 'lg:px-6 border-b sm:border-b-0 sm:border-r border-lazarus-border/30' :
              'lg:pl-6 lg:pr-0'
            }`}
          >
            <div className="h-3 bg-lazarus-border/20 rounded w-20 mb-3"></div>
            <div className="h-5 bg-lazarus-border/20 rounded w-full mb-2"></div>
            <div className="h-5 bg-lazarus-border/20 rounded w-4/5 mb-4"></div>
            <div className="h-2 bg-lazarus-border/20 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-12 animate-fade-in border-t border-lazarus-border/40">
      {news.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`group block p-5 hover:bg-lazarus-dark/30 transition-colors ${
            index === 0 ? 'lg:pl-0 lg:pr-6 border-b sm:border-b-0 sm:border-r border-lazarus-border/30' :
            index === 1 ? 'lg:px-6 border-b sm:border-b-0 lg:border-r border-lazarus-border/30' :
            index === 2 ? 'lg:px-6 border-b sm:border-b-0 sm:border-r border-lazarus-border/30' :
            'lg:pl-6 lg:pr-0'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-[0.15em] uppercase block mb-3 ${
              item.isBreaking || item.category.toLowerCase() === 'breaking'
                ? 'text-lazarus-alert'
                : 'text-lazarus-gold'
            }`}
          >
            {item.category}
          </span>
          <h3 className="font-serif text-lazarus-headline text-lg font-medium leading-[1.3] group-hover:text-lazarus-gold transition-colors line-clamp-3">
            {item.title}
          </h3>
          <span className="text-lazarus-muted text-[10px] font-mono uppercase mt-4 block">
            {getTimeAgo(item.date)}
          </span>
        </a>
      ))}
    </div>
  );
}

function getFallbackNews(lang: string): NewsItem[] {
  const t = getTranslation(lang);
  return t.hero.cards.map((card, i) => ({
    title: card.title,
    category: card.category,
    excerpt: '',
    date: new Date(Date.now() - parseInt(card.time) * 60 * 60 * 1000).toISOString(),
    source: 'Lazarus Report',
    url: '#',
    isBreaking: card.category.toLowerCase().includes('breaking')
  }));
}
