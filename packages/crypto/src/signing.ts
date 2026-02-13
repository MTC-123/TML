import { ed25519 } from "@noble/curves/ed25519";
import { base58 } from "@scure/base";
import type { AttestationType } from "@tml/types";
import { InvalidSignatureError } from "./errors.js";
import { extractPublicKey } from "./did.js";
import { sha256Hex } from "./hashing.js";

export interface AttestationSigningInput {
  milestoneId: string;
  actorId: string;
  type: AttestationType;
  evidenceHash: string;
  gpsLatitude: string;
  gpsLongitude: string;
  deviceAttestationToken: string;
  timestamp: string;
}

export function signPayload(data: Uint8Array, privateKey: Uint8Array): string {
  const signature = ed25519.sign(data, privateKey);
  return base58.encode(signature);
}

export function verifyPayload(
  data: Uint8Array,
  signature: string,
  publicKey: Uint8Array,
): boolean {
  try {
    const sigBytes = base58.decode(signature);
    return ed25519.verify(sigBytes, data, publicKey);
  } catch {
    return false;
  }
}

export function signAttestation(
  input: AttestationSigningInput,
  privateKey: Uint8Array,
): string {
  const serialized = deterministicSerialize(input);
  const hash = sha256Hex(serialized);
  const hashBytes = new TextEncoder().encode(hash);
  return signPayload(hashBytes, privateKey);
}

export function verifyAttestation(
  input: AttestationSigningInput,
  signature: string,
  did: string,
): boolean {
  try {
    const publicKey = extractPublicKey(did);
    const serialized = deterministicSerialize(input);
    const hash = sha256Hex(serialized);
    const hashBytes = new TextEncoder().encode(hash);
    return verifyPayload(hashBytes, signature, publicKey);
  } catch (error) {
    if (error instanceof InvalidSignatureError) {
      throw error;
    }
    return false;
  }
}

function deterministicSerialize(input: AttestationSigningInput): string {
  const keys = Object.keys(input).sort();
  return JSON.stringify(input, keys);
}
