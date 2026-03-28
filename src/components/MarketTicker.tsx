import { useState, useEffect, memo } from 'react';
import { subscribeToBinance } from '../utils/binanceWS';

interface TickerData {
  symbol: string;
  displayName: string;
  price: string;
  isPositive: boolean;
  prefix?: string;
}

const INITIAL_DATA: Record<string, TickerData> = {
  BTC: { symbol: 'BTC', displayName: 'BTC', price: '67,234.50', isPositive: true, prefix: '$' },
  ETH: { symbol: 'ETH', displayName: 'ETH', price: '3,456.20', isPositive: true, prefix: '$' },
  GOLD: { symbol: 'GOLD', displayName: 'GOLD', price: '2,345.60', isPositive: true, prefix: '$' },
  SPX: { symbol: 'SPX', displayName: 'S&P 500', price: '5,234.50', isPositive: true, prefix: '' },
  DJI: { symbol: 'DJI', displayName: 'DOW', price: '38,456.20', isPositive: false, prefix: '' },
  IXIC: { symbol: 'IXIC', displayName: 'NASDAQ', price: '16,234.80', isPositive: true, prefix: '' },
};

const MarketTicker = memo(() => {
  const [data, setData] = useState(INITIAL_DATA);
  const [lastPrices, setLastPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let lastUpdate = 0;
    const THROTTLE_MS = 300; // Update setiap 300ms untuk lebih responsif

    // Subscribe to Binance WebSocket for crypto + GOLD (REALTIME via WebSocket)
    const unsubscribeBinance = subscribeToBinance(({ symbol, price, change }) => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_MS) return;
      lastUpdate = now;

      setData(prev => ({
        ...prev,
        [symbol]: {
          ...prev[symbol],
          displayName: symbol === 'GOLD' ? 'GOLD' : symbol,
          price: price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }),
          isPositive: change >= 0,
          prefix: '$'
        }
      }));

      // Track price for comparison
      setLastPrices(prev => ({ ...prev, [symbol]: price }));
    });

    // Fetch Indices data - REALTIME dengan polling agresif (2 detik)
    const fetchIndicesData = async () => {
      try {
        // Yahoo Finance API - gratis, no key needed
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=^GSPC,^DJI,^IXIC`, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        if (!response.ok) throw new Error('API Error');
        
        const result = await response.json();
        
        if (result.quoteResponse?.result) {
          const quotes = result.quoteResponse.result;
          const updates: Partial<Record<string, TickerData>> = {};

          quotes.forEach((quote: any) => {
            let key = '';
            let displayName = '';
            
            if (quote.symbol === '^GSPC') {
              key = 'SPX';
              displayName = 'S&P 500';
            } else if (quote.symbol === '^DJI') {
              key = 'DJI';
              displayName = 'DOW';
            } else if (quote.symbol === '^IXIC') {
              key = 'IXIC';
              displayName = 'NASDAQ';
            }

            if (key && quote.regularMarketPrice) {
              const currentPrice = quote.regularMarketPrice;
              const lastPrice = lastPrices[key];
              
              // Determine if price went up or down
              let isPositive = true;
              if (lastPrice !== undefined) {
                isPositive = currentPrice >= lastPrice;
              } else if (quote.regularMarketChange) {
                isPositive = quote.regularMarketChange >= 0;
              }
              
              updates[key] = {
                symbol: key,
                displayName,
                price: currentPrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }),
                isPositive,
                prefix: ''
              };

              // Store current price for next comparison
              setLastPrices(prev => ({ ...prev, [key]: currentPrice }));
            }
          });

          setData(prev => ({ ...prev, ...updates }));
        }
      } catch (error) {
        console.error('[Market Ticker] Failed to fetch indices data:', error);
      }
    };

    // Initial fetch untuk indices
    fetchIndicesData();
    
    // REALTIME: Update setiap 2 detik untuk indices (market hours)
    // Harga akan berubah-ubah sesuai market movement
    const interval = setInterval(fetchIndicesData, 2000);

    return () => {
      unsubscribeBinance();
      clearInterval(interval);
    };
  }, [lastPrices]);

  const items = [data.BTC, data.ETH, data.GOLD, data.SPX, data.DJI, data.IXIC];
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
