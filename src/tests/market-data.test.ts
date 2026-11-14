import { describe, it, expect } from 'vitest';
import { MarketDataService } from '../service/MarketDataService.js';

describe('OENEXA Market Data Streaming Engine', () => {
  it('initializes canonical tickers with baseline quotes', () => {
    const service = new MarketDataService();
    const ticker = service.getTicker('ONXC/USDT');

    expect(ticker).toBeDefined();
    expect(ticker?.lastPrice).toBe(2.582);
    expect(ticker?.bidPrice).toBeLessThan(ticker?.askPrice || 0);
  });

  it('ingests trade executions and computes 24h rolling high/low/volume/vwap', () => {
    const service = new MarketDataService();
    const now = Date.now();

    service.ingestTrade({ pair: 'ONXC/USDT', price: 2.60, quantity: 100, timestamp: now - 1000 });
    const { ticker, candle } = service.ingestTrade({ pair: 'ONXC/USDT', price: 2.70, quantity: 200, timestamp: now });

    expect(ticker.lastPrice).toBe(2.70);
    expect(ticker.high24h).toBe(2.70);
    expect(ticker.low24h).toBe(2.60);
    expect(ticker.volume24h).toBe(300);

    // VWAP = (2.60 * 100 + 2.70 * 200) / 300 = (260 + 540) / 300 = 800 / 300 = 2.6667
    expect(ticker.vwap).toBeCloseTo(2.6667, 3);

    // Candle check
    expect(candle.open).toBe(2.60);
    expect(candle.high).toBe(2.70);
    expect(candle.low).toBe(2.60);
    expect(candle.close).toBe(2.70);
    expect(candle.volume).toBe(300);
    expect(candle.tradeCount).toBe(2);
  });
});
