import { useState, useEffect, memo, useRef } from 'react';

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

const TickerItem = memo(({ item, loopIdx, idx }: { item: TickerData, loopIdx: number, idx: number }) => {
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(item.price);

  useEffect(() => {
    if (prevPriceRef.current !== item.price && item.price !== '—') {
      const p1 = parseFloat(prevPriceRef.current.replace(/,/g, ''));
      const p2 = parseFloat(item.price.replace(/,/g, ''));
      if (!isNaN(p1) && !isNaN(p2) && p1 !== p2) {
        setPulse(p2 > p1 ? 'up' : 'down');
        const timer = setTimeout(() => setPulse(null), 1000);
        prevPriceRef.current = item.price;
        return () => clearTimeout(timer);
      }
    }
    prevPriceRef.current = item.price;
  }, [item.price]);

  return (
    <a 
      href={`/market-signals?symbol=${item.pair}`}
      className="flex items-center gap-2 hover:bg-white/5 px-2 py-0.5 rounded transition-all duration-300 cursor-pointer group"
      title={`View ${item.displayName} chart`}
    >
      <span className="text-gray-100 font-bold uppercase group-hover:text-lazarus-gold transition-colors">{item.displayName}</span>
      <span className={`font-mono font-bold transition-all duration-500 transform ${
        pulse === 'up' ? 'text-green-400 scale-110 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 
        pulse === 'down' ? 'text-red-400 scale-110 shadow-[0_0_8px_rgba(248,113,113,0.3)]' : 
        'text-gray-300'
      }`}>
        {item.prefix}{item.price}
      </span>
      {item.isPositive ? <SparklineUp /> : <SparklineDown />}
      <span className={`flex items-center font-bold ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {item.isPositive ? '▲' : '▼'} {Math.abs(item.change24h).toFixed(2)}%
      </span>
    </a>
  );
});

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
        // Silent error
      }
    }

    fetchData();
    intervalId = setInterval(fetchData, 2500); // Polling every 2.5s for real-time vibe
    return () => clearInterval(intervalId);
  }, []);

  const items = MARKET_ITEMS.map(i => data.items[i.id]);
  const sentiment = data.sentiment;

  return (
    <div className="bg-[#0f0f0f] border-b border-white/5 py-[6px] overflow-hidden select-none flex items-center">
      {/* FIXED Sentiment Section */}
      {sentiment && (
        <div className="flex items-center gap-2 px-4 border-r border-white/10 shrink-0 bg-[#0f0f0f] z-10 shadow-[8px_0_12px_rgba(15,15,15,0.8)]">
          <div className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </div>
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
          {[1, 2].map((loopIdx) => (
            <div key={`loop-${loopIdx}`} className="flex items-center gap-10">
              {items.map((item, idx) => (
                <TickerItem key={`${item.symbol}-${loopIdx}-${idx}`} item={item} loopIdx={loopIdx} idx={idx} />
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


