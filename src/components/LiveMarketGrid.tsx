import { useState, useEffect, useRef, useMemo } from 'react';
import { getTranslation } from '../utils/i18n';

// ── Types ──
interface CryptoAsset {
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  flash: 'up' | 'down' | null;
}

const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', pair: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'Ethereum', pair: 'ETH/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB', pair: 'BNB/USDT' },
  { symbol: 'SOLUSDT', name: 'Solana', pair: 'SOL/USDT' },
  { symbol: 'XRPUSDT', name: 'XRP', pair: 'XRP/USDT' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', pair: 'DOGE/USDT' },
  { symbol: 'ADAUSDT', name: 'Cardano', pair: 'ADA/USDT' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', pair: 'AVAX/USDT' },
  { symbol: 'DOTUSDT', name: 'Polkadot', pair: 'DOT/USDT' },
  { symbol: 'LINKUSDT', name: 'Chainlink', pair: 'LINK/USDT' },
];

// ── Helpers ──
function fmtPrice(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}
function fmtChange(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}
function fmtVol(n: number): string {
  if (n === 0) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

// ═══════════════════════════════════════════════════════════════
// LiveMarketGrid — Hero cards + Table, all real-time via WS
// ═══════════════════════════════════════════════════════════════

export default function LiveMarketGrid({ lang = 'en' }: { lang?: string }) {
  const [assets, setAssets] = useState<CryptoAsset[]>(() =>
    SYMBOLS.map(s => ({
      ...s,
      price: 0,
      change24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      quoteVolume24h: 0,
      flash: null,
    }))
  );
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isID = lang === 'id';
  const t = useMemo(() => getTranslation(lang), [lang]);

  // Combined Fetch + Polling for Live Prices (Bypasses ISP Blocking by proxying through Vercel server)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    async function fetchData() {
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) throw new Error('API Sync Failed: Market Data is currently unavailable.');
        const data = await res.json();
        
        if (data && data.crypto && Array.isArray(data.crypto)) {
          setAssets(prev => {
            return prev.map(a => {
              const newData = data.crypto.find((c: any) => c.symbol === a.symbol);
              if (!newData) return a;
              
              const newPrice = newData.price;
              const flash: 'up' | 'down' | null =
                newPrice > a.price && a.price > 0 ? 'up' : newPrice < a.price && a.price > 0 ? 'down' : null;

              if (flash) {
                // Clear flash after 600ms
                setTimeout(() => {
                  setAssets(currentAssets =>
                    currentAssets.map(ca => ca.symbol === a.symbol ? { ...ca, flash: null } : ca)
                  );
                }, 600);
              }

              return {
                ...a,
                price: newPrice,
                change24h: newData.change24h,
                high24h: newData.high24h,
                low24h: newData.low24h,
                volume24h: newData.volume24h,
                quoteVolume24h: newData.quoteVolume24h,
                flash: flash || a.flash,
              };
            });
          });
          setConnected(true);
        }
      } catch (err) {
        setConnected(false);
        const errorMsg = err instanceof Error ? err.message : 'Market data proxy stream failed due to network connectivity.';
        if (!window.sessionStorage.getItem('lazarus_market_error_shown')) {
          window.dispatchEvent(new CustomEvent('lazarus-error', { detail: `[MARKET_STREAM] ${errorMsg}` }));
          window.sessionStorage.setItem('lazarus_market_error_shown', 'true');
        }
      }
    }

    // Initial fetch
    fetchData();
    
    // Poll every 2.5 seconds. Faster polling creates real-time feel bypassing WS block.
    // Our API handles proxying & caching gracefully.
    intervalId = setInterval(fetchData, 2500);

    return () => clearInterval(intervalId);
  }, []);

  const topCrypto = assets.slice(0, 4);
  const loaded = assets[0].price > 0;

  return (
    <div>
      {/* ═══ Connection Status ═══ */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2">
          {connected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500 animate-pulse"></span>
          )}
        </span>
        <span className="text-lazarus-gold text-[10px] font-mono tracking-[0.25em] uppercase">
          {connected
            ? (isID ? 'BINANCE REAL-TIME' : 'BINANCE REAL-TIME')
            : (isID ? 'MENGHUBUNGKAN...' : 'CONNECTING...')}
        </span>
      </div>

      {/* ═══ Hero Cards (Top 4) ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {topCrypto.map((coin) => (
          <div
            key={coin.symbol}
            className={`bg-lazarus-dark border rounded-xl p-3 sm:p-4 relative overflow-hidden group transition-all duration-300 ${
              coin.change24h >= 0
                ? 'border-emerald-500/15 hover:border-emerald-500/30'
                : 'border-red-500/15 hover:border-red-500/30'
            } ${
              coin.flash === 'up' ? 'ring-1 ring-emerald-400/40' :
              coin.flash === 'down' ? 'ring-1 ring-red-400/40' : ''
            }`}
          >
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${
              coin.change24h >= 0 ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lazarus-headline text-xs sm:text-sm font-bold">{coin.name}</span>
                <span className={`text-[10px] sm:text-xs font-mono font-bold transition-colors duration-300 ${
                  coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {loaded ? fmtChange(coin.change24h) : '—'}
                </span>
              </div>
              <div className={`text-lazarus-headline text-base sm:text-lg md:text-xl font-bold font-mono transition-colors duration-300 ${
                coin.flash === 'up' ? 'text-emerald-300' :
                coin.flash === 'down' ? 'text-red-300' : ''
              }`}>
                {loaded ? fmtPrice(coin.price) : (
                  <span className="inline-block w-24 h-6 bg-lazarus-black/40 rounded animate-pulse"></span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lazarus-muted/50 text-[9px] font-mono">{coin.pair}</span>
                <span className="text-lazarus-muted/40 text-[9px] font-mono">
                  {loaded ? `Vol ${fmtVol(coin.quoteVolume24h)}` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Full Crypto Table ═══ */}
      <h2 className="font-serif text-lg sm:text-xl text-lazarus-headline mb-4 flex items-center gap-3">
        <div className="w-1 h-5 bg-lazarus-gold rounded-full"></div>
        {isID ? 'Top 10 Crypto — Real-time' : 'Top 10 Crypto — Real-time'}
      </h2>

      {/* Mobile: card layout */}
      <div className="block sm:hidden space-y-2">
        {assets.map((coin, i) => (
          <div
            key={coin.symbol}
            className={`bg-lazarus-dark border border-lazarus-border rounded-lg p-3 flex items-center justify-between transition-all duration-300 ${
              coin.flash === 'up' ? 'border-emerald-400/30 bg-emerald-500/5' :
              coin.flash === 'down' ? 'border-red-400/30 bg-red-500/5' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lazarus-muted/40 text-[10px] font-mono w-4">{i + 1}</span>
              <div>
                <span className="text-lazarus-headline text-sm font-bold">{coin.name}</span>
                <span className="text-lazarus-muted/50 text-[10px] font-mono block">{coin.pair}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lazarus-headline text-sm font-mono font-bold transition-colors duration-300 ${
                coin.flash === 'up' ? 'text-emerald-300' :
                coin.flash === 'down' ? 'text-red-300' : ''
              }`}>
                {loaded ? fmtPrice(coin.price) : '—'}
              </div>
              <div className={`text-[11px] font-mono font-bold ${
                coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {loaded ? fmtChange(coin.change24h) : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block bg-lazarus-dark border border-lazarus-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-lazarus-border/50 text-lazarus-muted/60">
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-wider">{isID ? 'Aset' : 'Asset'}</th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider">{isID ? 'Harga' : 'Price'}</th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider">24h</th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider hidden md:table-cell">High</th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider hidden md:table-cell">Low</th>
              <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-wider hidden lg:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((coin, i) => (
              <tr
                key={coin.symbol}
                className={`border-b border-lazarus-border/20 transition-all duration-300 ${
                  coin.flash === 'up' ? 'bg-emerald-500/5' :
                  coin.flash === 'down' ? 'bg-red-500/5' :
                  'hover:bg-lazarus-black/30'
                }`}
              >
                <td className="px-4 py-3 text-lazarus-muted/40 font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lazarus-headline font-bold text-sm">{coin.name}</span>
                    <span className="text-lazarus-muted/40 text-[10px] font-mono">{coin.pair}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-mono font-bold text-sm transition-colors duration-300 ${
                  coin.flash === 'up' ? 'text-emerald-300' :
                  coin.flash === 'down' ? 'text-red-300' :
                  'text-lazarus-headline'
                }`}>
                  {loaded ? fmtPrice(coin.price) : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-mono font-bold text-xs ${
                  coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {loaded ? fmtChange(coin.change24h) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-lazarus-muted font-mono text-xs hidden md:table-cell">
                  {loaded ? fmtPrice(coin.high24h) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-lazarus-muted font-mono text-xs hidden md:table-cell">
                  {loaded ? fmtPrice(coin.low24h) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-lazarus-muted font-mono text-xs hidden lg:table-cell">
                  {loaded ? fmtVol(coin.quoteVolume24h) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
