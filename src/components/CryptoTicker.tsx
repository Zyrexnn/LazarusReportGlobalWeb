import { useState, useEffect, useRef, useMemo } from 'react';
import { getTranslation } from '../utils/i18n';

interface CryptoData {
  symbol: string;
  price: string;
  change: number;
  sparkline: number[];
}

const INITIAL_DATA: CryptoData[] = [
  { symbol: 'BTC', price: '67,234.50', change: 2.34, sparkline: [65000, 65500, 66000, 65800, 66500, 67000, 67234] },
  { symbol: 'ETH', price: '3,456.20', change: 1.87, sparkline: [3300, 3350, 3400, 3380, 3420, 3450, 3456] },
  { symbol: 'GOLD', price: '2,178.30', change: 0.45, sparkline: [2150, 2155, 2160, 2165, 2170, 2175, 2178] },
  { symbol: 'WTI', price: '78.45', change: -1.23, sparkline: [80, 79.5, 79, 78.8, 78.5, 78.6, 78.45] },
  { symbol: 'DOW', price: '39,142', change: 0.67, sparkline: [38800, 38900, 39000, 38950, 39050, 39100, 39142] },
];

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = positive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.5;

    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [data, positive]);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={32}
      className="block"
    />
  );
}

export default function CryptoTicker({ lang = 'en' }: { lang?: string }) {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>(INITIAL_DATA);
  const t = useMemo(() => getTranslation(lang), [lang]);

  useEffect(() => {
    // Try to connect to Binance WebSocket for live data
    let ws: WebSocket | null = null;

    try {
      const streams = ['btcusdt@ticker', 'ethusdt@ticker'].join('/');
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.data) {
            const { s, c, P } = msg.data;
            setCryptoData((prev) =>
              prev.map((item) => {
                if (s === 'BTCUSDT' && item.symbol === 'BTC') {
                  const price = parseFloat(c);
                  return {
                    ...item,
                    price: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    change: parseFloat(P),
                    sparkline: [...item.sparkline.slice(1), price],
                  };
                }
                if (s === 'ETHUSDT' && item.symbol === 'ETH') {
                  const price = parseFloat(c);
                  return {
                    ...item,
                    price: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    change: parseFloat(P),
                    sparkline: [...item.sparkline.slice(1), price],
                  };
                }
                return item;
              })
            );
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => { /* fallback to static data */ };
    } catch { /* WebSocket not available, use static data */ }

    return () => {
      ws?.close();
    };
  }, []);

  return (
    <div className="bg-lazarus-black border-t-2 border-lazarus-gold/80 pt-4">
      <h3 className="text-lazarus-headline text-xs font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
        </span>
        {t.sections.liveMarkets}
      </h3>

      <div className="space-y-3">
        {cryptoData.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between py-2 border-b border-lazarus-border/50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-lazarus-headline text-sm font-bold w-10">{item.symbol}</span>
              <span className="text-lazarus-body text-sm font-mono">${item.price}</span>
            </div>
            <div className="flex items-center gap-3">
              <MiniSparkline data={item.sparkline} positive={item.change >= 0} />
              <span className={`text-xs font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
