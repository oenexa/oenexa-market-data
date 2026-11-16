import http from 'node:http';
import { MarketDataService } from './service/MarketDataService.js';

export * from './domain/types.js';
export * from './service/MarketDataService.js';

const md = new MarketDataService();
const PORT = Number(process.env.PORT) || 8085;

export const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: 'UP', service: 'oenexa-market-data', timestamp: new Date().toISOString() }));
  }

  if (req.url === '/api/market-data/tickers' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({ success: true, data: md.getAllTickers() }));
  }

  if (req.url?.startsWith('/api/market-data/ticker') && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pair = url.searchParams.get('pair') || 'ONXC/USDT';
    const ticker = md.getTicker(pair);
    res.writeHead(200);
    return res.end(JSON.stringify({ success: true, data: ticker }));
  }

  res.writeHead(404);
  return res.end(JSON.stringify({ success: false, error: 'Endpoint Not Found' }));
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[oenexa-market-data] Market Data Streaming Microservice listening on port ${PORT}`);
  });
}
