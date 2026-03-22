import { useState, useEffect } from 'react';

interface TickerData {
  symbol: string;
  price: string;
  isPositive: boolean;
}

const INITIAL_DATA: Record<string, TickerData> = {
  BTC: { symbol: 'BTC', price: '67,234.50', isPositive: true },
  ETH: { symbol: 'ETH', price: '3,456.20', isPositive: true },
  GOLD: { symbol: 'GOLD', price: '2,178.30', isPositive: true },
  WTI: { symbol: 'WTI', price: '78.45', isPositive: false },
  DOW: { symbol: 'DOW', price: '39,142.50', isPositive: true },
};

export default function MarketTicker() {
  const [data, setData] = useState(INITIAL_DATA);

  useEffect(() => {
    // 1. Live Crypto via Binance WebSocket
    let ws: WebSocket | null = null;
    try {
      const streams = ['btcusdt@ticker', 'ethusdt@ticker'].join('/');
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.data) {
            const { s, c, P } = msg.data;
            const price = parseFloat(c).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const isPos = parseFloat(P) >= 0;
            
            if (s === 'BTCUSDT') {
              setData(prev => ({ ...prev, BTC: { symbol: 'BTC', price, isPositive: isPos } }));
            } else if (s === 'ETHUSDT') {
              setData(prev => ({ ...prev, ETH: { symbol: 'ETH', price, isPositive: isPos } }));
            }
          }
        } catch {}
      };
    } catch {}

    // 2. Simulated Jitter for Commodities/Indices (to avoid API limits while looking professional)
    const interval = setInterval(() => {
      setData(prev => {
        const jitter = (val: string, maxChange: number) => {
          const num = parseFloat(val.replace(/,/g, ''));
          const change = (Math.random() - 0.5) * maxChange;
          return (num + change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        return {
          ...prev,
          GOLD: { ...prev.GOLD, price: jitter(prev.GOLD.price, 0.5), isPositive: Math.random() > 0.4 },
          WTI: { ...prev.WTI, price: jitter(prev.WTI.price, 0.05), isPositive: Math.random() > 0.4 },
          DOW: { ...prev.DOW, price: jitter(prev.DOW.price, 2.0), isPositive: Math.random() > 0.4 },
        };
      });
    }, 2500);

    return () => {
      ws?.close();
      clearInterval(interval);
    };
  }, []);

  const items = [data.BTC, data.ETH, data.GOLD, data.WTI, data.DOW];
  // Duplicate for seamless marquee effect
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="bg-lazarus-black/90 border-b border-lazarus-border py-1 overflow-hidden">
      <div className="ticker-wrapper flex items-center text-xs font-mono">
        <div className="animate-ticker flex items-center gap-6 whitespace-nowrap pr-6">
          {displayItems.map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2">
              <span className="text-lazarus-gold font-semibold">{item.symbol}</span>
              <span className={item.isPositive ? 'text-green-400' : 'text-red-400'}>
                ${item.price}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
