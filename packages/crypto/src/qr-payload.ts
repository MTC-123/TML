/**
 * QR Payload format for TML certificates.
 * Compact encoding for QR codes.
 *
 * Format: TML:1:<type>:<hash>:<signature-prefix>:<timestamp>
 * - Version: 1
 * - Type: CERT (certificate) | ATTEST (attestation) | VC (credential)
 * - Hash: SHA-256 hash (64 hex chars)
 * - Signature prefix: first 16 chars of digital signature
 * - Timestamp: Unix epoch seconds
 */

export type QrPayloadType = 'CERT' | 'ATTEST' | 'VC';

export interface QrPayload {
  version: number;
  type: QrPayloadType;
  hash: string;
  signaturePrefix: string;
  timestamp: number;
  verifyUrl: string;
}

export interface EncodeQrPayloadInput {
  type: QrPayloadType;
  hash: string;
  digitalSignature: string;
  baseUrl: string;
}

export function encodeQrPayload(input: EncodeQrPayloadInput): string {
  const { type, hash, digitalSignature, baseUrl } = input;
  const timestamp = Math.floor(Date.now() / 1000);
  const sigPrefix = digitalSignature.slice(0, 16);
  const payload = `TML:1:${type}:${hash}:${sigPrefix}:${timestamp}`;
  const verifyUrl = `${baseUrl}/verify?hash=${hash}&type=${type}`;
  return JSON.stringify({ payload, verifyUrl });
}

export function decodeQrPayload(encoded: string): QrPayload | null {
  try {
    const parsed = JSON.parse(encoded) as { payload?: string; verifyUrl?: string };
    if (!parsed.payload) return null;

    const parts = parsed.payload.split(':');
    if (parts.length !== 6 || parts[0] !== 'TML' || parts[1] !== '1') return null;

    const type = parts[2] as QrPayloadType;
    if (!['CERT', 'ATTEST', 'VC'].includes(type)) return null;

    return {
      version: 1,
      type,
      hash: parts[3]!,
      signaturePrefix: parts[4]!,
      timestamp: parseInt(parts[5]!, 10),
      verifyUrl: parsed.verifyUrl ?? '',
    };
  } catch {
    return null;
  }
}

export function validateQrPayloadIntegrity(payload: QrPayload, fullSignature: string): boolean {
  return fullSignature.startsWith(payload.signaturePrefix);
}
