import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encodeQrPayload, decodeQrPayload, validateQrPayloadIntegrity } from './qr-payload.js';
import type { QrPayload } from './qr-payload.js';

describe('QR Payload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('encodeQrPayload', () => {
    it('should return JSON with payload and verifyUrl', () => {
      const now = Math.floor(Date.now() / 1000);
      vi.spyOn(Date, 'now').mockReturnValue(now * 1000);

      const result = encodeQrPayload({
        type: 'CERT',
        hash: 'a'.repeat(64),
        digitalSignature: 'sig1234567890abcdef_extra',
        baseUrl: 'https://tml.example.com',
      });

      const parsed = JSON.parse(result) as { payload: string; verifyUrl: string };

      expect(parsed).toHaveProperty('payload');
      expect(parsed).toHaveProperty('verifyUrl');
      expect(parsed.payload).toBe(`TML:1:CERT:${'a'.repeat(64)}:sig1234567890abc:${now}`);
      expect(parsed.verifyUrl).toBe(`https://tml.example.com/verify?hash=${'a'.repeat(64)}&type=CERT`);
    });
  });

  describe('decodeQrPayload', () => {
    it('should correctly parse an encoded payload', () => {
      const now = Math.floor(Date.now() / 1000);
      vi.spyOn(Date, 'now').mockReturnValue(now * 1000);

      const encoded = encodeQrPayload({
        type: 'ATTEST',
        hash: 'b'.repeat(64),
        digitalSignature: 'abcdef1234567890more',
        baseUrl: 'https://tml.example.com',
      });

      const decoded = decodeQrPayload(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.version).toBe(1);
      expect(decoded!.type).toBe('ATTEST');
      expect(decoded!.hash).toBe('b'.repeat(64));
      expect(decoded!.signaturePrefix).toBe('abcdef1234567890');
      expect(decoded!.timestamp).toBe(now);
      expect(decoded!.verifyUrl).toBe(`https://tml.example.com/verify?hash=${'b'.repeat(64)}&type=ATTEST`);
    });

    it('should return null for invalid input', () => {
      expect(decodeQrPayload('not json at all')).toBeNull();
      expect(decodeQrPayload('{}')).toBeNull();
      expect(decodeQrPayload(JSON.stringify({ payload: 'BAD:FORMAT' }))).toBeNull();
      expect(decodeQrPayload(JSON.stringify({ payload: 'TML:2:CERT:hash:sig:123' }))).toBeNull();
      expect(decodeQrPayload(JSON.stringify({ payload: 'TML:1:INVALID:hash:sig:123' }))).toBeNull();
    });
  });

  describe('validateQrPayloadIntegrity', () => {
    it('should return true when signature prefix matches', () => {
      const payload: QrPayload = {
        version: 1,
        type: 'CERT',
        hash: 'a'.repeat(64),
        signaturePrefix: 'abcdef1234567890',
        timestamp: Math.floor(Date.now() / 1000),
        verifyUrl: 'https://tml.example.com/verify',
      };

      const fullSignature = 'abcdef1234567890restOfTheSignatureHere';
      expect(validateQrPayloadIntegrity(payload, fullSignature)).toBe(true);
    });

    it('should return false when signature prefix does not match', () => {
      const payload: QrPayload = {
        version: 1,
        type: 'CERT',
        hash: 'a'.repeat(64),
        signaturePrefix: 'abcdef1234567890',
        timestamp: Math.floor(Date.now() / 1000),
        verifyUrl: 'https://tml.example.com/verify',
      };

      const fullSignature = 'xxxxxxxxxxxxxxxxrestOfTheSignatureHere';
      expect(validateQrPayloadIntegrity(payload, fullSignature)).toBe(false);
    });
  });
});
