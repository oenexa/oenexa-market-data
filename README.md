# OENEXA Market Data Service (`oenexa-market-data`)

> **Institutional Market Data Streaming, 24h Tickers & OHLCV Candle Aggregator**  
> Governed by the OENEXA FinTech Architecture & Market Data Engineering Organizations.

## 1. Domain Ownership
This repository authoritatively owns the **Market Data Domain**:
- **Owned Data**: Real-time Tickers, 24-hour Rolling Stats, OHLCV Candles (1m, 5m, 15m, 1h, 1d), Volume-Weighted Average Price (VWAP).
- **Owned APIs**: `GET /v1/market-data/tickers`, `GET /v1/market-data/candles`, `GET /v1/market-data/24h-summary`.
- **Database Boundary**: Isolated `oenexa-market-data-prod-db`. Zero shared databases.
