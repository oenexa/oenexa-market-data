export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '1d';

export interface Ticker {
  pair: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  turnover24h: number;
  change24hPercent: number;
  vwap: number;
  updatedAt: string;
}

export interface Candle {
  pair: string;
  interval: CandleInterval;
  timestamp: number; // millisecond timestamp of bucket open
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

export interface IngestTrade {
  pair: string;
  price: number;
  quantity: number;
  timestamp?: number;
}
