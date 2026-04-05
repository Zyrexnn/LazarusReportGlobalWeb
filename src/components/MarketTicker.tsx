import { useState, useEffect, memo } from 'react';

interface TickerData {
  symbol: string;
  displayName: string;
  price: string;
  change24h: number;
  isPositive: boolean;
  prefix?: string;
  pair: string; // Used for links
}

interface SentimentData {
  value: number;
  label: string;
}

const MARKET_ITEMS = [
  { id: 'BTC', label: 'BTC', pair: 'BTCUSDT' },
  { id: 'ETH', label: 'ETH', pair: 'ETHUSDT' },
  { id: 'GOLD', label: 'GOLD', pair: 'PAXGUSDT' }, // Proxy for gold
  { id: 'BNB', label: 'BNB', pair: 'BNBUSDT' },
  { id: 'SOL', label: 'SOL', pair: 'SOLUSDT' },
  { id: 'XRP', label: 'XRP', pair: 'XRPUSDT' },
  { id: 'ADA', label: 'ADA', pair: 'ADAUSDT' },
  { id: 'DOGE', label: 'DOGE', pair: 'DOGEUSDT' },
  { id: 'DOT', label: 'DOT', pair: 'DOTUSDT' },
  { id: 'AVAX', label: 'AVAX', pair: 'AVAXUSDT' },
];

const INITIAL_ITEMS: Record<string, TickerData> = {};
MARKET_ITEMS.forEach(item => {
  INITIAL_ITEMS[item.id] = { symbol: item.id, displayName: item.label, pair: item.pair, price: '—', change24h: 0, isPositive: true, prefix: '$' };
});

const SparklineUp = () => (
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="mx-1 shrink-0">
    <path d="M1 9.5L6 4L11 7L17 2.5L23 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparklineDown = () => (
  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="mx-1 shrink-0">
    <path d="M1 2.5L6 7L11 4.5L17 9.5L23 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MarketTicker = memo(() => {
  const [data, setData] = useState<{ items: Record<string, TickerData>, sentiment: SentimentData | null }>({
    items: INITIAL_ITEMS,
    sentiment: null
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function fetchData() {
      if (typeof window === 'undefined') return;
      
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) return;
        const result = await res.json();
        
        setData(prev => {
          const nextItems = { ...prev.items };
          
          if (result && result.crypto && Array.isArray(result.crypto)) {
            MARKET_ITEMS.forEach(item => {
              const ticker = result.crypto.find((c: any) => c.symbol === item.pair);
              if (ticker) {
                const currentPrice = ticker.price;
                const prevItem = prev.items[item.id];
                const change24h = ticker.change24h || 0;
                const isPositive = change24h >= 0;

                nextItems[item.id] = {
                  ...prevItem,
                  price: currentPrice >= 1000 
                    ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : currentPrice.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
                  change24h,
                  isPositive,
                };
              }
            });
          }

          return { 
            items: nextItems, 
            sentiment: result?.sentiment ? result.sentiment : prev.sentiment 
          };
        });
      } catch (error) {
        console.error('[Market Ticker] Failed to fetch data:', error);
      }
    }

    fetchData();
    intervalId = setInterval(fetchData, 4000); // Polling every 4s to stay ultra light
    return () => clearInterval(intervalId);
  }, []);

  const items = MARKET_ITEMS.map(i => data.items[i.id]);
  const displayItems = [...items, ...items, ...items]; // Marquee loop
  
  const sentiment = data.sentiment;

  return (
    <div className="bg-[#0f0f0f] border-b border-white/5 py-[6px] overflow-hidden select-none flex items-center">
      {/* FIXED Sentiment Section - Does not move */}
      {sentiment && (
        <div className="flex items-center gap-2 px-4 border-r border-white/10 shrink-0 bg-[#0f0f0f] z-10 shadow-[8px_0_12px_rgba(15,15,15,0.8)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={sentiment.value > 50 ? 'text-emerald-500' : 'text-red-500'}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className={`font-bold text-[12px] ${sentiment.value > 50 ? 'text-emerald-500' : 'text-red-500'}`}>
            {sentiment.value}
          </span>
          <span className="text-lazarus-muted text-[10px] uppercase font-bold tracking-tighter whitespace-nowrap">
            {sentiment.label}
          </span>
        </div>
      )}

      {/* SCROLLING Ticker Items */}
      <div className="ticker-wrapper flex-1 relative overflow-hidden flex items-center text-[11px] font-mono font-medium tracking-wide">
        <div className="animate-ticker flex items-center gap-10 whitespace-nowrap pr-10">
          
          {/* Seamless 2-Loop synchronization with -50% translateX animation */}
          {[1, 2].map((loopIdx) => (
            <div key={`loop-${loopIdx}`} className="flex items-center gap-10">
              {items.map((item, idx) => (
                <a 
                  key={`${item.symbol}-${loopIdx}-${idx}`} 
                  href={`/market-signals?symbol=${item.pair}`}
                  className="flex items-center gap-2 hover:bg-white/5 px-2 py-0.5 rounded transition-all duration-300 cursor-pointer group"
                  title={`View ${item.displayName} chart`}
                >
                  <span className="text-gray-100 font-bold uppercase group-hover:text-lazarus-gold transition-colors">{item.displayName}</span>
                  <span className="text-gray-300 font-mono">
                    {item.prefix}{item.price}
                  </span>
                  {item.isPositive ? <SparklineUp /> : <SparklineDown />}
                  <span className={`flex items-center font-bold ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.isPositive ? '▲' : '▼'} {Math.abs(item.change24h).toFixed(2)}%
                  </span>
                </a>
              ))}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
});

MarketTicker.displayName = 'MarketTicker';

export default MarketTicker;


