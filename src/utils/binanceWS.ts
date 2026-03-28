type BinanceListener = (data: { symbol: string; price: number; change: number }) => void;

class BinanceWSManager {
  private ws: WebSocket | null = null;
  private listeners: Set<BinanceListener> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;

  private connect() {
    if (this.ws || typeof window === 'undefined') return;
    try {
      // Crypto pairs dari Binance + Gold (PAXG adalah gold-backed token)
      const streams = [
        'btcusdt@ticker',    // Bitcoin
        'ethusdt@ticker',    // Ethereum
        'paxgusdt@ticker',   // PAX Gold (gold-backed crypto, 1 PAXG = 1 troy ounce gold)
      ].join('/');
      
      this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.data) {
            const { s, c, P } = msg.data;
            
            // Map symbol names
            const symbolMap: Record<string, string> = {
              'BTCUSDT': 'BTC',
              'ETHUSDT': 'ETH',
              'PAXGUSDT': 'GOLD', // PAXG sebagai proxy untuk harga gold
            };
            
            const symbol = symbolMap[s];
            if (symbol) {
              const price = parseFloat(c);
              const change = parseFloat(P);
              this.listeners.forEach((listener) => listener({ symbol, price, change }));
            }
          }
        } catch {}
      };

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[Binance WS] Connected - Streaming BTC, ETH, GOLD (PAXG)');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        console.log('[Binance WS] Disconnected');
        
        if (this.listeners.size > 0 && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 5000);
        }
      };

      this.ws.onerror = () => {
        // Will be handled by onclose
      };
    } catch {}
  }

  public subscribe(listener: BinanceListener) {
    this.listeners.add(listener);
    if (!this.isConnected && !this.ws) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.connect();
    }
    
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        setTimeout(() => {
          if (this.listeners.size === 0 && this.ws) {
            this.ws.close();
            this.ws = null;
          }
        }, 5000); // 5 sec buffer before closing completely
      }
    };
  }
}

export const binanceWSManager = new BinanceWSManager();
export const subscribeToBinance = (listener: BinanceListener) => binanceWSManager.subscribe(listener);
