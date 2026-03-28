import { useState, useEffect, memo } from 'react';

interface TickerData {
  symbol: string;
  displayName: string;
  price: string;
  isPositive: boolean;
  prefix?: string;
}

const MARKET_ITEMS = [
  { id: 'BTC', label: 'BTC', pair: 'BTCUSDT' },
  { id: 'ETH', label: 'ETH', pair: 'ETHUSDT' },
  { id: 'GOLD', label: 'GOLD', pair: 'PAXGUSDT' },
  { id: 'BNB', label: 'BNB', pair: 'BNBUSDT' },
  { id: 'SOL', label: 'SOL', pair: 'SOLUSDT' },
  { id: 'XRP', label: 'XRP', pair: 'XRPUSDT' },
];

const INITIAL_DATA: Record<string, TickerData> = {};
MARKET_ITEMS.forEach(item => {
  INITIAL_DATA[item.id] = { symbol: item.id, displayName: item.label, price: '—', isPositive: true, prefix: '$' };
});

const MarketTicker = memo(() => {
  const [data, setData] = useState(INITIAL_DATA);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function fetchData() {
      if (typeof window === 'undefined') return;
      
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) return;
        const result = await res.json();
        
        if (result && result.crypto && Array.isArray(result.crypto)) {
          setData(prev => {
            const next = { ...prev };
            
            MARKET_ITEMS.forEach(item => {
              // The API returns 'pair' like 'BTC/USDT' or 'PAXG/USDT'
              // Or we can just match symbol: 'BTCUSDT' or 'PAXGUSDT'
              const ticker = result.crypto.find((c: any) => c.symbol === item.pair);
              if (ticker) {
                const currentPrice = ticker.price;
                const prevItem = prev[item.id];
                const prevPriceNum = prevItem && prevItem.price !== '—' ? parseFloat(prevItem.price.replace(/,/g, '')) : currentPrice;
                const isPositive = currentPrice >= prevPriceNum;

                next[item.id] = {
                  ...prevItem,
                  price: currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                  isPositive: currentPrice === prevPriceNum ? prevItem.isPositive : isPositive,
                };
              }
            });
            return next;
          });
        }
      } catch (error) {
        console.error('[Market Ticker] Failed to fetch data:', error);
        if (!window.sessionStorage.getItem('lazarus_ticker_error_shown')) {
          const detailMsg = error instanceof Error ? error.message : 'Unknown ticker stream error.';
          window.dispatchEvent(new CustomEvent('lazarus-error', { detail: `[MARKET_TICKER] ${detailMsg}` }));
          window.sessionStorage.setItem('lazarus_ticker_error_shown', 'true');
        }
      }
    }

    // Initial fetch
    fetchData();

    // Polling every 2.5 seconds (proxy backend limits Binance API rate while bypassing user ISP block)
    intervalId = setInterval(fetchData, 2500);

    return () => clearInterval(intervalId);
  }, []);

  const items = MARKET_ITEMS.map(i => data[i.id]);
  // Duplicate for seamless marquee effect
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="bg-lazarus-black/90 border-b border-lazarus-border py-1 overflow-hidden">
      <div className="ticker-wrapper flex items-center text-xs font-mono">
        <div className="animate-ticker flex items-center gap-6 whitespace-nowrap pr-6">
          {displayItems.map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2">
              <span className="text-lazarus-gold font-semibold">{item.displayName}</span>
              <span className={item.isPositive ? 'text-green-400' : 'text-red-400'}>
                {item.prefix}{item.price}
              </span>
              <span className={`text-[10px] ${item.isPositive ? 'text-green-400/60' : 'text-red-400/60'}`}>
                {item.isPositive ? '▲' : '▼'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MarketTicker.displayName = 'MarketTicker';

export default MarketTicker;
