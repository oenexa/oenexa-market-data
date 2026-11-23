import crypto from 'node:crypto';

export interface AttestedPriceFeed {
  pair: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  epoch: number;
  timestamp: string;
  sourceFeeds: string[];
  digestHex: string;
  signatureBase64: string;
}

export class OracleAttestationService {
  private keyPair: crypto.KeyPairSyncResult<string, string>;
  private epochCounter = 0;

  constructor() {
    this.keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
  }

  public getPublicKeyPem(): string {
    return this.keyPair.publicKey;
  }

  public signPricePayload(params: {
    pair: string;
    price: number;
    bid: number;
    ask: number;
    volume24h: number;
    sourceFeeds?: string[];
  }): AttestedPriceFeed {
    this.epochCounter++;
    const timestamp = new Date().toISOString();
    const sources = params.sourceFeeds || ['BINANCE', 'COINBASE', 'OENEXA_INTERNAL_L2'];

    // Canonical digest format: pair:price:bid:ask:epoch:timestamp
    const canonicalPayload = `${params.pair}:${params.price.toFixed(8)}:${params.bid.toFixed(8)}:${params.ask.toFixed(8)}:${this.epochCounter}:${timestamp}`;
    const digestHex = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    const digestBuf = Buffer.from(digestHex, 'hex');
    const signatureBase64 = crypto.sign(null, digestBuf, this.keyPair.privateKey).toString('base64');

    return {
      pair: params.pair,
      price: params.price,
      bid: params.bid,
      ask: params.ask,
      volume24h: params.volume24h,
      epoch: this.epochCounter,
      timestamp,
      sourceFeeds: sources,
      digestHex,
      signatureBase64,
    };
  }

  public verifyAttestation(feed: AttestedPriceFeed, publicKeyPem: string): boolean {
    const canonicalPayload = `${feed.pair}:${feed.price.toFixed(8)}:${feed.bid.toFixed(8)}:${feed.ask.toFixed(8)}:${feed.epoch}:${feed.timestamp}`;
    const recalculatedDigest = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    if (recalculatedDigest !== feed.digestHex) {
      return false;
    }

    const digestBuf = Buffer.from(feed.digestHex, 'hex');
    return crypto.verify(null, digestBuf, publicKeyPem, Buffer.from(feed.signatureBase64, 'base64'));
  }
}
