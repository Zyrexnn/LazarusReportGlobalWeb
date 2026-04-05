import type { APIRoute } from 'astro';

// ═══════════════════════════════════════════════════════════════
// Multi-Source Market Data API
// CoinMarketCap: Global Market Metrics
// Alternative.me: Fear & Greed Index
// Finnhub: Market News
// ═══════════════════════════════════════════════════════════════

export interface MarketAsset {
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export interface FinnhubNewsItem {
  headline: string;
  summary: string;
  url: string;
  source: string;
  image: string;
  datetime: number;
  category: string;
}

export interface GlobalMarketMetrics {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  activeCryptos: number;
}

export interface SentimentData {
  value: number;
  label: string;
}

export interface MarketDataResponse {
  crypto: MarketAsset[];
  news: FinnhubNewsItem[];
  global: GlobalMarketMetrics | null;
  sentiment: SentimentData | null;
  updatedAt: string;
  errors: string[];
}

// ── Cache ──
interface CacheEntry<T> { data: T; expiry: number; }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 2000; // 2 seconds for real-time polling bypassing ISP blocks!

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiry) return entry.data;
  // Don't delete immediately, let setCache overwrite it to avoid race conditions.
  return null;
}
function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ── 1) Binance 24h Tickers ──
const BINANCE_SYMBOLS = [
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
  { symbol: 'PAXGUSDT', name: 'Pax Gold', pair: 'PAXG/USDT' },
];

async function fetchBinanceTickers(): Promise<MarketAsset[]> {
  try {
    const symbols = BINANCE_SYMBOLS.map(s => `"${s.symbol}"`).join(',');
    const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=[${symbols}]`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('Binance error');
    const data = await res.json();
    return data.map((ticker: any) => {
      const config = BINANCE_SYMBOLS.find(s => s.symbol === ticker.symbol);
      return {
        symbol: ticker.symbol,
        name: config?.name ?? ticker.symbol,
        pair: config?.pair ?? ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.volume),
        quoteVolume24h: parseFloat(ticker.quoteVolume),
      };
    });
  } catch { return []; }
}

// ── 2) CoinMarketCap Global Metrics ──
async function fetchCMCGlobal(apiKey: string): Promise<GlobalMarketMetrics | null> {
  try {
    const res = await fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
      headers: { 'X-CMC_PRO_API_KEY': apiKey },
      signal: AbortSignal.timeout(8000)
    });
    const json = await res.json();
    const d = json.data;
    return {
      btcDominance: d.btc_dominance,
      ethDominance: d.eth_dominance,
      totalMarketCap: d.quote.USD.total_market_cap,
      totalVolume24h: d.quote.USD.total_volume_24h,
      marketCapChange24h: d.quote.USD.total_market_cap_yesterday_percentage_change,
      activeCryptos: d.active_cryptocurrencies
    };
  } catch { return null; }
}

// ── 3) Fear & Greed Sentiment (Alternative.me) ──
async function fetchSentiment(): Promise<SentimentData | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/', { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    const data = json.data[0];
    return {
      value: parseInt(data.value),
      label: data.value_classification
    };
  } catch { return null; }
}

// ── 4) Market News ──
async function fetchMarketNews(apiKey: string): Promise<FinnhubNewsItem[]> {
  try {
    const [genRes, cryptoRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`),
      fetch(`https://finnhub.io/api/v1/news?category=crypto&token=${apiKey}`)
    ]);
    let articles = [];
    if (genRes.ok) articles.push(...(await genRes.json()).slice(0, 10));
    if (cryptoRes.ok) articles.push(...(await cryptoRes.json()).slice(0, 10));
    articles.sort((a, b) => b.datetime - a.datetime);
    const seen = new Set();
    return articles.filter(a => {
      const key = a.headline.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 12);
  } catch { return []; }
}

// --- Core Data Fetching Logic (Exported for direct SSR use) ---
export async function getMarketData(): Promise<MarketDataResponse> {
  const finnhubKey = import.meta.env.FINNHUB_API_KEY ?? '';
  const cmcKey = import.meta.env.CMC_API_KEY ?? '';
  
  const cacheKey = 'market_data_v3';
  const cached = getCached<MarketDataResponse>(cacheKey);
  if (cached) return cached;

  try {
    const [crypto, news, global, sentiment] = await Promise.all([
      fetchBinanceTickers(),
      finnhubKey ? fetchMarketNews(finnhubKey) : Promise.resolve([]),
      cmcKey ? fetchCMCGlobal(cmcKey) : Promise.resolve(null),
      fetchSentiment(),
    ]);

    const response: MarketDataResponse = {
      crypto,
      news,
      global,
      sentiment,
      updatedAt: new Date().toISOString(),
      errors: [],
    };

    setCache(cacheKey, response);
    return response;
  } catch (err) {
    console.error('[Market Data API] Error fetching:', err);
    return {
      crypto: [],
      news: [],
      global: null,
      sentiment: null,
      updatedAt: new Date().toISOString(),
      errors: ['Failed to fetch external market data'],
    };
  }
}

// ── API Handler (Standard HTTP GET) ──
export const GET: APIRoute = async ({ request }) => {
  // --- Security Check (Basic Anti-Injection & Origin protection) ---
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // Only allow requests from our own host/origin or local dev
  if (origin && !origin.includes(host || '') && !origin.includes('localhost')) {
    return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 403 });
  }

  const data = await getMarketData();
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

