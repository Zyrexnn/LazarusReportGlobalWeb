import { useState, useEffect, useMemo } from 'react';
import { getTranslation } from '../utils/i18n';
import type { FinnhubNewsItem, GlobalMarketMetrics, SentimentData } from '../pages/api/market-data';

// ── Types ──
interface CryptoAsset {
  symbol: string;         // e.g. BTCUSDT (Binance)
  tvSymbol: string;       // e.g. BINANCE:BTCUSDT (TradingView)
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

const SYMBOLS: Omit<CryptoAsset, 'price' | 'change24h' | 'high24h' | 'low24h' | 'volume24h' | 'quoteVolume24h' | 'flash'>[] = [
  // Top 10 Crypto
  { symbol: 'BTCUSDT', tvSymbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', pair: 'BTC/USDT' },
  { symbol: 'ETHUSDT', tvSymbol: 'BINANCE:ETHUSDT', name: 'Ethereum', pair: 'ETH/USDT' },
  { symbol: 'BNBUSDT', tvSymbol: 'BINANCE:BNBUSDT', name: 'BNB', pair: 'BNB/USDT' },
  { symbol: 'SOLUSDT', tvSymbol: 'BINANCE:SOLUSDT', name: 'Solana', pair: 'SOL/USDT' },
  { symbol: 'XRPUSDT', tvSymbol: 'BINANCE:XRPUSDT', name: 'XRP', pair: 'XRP/USDT' },
  { symbol: 'DOGEUSDT', tvSymbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin', pair: 'DOGE/USDT' },
  { symbol: 'ADAUSDT', tvSymbol: 'BINANCE:ADAUSDT', name: 'Cardano', pair: 'ADA/USDT' },
  { symbol: 'AVAXUSDT', tvSymbol: 'BINANCE:AVAXUSDT', name: 'Avalanche', pair: 'AVAX/USDT' },
  { symbol: 'DOTUSDT', tvSymbol: 'BINANCE:DOTUSDT', name: 'Polkadot', pair: 'DOT/USDT' },
  { symbol: 'LINKUSDT', tvSymbol: 'BINANCE:LINKUSDT', name: 'Chainlink', pair: 'LINK/USDT' },
  
  // High Cap Crypto
  { symbol: 'TRXUSDT', tvSymbol: 'BINANCE:TRXUSDT', name: 'TRON', pair: 'TRX/USDT' },
  { symbol: 'SHIBUSDT', tvSymbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu', pair: 'SHIB/USDT' },
  { symbol: 'LTCUSDT', tvSymbol: 'BINANCE:LTCUSDT', name: 'Litecoin', pair: 'LTC/USDT' },
  { symbol: 'BCHUSDT', tvSymbol: 'BINANCE:BCHUSDT', name: 'Bitcoin Cash', pair: 'BCH/USDT' },
  { symbol: 'UNIUSDT', tvSymbol: 'BINANCE:UNIUSDT', name: 'Uniswap', pair: 'UNI/USDT' },
  { symbol: 'NEARUSDT', tvSymbol: 'BINANCE:NEARUSDT', name: 'NEAR Protocol', pair: 'NEAR/USDT' },
  { symbol: 'APTUSDT', tvSymbol: 'BINANCE:APTUSDT', name: 'Aptos', pair: 'APT/USDT' },
  { symbol: 'ICPUSDT', tvSymbol: 'BINANCE:ICPUSDT', name: 'Internet Computer', pair: 'ICP/USDT' },
  { symbol: 'XLMUSDT', tvSymbol: 'BINANCE:XLMUSDT', name: 'Stellar', pair: 'XLM/USDT' },
  { symbol: 'FILUSDT', tvSymbol: 'BINANCE:FILUSDT', name: 'Filecoin', pair: 'FIL/USDT' },
  { symbol: 'ARBUSDT', tvSymbol: 'BINANCE:ARBUSDT', name: 'Arbitrum', pair: 'ARB/USDT' },
  { symbol: 'RNDRUSDT', tvSymbol: 'BINANCE:RNDRUSDT', name: 'Render', pair: 'RNDR/USDT' },
  { symbol: 'VETUSDT', tvSymbol: 'BINANCE:VETUSDT', name: 'VeChain', pair: 'VET/USDT' },
  { symbol: 'HBARUSDT', tvSymbol: 'BINANCE:HBARUSDT', name: 'Hedera', pair: 'HBAR/USDT' },
  { symbol: 'LDOUSDT', tvSymbol: 'BINANCE:LDOUSDT', name: 'Lido DAO', pair: 'LDO/USDT' },
  { symbol: 'OPUSDT', tvSymbol: 'BINANCE:OPUSDT', name: 'Optimism', pair: 'OP/USDT' },
  { symbol: 'GRTUSDT', tvSymbol: 'BINANCE:GRTUSDT', name: 'The Graph', pair: 'GRT/USDT' },
  { symbol: 'INJUSDT', tvSymbol: 'BINANCE:INJUSDT', name: 'Injective', pair: 'INJ/USDT' },
  { symbol: 'RUNEUSDT', tvSymbol: 'BINANCE:RUNEUSDT', name: 'THORChain', pair: 'RUNE/USDT' },
  { symbol: 'THETAUSDT', tvSymbol: 'BINANCE:THETAUSDT', name: 'Theta Network', pair: 'THETA/USDT' },
  { symbol: 'FTMUSDT', tvSymbol: 'BINANCE:FTMUSDT', name: 'Fantom', pair: 'FTM/USDT' },
  { symbol: 'ALGOUSDT', tvSymbol: 'BINANCE:ALGOUSDT', name: 'Algorand', pair: 'ALGO/USDT' },
  { symbol: 'FLOWUSDT', tvSymbol: 'BINANCE:FLOWUSDT', name: 'Flow', pair: 'FLOW/USDT' },
  { symbol: 'TIAUSDT', tvSymbol: 'BINANCE:TIAUSDT', name: 'Celestia', pair: 'TIA/USDT' },
  { symbol: 'SNXUSDT', tvSymbol: 'BINANCE:SNXUSDT', name: 'Synthetix', pair: 'SNX/USDT' },
  { symbol: 'MANAUSDT', tvSymbol: 'BINANCE:MANAUSDT', name: 'Decentraland', pair: 'MANA/USDT' },
  { symbol: 'SANDUSDT', tvSymbol: 'BINANCE:SANDUSDT', name: 'The Sandbox', pair: 'SAND/USDT' },
  { symbol: 'AXSUSDT', tvSymbol: 'BINANCE:AXSUSDT', name: 'Axie Infinity', pair: 'AXS/USDT' },
  { symbol: 'AAVEUSDT', tvSymbol: 'BINANCE:AAVEUSDT', name: 'Aave', pair: 'AAVE/USDT' },
  { symbol: 'QNTUSDT', tvSymbol: 'BINANCE:QNTUSDT', name: 'Quant', pair: 'QNT/USDT' },
  { symbol: 'EGLDUSDT', tvSymbol: 'BINANCE:EGLDUSDT', name: 'MultiversX', pair: 'EGLD/USDT' },
  { symbol: 'SEIUSDT', tvSymbol: 'BINANCE:SEIUSDT', name: 'Sei', pair: 'SEI/USDT' },
  { symbol: 'SUIUSDT', tvSymbol: 'BINANCE:SUIUSDT', name: 'Sui', pair: 'SUI/USDT' },
  { symbol: 'STXUSDT', tvSymbol: 'BINANCE:STXUSDT', name: 'Stacks', pair: 'STX/USDT' },
  { symbol: 'NEOUSDT', tvSymbol: 'BINANCE:NEOUSDT', name: 'Neo', pair: 'NEO/USDT' },
  { symbol: 'EOSUSDT', tvSymbol: 'BINANCE:EOSUSDT', name: 'EOS', pair: 'EOS/USDT' },
  { symbol: 'XTZUSDT', tvSymbol: 'BINANCE:XTZUSDT', name: 'Tezos', pair: 'XTZ/USDT' },
  { symbol: 'WLDUSDT', tvSymbol: 'BINANCE:WLDUSDT', name: 'Worldcoin', pair: 'WLD/USDT' },
  { symbol: 'PEPEUSDT', tvSymbol: 'BINANCE:PEPEUSDT', name: 'Pepe', pair: 'PEPE/USDT' },
  
  // Major Indices & Commodities
  { symbol: 'SPX', tvSymbol: 'SP:SPX', name: 'S&P 500', pair: 'SPX' },
  { symbol: 'NDX', tvSymbol: 'NASDAQ:NDX', name: 'Nasdaq 100', pair: 'NDX' },
  { symbol: 'DJI', tvSymbol: 'TVC:DJI', name: 'Dow Jones', pair: 'DJI' },
  { symbol: 'RUT', tvSymbol: 'TVC:RUT', name: 'Russell 2000', pair: 'RUT' },
  { symbol: 'VIX', tvSymbol: 'CBOE:VIX', name: 'Volatility Index', pair: 'VIX' },
  { symbol: 'GOLD', tvSymbol: 'TVC:GOLD', name: 'Gold', pair: 'XAU/USD' },
  { symbol: 'SILVER', tvSymbol: 'TVC:SILVER', name: 'Silver', pair: 'XAG/USD' },
  { symbol: 'USOIL', tvSymbol: 'TVC:USOIL', name: 'Crude Oil WTI', pair: 'WTI' },
  { symbol: 'UKOIL', tvSymbol: 'TVC:UKOIL', name: 'Brent Oil', pair: 'BRENT' },
  { symbol: 'NATGAS', tvSymbol: 'TVC:NATGAS', name: 'Natural Gas', pair: 'NGAS' },
  { symbol: 'COPPER', tvSymbol: 'TVC:COPPER', name: 'Copper', pair: 'HG1!' },
  { symbol: 'DXY', tvSymbol: 'TVC:DXY', name: 'US Dollar Index', pair: 'DXY' },

  // Forex Majors
  { symbol: 'EURUSD', tvSymbol: 'FX:EURUSD', name: 'Euro / US Dollar', pair: 'EUR/USD' },
  { symbol: 'GBPUSD', tvSymbol: 'FX:GBPUSD', name: 'British Pound / US Dollar', pair: 'GBP/USD' },
  { symbol: 'USDJPY', tvSymbol: 'FX:USDJPY', name: 'US Dollar / Japanese Yen', pair: 'USD/JPY' },
  { symbol: 'USDCAD', tvSymbol: 'FX:USDCAD', name: 'US Dollar / Canadian Dollar', pair: 'USD/CAD' },
  { symbol: 'AUDUSD', tvSymbol: 'FX:AUDUSD', name: 'Australian Dollar / US Dollar', pair: 'AUD/USD' },
  { symbol: 'USDCHF', tvSymbol: 'FX:USDCHF', name: 'US Dollar / Swiss Franc', pair: 'USD/CHF' },
];

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
function timeAgo(ts: number): string {
  const diff = Date.now() - ts * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface Props {
  lang?: string;
  news: FinnhubNewsItem[];
  global: GlobalMarketMetrics | null;
  sentiment: SentimentData | null;
}

export default function MarketDashboard({ lang = 'en', news, global, sentiment }: Props) {
  const isID = lang === 'id';
  const t = useMemo(() => getTranslation(lang), [lang]);

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
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'news'>('watchlist');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(a => 
    a.pair.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the selected asset object
  const selectedAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  // ── Long Polling using existing API ──
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    async function fetchData() {
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) throw new Error('API Sync Failed');
        const data = await res.json();
        
        if (data && data.crypto && Array.isArray(data.crypto)) {
          setAssets(prev => {
            return prev.map(a => {
              const newData = data.crypto.find((c: any) => c.symbol === a.symbol);
              if (!newData) return a; // Keep existing if not in binance (like GOLD/DXY)
              
              const newPrice = newData.price;
              const flash: 'up' | 'down' | null =
                newPrice > a.price && a.price > 0 ? 'up' : newPrice < a.price && a.price > 0 ? 'down' : null;

              if (flash) {
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
      } catch (error) {
        setConnected(false);
      }
    }

    fetchData();
    intervalId = setInterval(fetchData, 2500); // 2.5s polling for "realtime" feel
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col h-auto min-h-[85vh] text-lazarus-body">
      
      {/* ── Top Bar Metrics ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-lazarus-dark border border-lazarus-border/30 rounded-xl p-3 sm:px-5">
        <div className="flex gap-4 sm:gap-8 flex-wrap">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-lazarus-muted/60 mb-0.5">Market Status</div>
            <div className="flex items-center gap-2">
              <span className={`relative flex h-2 w-2`}>
                {connected ? (
                  <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span></>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500 animate-pulse"></span>
                )}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {connected ? "LIVE" : "SYNCING"}
              </span>
            </div>
          </div>
          
          {global && (
            <>
              <div className="border-l border-lazarus-border/30 pl-4 hidden sm:block">
                <div className="text-[9px] uppercase tracking-wider text-lazarus-muted/60 mb-0.5">Global Market Cap</div>
                <div className="text-xs font-mono font-bold">{fmtPrice(global.totalMarketCap)}</div>
              </div>
              <div className="border-l border-lazarus-border/30 pl-4">
                <div className="text-[9px] uppercase tracking-wider text-lazarus-muted/60 mb-0.5">Dominance</div>
                <div className="text-xs font-mono font-bold flex gap-2">
                  <span className="text-orange-400">BTC {global.btcDominance.toFixed(1)}%</span>
                  <span className="text-blue-400">ETH {global.ethDominance.toFixed(1)}%</span>
                </div>
              </div>
            </>
          )}

          {sentiment && (
            <div className="border-l border-lazarus-border/30 pl-4 hidden md:block">
              <div className="text-[9px] uppercase tracking-wider text-lazarus-muted/60 mb-0.5">Sentiment</div>
              <div className={`text-xs font-mono font-bold uppercase ${sentiment.value > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sentiment.value} / {sentiment.label}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Dashboard Layout ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* ── Left Column: Chart & Stats ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-[500px] lg:h-[700px]">
          
          {/* Main Chart Area */}
          <div className="flex-1 bg-[#0f0f0f] border border-lazarus-border/30 rounded-xl overflow-hidden relative group">
            {/* Asset Overlay Header (Broker style) */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-b from-lazarus-black view-border-none to-transparent pointer-events-none flex justify-between items-start">
               <div>
                  <h2 className="text-2xl font-bold font-serif text-lazarus-headline drop-shadow-md">{selectedAsset.name}</h2>
                  <div className="text-xs font-mono text-lazarus-gold drop-shadow-md">{selectedAsset.pair}</div>
               </div>
            </div>

            {/* TradingView Advanced Widget */}
            <iframe
               key={selectedSymbol} // Force entirely new un-cached frame on symbol change
               src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_${selectedSymbol.replace(/[^a-zA-Z0-9]/g, '')}&symbol=${encodeURIComponent(selectedAsset.tvSymbol)}&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=0f0f0f&studies=&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1&showpopupbutton=0&showvolume=1&locale=en`}
               className="w-full h-full border-0 absolute inset-0"
               title={`${selectedAsset.name} Interactive Chart`}
            ></iframe>
          </div>

          {/* Stats Bar (Binance real-time data) */}
          <div className="h-auto lg:h-24 bg-lazarus-dark border border-lazarus-border/30 rounded-xl p-4 flex items-center justify-between overflow-x-auto gap-6 shrink-0 custom-scrollbar">
            <div className="min-w-fit">
              <div className="text-[10px] uppercase text-lazarus-muted/50 mb-1">Live Price</div>
              <div className={`text-xl md:text-2xl font-mono font-bold transition-colors duration-300 ${
                  selectedAsset.flash === 'up' ? 'text-emerald-400' :
                  selectedAsset.flash === 'down' ? 'text-red-400' : 'text-lazarus-headline'
              }`}>
                 {selectedAsset.price > 0 ? fmtPrice(selectedAsset.price) : 'No Data'}
              </div>
            </div>
            
            <div className="min-w-fit border-l border-lazarus-border/20 pl-6">
              <div className="text-[10px] uppercase text-lazarus-muted/50 mb-1">24h Change</div>
              <div className={`text-sm md:text-base font-mono font-bold ${selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                 {selectedAsset.price > 0 ? fmtChange(selectedAsset.change24h) : '—'}
              </div>
            </div>

            <div className="min-w-fit border-l border-lazarus-border/20 pl-6 hidden md:block">
              <div className="text-[10px] uppercase text-lazarus-muted/50 mb-1">24h High</div>
              <div className="text-sm md:text-base font-mono text-lazarus-headline">{selectedAsset.price > 0 ? fmtPrice(selectedAsset.high24h) : '—'}</div>
            </div>

            <div className="min-w-fit border-l border-lazarus-border/20 pl-6 hidden md:block">
              <div className="text-[10px] uppercase text-lazarus-muted/50 mb-1">24h Low</div>
              <div className="text-sm md:text-base font-mono text-lazarus-headline">{selectedAsset.price > 0 ? fmtPrice(selectedAsset.low24h) : '—'}</div>
            </div>

            <div className="min-w-fit border-l border-lazarus-border/20 pl-6">
              <div className="text-[10px] uppercase text-lazarus-muted/50 mb-1">24h Volume</div>
              <div className="text-sm md:text-base font-mono text-lazarus-headline">{selectedAsset.price > 0 ? fmtVol(selectedAsset.quoteVolume24h) : '—'}</div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Sidebar (Watchlist & News) ── */}
        <div className="lg:w-[360px] flex flex-col bg-[#121212] border border-lazarus-border/30 rounded-xl overflow-hidden shrink-0 h-[500px] lg:h-[700px]">
          
          {/* Tabs */}
          <div className="flex border-b border-lazarus-border/30 bg-[#0a0a0a]">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold transition-all border-b-2 ${
                activeTab === 'watchlist' ? 'border-lazarus-gold text-lazarus-gold bg-lazarus-gold/5' : 'border-transparent text-lazarus-muted hover:text-white hover:bg-white/5'
              }`}
            >
              Watchlist
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex-1 py-3 text-[11px] uppercase tracking-widest font-bold transition-all border-b-2 ${
                activeTab === 'news' ? 'border-lazarus-gold text-lazarus-gold bg-lazarus-gold/5' : 'border-transparent text-lazarus-muted hover:text-white hover:bg-white/5'
              }`}
            >
              Latest News
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* Watchlist Content */}
            <div className={`${activeTab === 'watchlist' ? 'block' : 'hidden'} divide-y divide-lazarus-border/10`}>
              {/* Search Bar */}
              <div className="p-3 border-b border-lazarus-border/30 bg-[#121212] sticky top-0 z-20">
                <input
                  type="text"
                  placeholder="Search coin or index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-lazarus-border/30 rounded px-3 py-2 text-xs text-lazarus-headline focus:outline-none focus:border-lazarus-gold transition-colors"
                />
              </div>
              {/* Header Row */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr] px-4 py-2 sticky top-[53px] bg-[#121212]/95 backdrop-blur z-10 border-b border-lazarus-border/30 text-[9px] uppercase tracking-wider text-lazarus-muted/50 font-mono">
                 <div>Asset</div>
                 <div className="text-right">Price</div>
                 <div className="text-right">24h</div>
              </div>
              
              {/* ListView */}
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-xs text-lazarus-muted italic">No assets found.</div>
              ) : (
                filteredAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedSymbol(asset.symbol)}
                  className={`w-full grid grid-cols-[1.5fr_1fr_1fr] items-center px-4 py-3 text-left transition-colors hover:bg-white/5 group ${
                    selectedSymbol === asset.symbol ? 'bg-lazarus-gold/5 before:absolute before:left-0 before:w-1 before:h-full before:bg-lazarus-gold relative' : ''
                  }`}
                >
                  <div className="font-bold text-sm text-lazarus-headline group-hover:text-lazarus-gold transition-colors truncate pr-2">
                    {asset.pair}
                  </div>
                  
                  <div className={`text-right text-xs font-mono font-bold transition-colors duration-300 ${
                     asset.flash === 'up' ? 'text-emerald-400' :
                     asset.flash === 'down' ? 'text-red-400' : 'text-lazarus-body'
                  }`}>
                    {asset.price > 0 ? fmtPrice(asset.price) : '—'}
                  </div>
                  
                  <div className={`text-right text-xs font-mono font-bold ${
                    asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {asset.price > 0 ? fmtChange(asset.change24h) : '—'}
                  </div>
                </button>
              )))}
            </div>

            {/* News Content */}
            <div className={`${activeTab === 'news' ? 'block' : 'hidden'} p-2 space-y-2`}>
              {news.length === 0 ? (
                 <div className="p-4 text-center text-xs text-lazarus-muted italic">No market news available.</div>
              ) : (
                news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-2 bg-lazarus-black/40 border border-lazarus-border/20 hover:border-lazarus-gold/40 rounded-lg group transition-all"
                  >
                    <div className="w-16 h-16 shrink-0 rounded overflow-hidden bg-[#0a0a0a]">
                       <img 
                         src={item.image || 'https://images.unsplash.com/photo-1611974717424-36cfaf41009e?w=200&q=80&fit=crop'} 
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                         alt=""
                         onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974717424-36cfaf41009e?w=200&q=80&fit=crop'; }}
                       />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                       <h4 className="text-[11px] sm:text-xs font-serif font-bold text-lazarus-headline leading-snug line-clamp-2 group-hover:text-lazarus-gold transition-colors">
                         {item.headline}
                       </h4>
                       <div className="text-[9px] font-mono text-lazarus-muted/60 lowercase mt-1">
                          {timeAgo(item.datetime)}
                       </div>
                    </div>
                  </a>
                ))
              )}
            </div>
            
          </div>
        </div>

      </div>

      <style>{`
        /* Minimalist scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.4); 
        }
      `}</style>
    </div>
  );
}
