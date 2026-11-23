import { describe, it, expect } from 'vitest';
import { OracleAttestationService } from '../service/OracleAttestationService.js';

describe('OracleAttestationService Cryptographic Price Signatures', () => {
  const oracle = new OracleAttestationService();

  it('generates an Ed25519-signed price attestation that verifies successfully', () => {
    const feed = oracle.signPricePayload({
      pair: 'BTC/USDT',
      price: 65420.5,
      bid: 65420.0,
      ask: 65421.0,
      volume24h: 12450.8,
    });

    expect(feed.epoch).toBe(1);
    expect(feed.digestHex).toBeDefined();
    expect(feed.signatureBase64).toBeDefined();

    const isValid = oracle.verifyAttestation(feed, oracle.getPublicKeyPem());
    expect(isValid).toBe(true);
  });

  it('rejects tampered price feeds where the price value was altered in transit', () => {
    const feed = oracle.signPricePayload({
      pair: 'ONXC/USDT',
      price: 4.5,
      bid: 4.49,
      ask: 4.51,
      volume24h: 890000.0,
    });

    // Tamper with price (e.g. Flash loan / oracle manipulation attack)
    feed.price = 45.0;

    const isValid = oracle.verifyAttestation(feed, oracle.getPublicKeyPem());
    expect(isValid).toBe(false);
  });
});
