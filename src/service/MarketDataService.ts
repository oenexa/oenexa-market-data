import type { Ticker, Candle, CandleInterval, IngestTrade } from '../domain/types.js';

export class MarketDataService {
  private tickers = new Map<string, Ticker>();
  private trades = new Map<string, Array<{ price: number; quantity: number; time: number }>>();
  private candles = new Map<string, Map<number, Candle>>(); // pair:interval -> bucketTimestamp -> Candle

  constructor() {
    this.initTicker('ONXC/USDT', 2.582);
    this.initTicker('BTC/USDT', 91500.0);
    this.initTicker('ETH/USDT', 3350.0);
  }

  private initTicker(pair: string, basePrice: number): void {
    const key = pair.toUpperCase();
    this.tickers.set(key, {
      pair: key,
      lastPrice: basePrice,
      bidPrice: basePrice * 0.9995,
      askPrice: basePrice * 1.0005,
      high24h: basePrice * 1.05,
      low24h: basePrice * 0.95,
      volume24h: 100000,
      turnover24h: 100000 * basePrice,
      change24hPercent: 5.42,
      vwap: basePrice,
      updatedAt: new Date().toISOString(),
    });
    this.trades.set(key, []);
  }

  /**
   * Ingests a new matched trade and updates tickers & candles
   */
  public ingestTrade(trade: IngestTrade): { ticker: Ticker; candle: Candle } {
    const key = trade.pair.toUpperCase();
    const now = trade.timestamp || Date.now();

    // 1. Update rolling trade log
    const pairTrades = this.trades.get(key) || [];
    pairTrades.push({ price: trade.price, quantity: trade.quantity, time: now });
    // Keep 24h rolling window
    const cutoff = now - 24 * 3600 * 1000;
    const active24h = pairTrades.filter((t) => t.time >= cutoff);
    this.trades.set(key, active24h);

    // 2. Compute 24h stats
    let high = trade.price;
    let low = trade.price;
    let vol = 0;
    let turnover = 0;

    for (const t of active24h) {
      if (t.price > high) high = t.price;
      if (t.price < low) low = t.price;
      vol += t.quantity;
      turnover += t.price * t.quantity;
    }

    const vwap = vol > 0 ? turnover / vol : trade.price;
    const firstPrice = active24h.length > 0 ? active24h[0].price : trade.price;
    const changePercent = firstPrice > 0 ? ((trade.price - firstPrice) / firstPrice) * 100 : 0;

    const ticker: Ticker = {
      pair: key,
      lastPrice: trade.price,
      bidPrice: trade.price * 0.9995,
      askPrice: trade.price * 1.0005,
      high24h: high,
      low24h: low,
      volume24h: parseFloat(vol.toFixed(4)),
      turnover24h: parseFloat(turnover.toFixed(2)),
      change24hPercent: parseFloat(changePercent.toFixed(2)),
      vwap: parseFloat(vwap.toFixed(4)),
      updatedAt: new Date(now).toISOString(),
    };
    this.tickers.set(key, ticker);

    // 3. Update 1m candle
    const candle = this.updateCandle(key, '1m', 60_000, trade.price, trade.quantity, now);

    return { ticker, candle };
  }

  private updateCandle(
    pair: string,
    interval: CandleInterval,
    durationMs: number,
    price: number,
    qty: number,
    now: number
  ): Candle {
    const bucketTime = Math.floor(now / durationMs) * durationMs;
    const storageKey = `${pair}:${interval}`;

    let map = this.candles.get(storageKey);
    if (!map) {
      map = new Map<number, Candle>();
      this.candles.set(storageKey, map);
    }

    let candle = map.get(bucketTime);
    if (!candle) {
      candle = {
        pair,
        interval,
        timestamp: bucketTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: qty,
        tradeCount: 1,
      };
    } else {
      if (price > candle.high) candle.high = price;
      if (price < candle.low) candle.low = price;
      candle.close = price;
      candle.volume = parseFloat((candle.volume + qty).toFixed(4));
      candle.tradeCount += 1;
    }

    map.set(bucketTime, candle);
    return candle;
  }

  public getTicker(pair: string): Ticker | undefined {
    return this.tickers.get(pair.toUpperCase());
  }

  public getAllTickers(): Ticker[] {
    return Array.from(this.tickers.values());
  }

  public getCandles(pair: string, interval: CandleInterval = '1m'): Candle[] {
    const map = this.candles.get(`${pair.toUpperCase()}:${interval}`);
    if (!map) return [];
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }
}
